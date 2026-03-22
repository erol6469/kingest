import SwiftUI
import WebKit
import PassKit
import LocalAuthentication

// ══════════════════════════════════════
// MARK: - Face ID Manager
// ══════════════════════════════════════
class FaceIDManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isChecking = true
    @Published var errorMessage: String?
    @Published var serverReady = false

    let apiBase = "https://kingest-api.onrender.com"

    var isFaceIDEnrolled: Bool {
        UserDefaults.standard.bool(forKey: "kingest_faceid_enrolled")
    }

    var savedEmail: String? {
        UserDefaults.standard.string(forKey: "kingest_user_email")
    }

    func enrollFaceID(email: String) {
        UserDefaults.standard.set(true, forKey: "kingest_faceid_enrolled")
        UserDefaults.standard.set(email, forKey: "kingest_user_email")
    }

    func authenticate() {
        guard isFaceIDEnrolled else {
            // No Face ID enrolled, skip to WebView
            isAuthenticated = true
            isChecking = false
            return
        }

        // Start both Face ID and server wake simultaneously
        wakeServer()
        promptFaceID()
    }

    private func wakeServer() {
        guard let url = URL(string: "\(apiBase)/health") else { return }
        var request = URLRequest(url: url)
        request.timeoutInterval = 60
        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            DispatchQueue.main.async {
                if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                    self?.serverReady = true
                    print("[KINGEST] Server is ready")
                } else {
                    // Retry once after 3s
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        URLSession.shared.dataTask(with: request) { _, resp, _ in
                            DispatchQueue.main.async {
                                if let http = resp as? HTTPURLResponse, http.statusCode == 200 {
                                    self?.serverReady = true
                                }
                            }
                        }.resume()
                    }
                }
            }
        }.resume()
    }

    private func promptFaceID() {
        let context = LAContext()
        context.localizedFallbackTitle = "Utiliser le PIN"
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            // No biometrics available, fall through
            print("[KINGEST] Biometrics not available: \(error?.localizedDescription ?? "unknown")")
            DispatchQueue.main.async {
                self.isAuthenticated = true
                self.isChecking = false
            }
            return
        }

        context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Connectez-vous à Kingest"
        ) { success, authError in
            DispatchQueue.main.async {
                if success {
                    self.isAuthenticated = true
                    self.isChecking = false
                    print("[KINGEST] Face ID success")
                } else {
                    if let err = authError as? LAError {
                        switch err.code {
                        case .userFallback:
                            // User tapped "Use PIN" — let WebView handle PIN login
                            self.isAuthenticated = true
                            self.isChecking = false
                            // Clear token so WebView shows login page
                            self.clearAuthToken()
                        case .userCancel:
                            self.errorMessage = "Authentification annulée"
                            self.isChecking = false
                        default:
                            self.errorMessage = "Échec Face ID"
                            self.isChecking = false
                        }
                    }
                }
            }
        }
    }

    private func clearAuthToken() {
        // Will be handled by injecting JS to clear localStorage
    }

    func retry() {
        errorMessage = nil
        isChecking = true
        authenticate()
    }

    func skipToLogin() {
        // Clear enrollment and go to WebView login
        UserDefaults.standard.set(false, forKey: "kingest_faceid_enrolled")
        isAuthenticated = true
        isChecking = false
    }
}

// ══════════════════════════════════════
// MARK: - Face ID Lock Screen
// ══════════════════════════════════════
struct FaceIDLockScreen: View {
    @ObservedObject var manager: FaceIDManager

    var body: some View {
        ZStack {
            // Gradient background matching LoginPage
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.4, green: 0.49, blue: 0.92),
                    Color(red: 0.46, green: 0.29, blue: 0.64)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 30) {
                Spacer()

                // Logo
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color.white.opacity(0.25),
                                    Color.white.opacity(0.08)
                                ]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 80, height: 80)
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.2), lineWidth: 1)
                        )

                    Text("K")
                        .font(.system(size: 36, weight: .heavy))
                        .foregroundColor(.white)
                }

                Text("Kingest")
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundColor(.white)
                    .tracking(-1)

                if manager.isChecking {
                    // Face ID icon with pulse animation
                    VStack(spacing: 16) {
                        Image(systemName: "faceid")
                            .font(.system(size: 60))
                            .foregroundColor(.white.opacity(0.9))
                            .symbolEffect(.pulse, options: .repeating)

                        Text("Vérification Face ID...")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .padding(.top, 40)
                } else if let error = manager.errorMessage {
                    VStack(spacing: 20) {
                        Image(systemName: "faceid")
                            .font(.system(size: 50))
                            .foregroundColor(.white.opacity(0.5))

                        Text(error)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))

                        Button(action: { manager.retry() }) {
                            HStack {
                                Image(systemName: "arrow.clockwise")
                                Text("Réessayer")
                            }
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 40)
                            .padding(.vertical, 16)
                            .background(Color.white.opacity(0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(
                                RoundedRectangle(cornerRadius: 14)
                                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
                            )
                        }

                        Button(action: { manager.skipToLogin() }) {
                            Text("Se connecter avec PIN")
                                .font(.system(size: 15, weight: .semibold))
                                .foregroundColor(.white.opacity(0.6))
                        }
                    }
                    .padding(.top, 30)
                }

                Spacer()

                // Server status
                HStack(spacing: 6) {
                    Circle()
                        .fill(manager.serverReady ? Color.green : Color.orange)
                        .frame(width: 6, height: 6)
                    Text(manager.serverReady ? "Serveur connecté" : "Connexion au serveur...")
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.4))
                }
                .padding(.bottom, 40)
            }
        }
    }
}

// ══════════════════════════════════════
// MARK: - Content View
// ══════════════════════════════════════
struct ContentView: View {
    @StateObject private var faceIDManager = FaceIDManager()

    var body: some View {
        Group {
            if faceIDManager.isFaceIDEnrolled && !faceIDManager.isAuthenticated {
                FaceIDLockScreen(manager: faceIDManager)
                    .onAppear {
                        faceIDManager.authenticate()
                    }
            } else {
                WebView(serverReady: faceIDManager.serverReady)
                    .ignoresSafeArea()
                    .statusBarHidden(false)
                    .preferredColorScheme(.dark)
                    .onAppear {
                        // If no Face ID enrolled, still wake server
                        if !faceIDManager.isFaceIDEnrolled && !faceIDManager.serverReady {
                            faceIDManager.authenticate()
                        }
                    }
            }
        }
    }
}

// ══════════════════════════════════════
// MARK: - WebView
// ══════════════════════════════════════
struct WebView: UIViewRepresentable {
    var serverReady: Bool

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.javaScriptEnabled = true

        // Allow camera access for selfie
        if #available(iOS 14.5, *) {
            config.preferences.isElementFullscreenEnabled = true
        }

        // Register message handlers
        let uc = config.userContentController
        uc.add(context.coordinator, name: "kingestFetch")
        uc.add(context.coordinator, name: "kingestApplePay")
        uc.add(context.coordinator, name: "kingestFaceID")

        // Inject JS bridge functions
        let bridgeJS = """
        window.__KINGEST_FETCH = function(url, callbackName) {
            window.webkit.messageHandlers.kingestFetch.postMessage({url: url, callback: callbackName});
        };
        window.__KINGEST_POST = function(url, body, callbackName) {
            window.webkit.messageHandlers.kingestFetch.postMessage({url: url, callback: callbackName, method: 'POST', body: body});
        };
        window.__KINGEST_APPLEPAY = function(amount, currency, label) {
            window.webkit.messageHandlers.kingestApplePay.postMessage({amount: amount, currency: currency, label: label});
        };
        window.__KINGEST_APPLEPAY_AVAILABLE = function() {
            return true;
        };
        window.__KINGEST_ENROLL_FACEID = function(email) {
            window.webkit.messageHandlers.kingestFaceID.postMessage({action: 'enroll', email: email});
        };
        window.__KINGEST_FACEID_ENROLLED = function() {
            try {
                return localStorage.getItem('kingest_faceid_enrolled') === 'true';
            } catch(e) { return false; }
        };
        """
        let script = WKUserScript(source: bridgeJS, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        uc.addUserScript(script)

        // Clear all WKWebView caches to ensure fresh JS loads
        let dataStore = WKWebsiteDataStore.default()
        dataStore.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: Date.distantPast) { }

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 10/255, green: 14/255, blue: 26/255, alpha: 1)
        webView.scrollView.backgroundColor = UIColor(red: 10/255, green: 14/255, blue: 26/255, alpha: 1)
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        // Camera access for selfie
        webView.configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

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
        webView.uiDelegate = context.coordinator  // For camera permission
        context.coordinator.webView = webView

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, PKPaymentAuthorizationControllerDelegate, WKUIDelegate {

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
        let apiBase: String = "https://kingest-api.onrender.com"
        var paymentController: PKPaymentAuthorizationController?

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            fetchAndInject()
            sender.endRefreshing()
        }

        // ── Message Handlers ──
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "kingestFetch" {
                handleKingestFetch(message)
            } else if message.name == "kingestApplePay" {
                handleApplePay(message)
            } else if message.name == "kingestFaceID" {
                handleFaceIDMessage(message)
            }
        }

        // ── Face ID Bridge ──
        func handleFaceIDMessage(_ message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  let action = body["action"] as? String else { return }

            if action == "enroll" {
                let email = body["email"] as? String ?? ""
                // Save to UserDefaults so native Face ID works on next launch
                UserDefaults.standard.set(true, forKey: "kingest_faceid_enrolled")
                UserDefaults.standard.set(email, forKey: "kingest_user_email")
                print("[KINGEST] Face ID enrolled for: \(email)")
            }
        }

        // ── WKUIDelegate for camera permission ──
        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            // Auto-grant camera access for selfie (only for our local files)
            decisionHandler(.grant)
        }

        func handleKingestFetch(_ message: WKScriptMessage) {
            guard let body = message.body as? [String: Any],
                  let urlStr = body["url"] as? String,
                  let callback = body["callback"] as? String,
                  let url = URL(string: urlStr) else { return }

            // Sanitize: validate callback name and URL scheme
            guard isValidCallbackName(callback) else {
                print("[KINGEST] Invalid callback name rejected: \(callback)")
                return
            }
            guard isValidFetchURL(urlStr) else {
                print("[KINGEST] Invalid URL scheme rejected: \(urlStr)")
                return
            }

            let method = body["method"] as? String ?? "GET"
            let postBody = body["body"] as? String

            print("[KINGEST] Bridge \(method): \(urlStr)")

            var request = URLRequest(url: url)
            request.httpMethod = method
            if method == "POST", let postBody = postBody {
                request.httpBody = postBody.data(using: .utf8)
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            }

            URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
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

            let paymentItem = PKPaymentSummaryItem(label: label, amount: NSDecimalNumber(decimal: amount))
            request.paymentSummaryItems = [paymentItem]

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
            let tokenData = payment.token.paymentData
            let base64Token = tokenData.base64EncodedString()
            print("[KINGEST] Apple Pay authorized with token: \(base64Token.prefix(32))...")
            DispatchQueue.main.async {
                self.callApplePayResult(base64Token)
            }
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
