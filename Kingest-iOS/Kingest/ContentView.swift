import SwiftUI
import WebKit
import PassKit

struct ContentView: View {
    var body: some View {
        WebView()
            .ignoresSafeArea()
            .statusBarHidden(false)
            .preferredColorScheme(.dark)
    }
}

struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.javaScriptEnabled = true

        // Register message handlers for fetch bridge and Apple Pay
        let uc = config.userContentController
        uc.add(context.coordinator, name: "kingestFetch")
        uc.add(context.coordinator, name: "kingestApplePay")

        // Inject __KINGEST_FETCH and __KINGEST_APPLEPAY JS bridge functions
        let bridgeJS = """
        window.__KINGEST_FETCH = function(url, callbackName) {
            window.webkit.messageHandlers.kingestFetch.postMessage({url: url, callback: callbackName});
        };
        window.__KINGEST_APPLEPAY = function(amount, currency, label) {
            window.webkit.messageHandlers.kingestApplePay.postMessage({amount: amount, currency: currency, label: label});
        };
        window.__KINGEST_APPLEPAY_AVAILABLE = function() {
            return true;
        };
        """
        let script = WKUserScript(source: bridgeJS, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        uc.addUserScript(script)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 10/255, green: 14/255, blue: 26/255, alpha: 1)
        webView.scrollView.backgroundColor = UIColor(red: 10/255, green: 14/255, blue: 26/255, alpha: 1)
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        let refresh = UIRefreshControl()
        refresh.tintColor = .white
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.handleRefresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refresh

        if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "Web") {
            let htmlURL = URL(fileURLWithPath: htmlPath)
            let webDir = htmlURL.deletingLastPathComponent()
            webView.loadFileURL(htmlURL, allowingReadAccessTo: webDir)
        }

        webView.navigationDelegate = context.coordinator
        context.coordinator.webView = webView

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, PKPaymentAuthorizationControllerDelegate {

        // Sanitize strings before injecting into JavaScript
        private func sanitizeJSString(_ str: String) -> String {
            return str
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "x27", with: "'")
                .replacingOccurrences(of: "\"", with: "\\\"")
                .replacingOccurrences(of: "n", with: "\n")
                .replacingOccurrences(of: "r", with: "\r")
        }

        // Validate callback name — only allow alphanumeric and underscores
        private func isValidCallbackName(_ name: String) -> Bool {
            let pattern = "^[a-zA-Z_][a-zA-Z0-9_]*$"
            return name.range(of: pattern, options: .regularExpression) != nil
        }

        // Validate URL — only allow http/https
        private func isValidFetchURL(_ urlStr: String) -> Bool {
            guard let url = URL(string: urlStr) else { return false }
            return url.scheme == "http" || url.scheme == "https"
        }
        weak var webView: WKWebView?
        var timer: Timer?
        let apiBase: String = { 
            #if DEBUG 
            return "http://192.168.1.58:3001" 
            #else 
            return "https://kingest-api.onrender.com" 
            #endif 
        }()
        var paymentController: PKPaymentAuthorizationController?

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            fetchAndInject()
            sender.endRefreshing()
        }

        // Generic fetch bridge: JS calls __KINGEST_FETCH(url, callbackName)
        // Also handles Apple Pay: JS calls __KINGEST_APPLEPAY(amount, currency, label)
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "kingestFetch" {
                handleKingestFetch(message)
            } else if message.name == "kingestApplePay" {
                handleApplePay(message)
            }
        }

        func handleKingestFetch(_ message: WKScriptMessage) {
            guard let body = message.body as? [String: String],
                  let urlStr = body["url"],
                  let callback = body["callback"],
                  let url = URL(string: urlStr) else { return }
            
            // Sanitize: validate callback name and URL scheme
            guard isValidCallbackName(callback) else {
                print("[KINGEST] Invalid callback name rejected: (callback)")
                return
            }
            guard isValidFetchURL(urlStr) else {
                print("[KINGEST] Invalid URL scheme rejected: (urlStr)")
                return
            }

            print("[KINGEST] Bridge fetch: \(urlStr)")

            URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
                guard let data = data, error == nil else {
                    let errB64 = Data("{\"ok\":false,\"error\":\"network\"}".utf8).base64EncodedString()
                    DispatchQueue.main.async {
                        self?.webView?.evaluateJavaScript("if(window['\(callback)']) window['\(callback)']('\(errB64)')")
                    }
                    return
                }
                let b64 = data.base64EncodedString()
                DispatchQueue.main.async {
                    self?.webView?.evaluateJavaScript("if(window['\(callback)']) window['\(callback)']('\(b64)')")
                }
            }.resume()
        }

        func handleApplePay(_ message: WKScriptMessage) {
            guard let body = message.body as? [String: String],
                  let amountStr = body["amount"],
                  let currency = body["currency"],
                  let label = body["label"],
                  let amount = Decimal(string: amountStr) else {
                print("[KINGEST] Invalid Apple Pay parameters")
                callApplePayResult("error")
                return
            }

            // Check if device can make payments
            guard PKPaymentAuthorizationController.canMakePayments() else {
                print("[KINGEST] Device cannot make payments")
                callApplePayResult("error")
                return
            }

            // Create payment request
            let request = PKPaymentRequest()
            request.merchantIdentifier = "merchant.com.gestia.kingest"
            request.countryCode = "FR"
            request.currencyCode = currency
            request.supportedNetworks = [.visa, .masterCard, .amex]
            request.merchantCapabilities = .capability3DS

            // Create payment summary items
            let paymentItem = PKPaymentSummaryItem(label: label, amount: NSDecimalNumber(decimal: amount))
            request.paymentSummaryItems = [paymentItem]

            // Present payment authorization controller
            let controller = PKPaymentAuthorizationController(paymentRequest: request)
            self.paymentController = controller
            controller.delegate = self
            controller.present(completion: { presented in
                if !presented {
                    print("[KINGEST] Failed to present payment controller")
                    self.callApplePayResult("error")
                }
            })
        }

        // MARK: - PKPaymentAuthorizationControllerDelegate

        func paymentAuthorizationController(_ controller: PKPaymentAuthorizationController,
                                          didAuthorizePayment payment: PKPayment,
                                          handler completion: @escaping (PKPaymentAuthorizationResult) -> Void) {
            // Get the payment token and encode it
            let tokenData = payment.token.paymentData
            let base64Token = tokenData.base64EncodedString()

            print("[KINGEST] Apple Pay authorized with token: \(base64Token.prefix(32))...")

            // Call JS with the token
            DispatchQueue.main.async {
                self.callApplePayResult(base64Token)
            }

            // Complete the payment
            completion(PKPaymentAuthorizationResult(status: .success, errors: []))
        }

        func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
            controller.dismiss(completion: {
                print("[KINGEST] Apple Pay controller dismissed")
            })
        }

        private func callApplePayResult(_ result: String) {
            guard let webView = self.webView else { return }
            let js = "if(window.__KINGEST_APPLEPAY_RESULT) window.__KINGEST_APPLEPAY_RESULT('\(result)')"
            DispatchQueue.main.async {
                webView.evaluateJavaScript(js) { _, error in
                    if let error = error {
                        print("[KINGEST] JS error calling Apple Pay result: \(error)")
                    }
                }
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.fetchAndInject()
                self.updateApplePayAvailability()
            }
            timer?.invalidate()
            timer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
                self?.fetchAndInject()
            }
        }

        private func updateApplePayAvailability() {
            let canMake = PKPaymentAuthorizationController.canMakePayments()
            let js = "window.__KINGEST_APPLEPAY_AVAILABLE = function() { return \(canMake); };"
            webView?.evaluateJavaScript(js)
        }

        func fetchAndInject() {
            guard let url = URL(string: "\(apiBase)/api/market/snapshot") else { return }

            URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
                guard let data = data, error == nil else {
                    let msg = error?.localizedDescription ?? "network error"
                    print("[KINGEST] Fetch error: \(msg)")
                    DispatchQueue.main.async {
                        self?.webView?.evaluateJavaScript("if(window.__KINGEST_ERROR) window.__KINGEST_ERROR('\(msg)')")
                    }
                    return
                }

                // Base64 encode the JSON to avoid escaping issues
                let b64 = data.base64EncodedString()
                let js = "if(window.__KINGEST_DATA_B64) window.__KINGEST_DATA_B64('\(b64)')"

                DispatchQueue.main.async {
                    self?.webView?.evaluateJavaScript(js) { result, jsError in
                        if let jsError = jsError {
                            print("[KINGEST] JS error: \(jsError)")
                        } else {
                            print("[KINGEST] Data injected OK")
                        }
                    }
                }
            }.resume()
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url,
               (url.scheme == "https" || url.scheme == "http"),
               navigationAction.navigationType == .linkActivated {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        deinit {
            timer?.invalidate()
        }
    }
}

#Preview {
    ContentView()
}
