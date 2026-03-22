import SwiftUI
import WebKit

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

    class Coordinator: NSObject, WKNavigationDelegate {
        weak var webView: WKWebView?
        var timer: Timer?
        let apiBase: String = { 
            #if DEBUG 
            return "http://localhost:3001" 
            #else 
            return "https://api.kingest.app" 
            #endif 
        }()

        @objc func handleRefresh(_ sender: UIRefreshControl) {
            fetchAndInject()
            sender.endRefreshing()
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.fetchAndInject()
            }
            timer?.invalidate()
            timer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
                self?.fetchAndInject()
            }
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
