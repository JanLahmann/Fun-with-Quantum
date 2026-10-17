import SafariServices
import SwiftUI
import UniformTypeIdentifiers
import WebKit

/// The bundled web content, served to WKWebView as fwq://app/… (ES modules and fetch need a real
/// origin, which file:// URLs don't give): /models/… from Web/models, everything else from Web/site.
enum WebContent {
    static let scheme = "fwq"
    static let root = Bundle.main.url(forResource: "Web", withExtension: nil)

    static func url(_ path: String) -> URL { URL(string: "\(scheme)://app\(path)")! }

    /// The file behind an fwq://app URL, or nil if it is outside Web/ or missing.
    static func file(for url: URL) -> URL? {
        guard let root, url.host == "app" else { return nil }
        var path = url.path
        if path.isEmpty || path.hasSuffix("/") { path += "index.html" }
        let base = path.hasPrefix("/models/") ? root : root.appendingPathComponent("site")
        let file = base.appendingPathComponent(path).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path + "/") else { return nil }
        var isDir: ObjCBool = false
        if FileManager.default.fileExists(atPath: file.path, isDirectory: &isDir) {
            return isDir.boolValue ? file.appendingPathComponent("index.html") : file
        }
        return nil
    }
}

final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url, let file = WebContent.file(for: url), let data = try? Data(contentsOf: file) else {
            let response = HTTPURLResponse(url: task.request.url!, statusCode: 404, httpVersion: "HTTP/1.1", headerFields: [:])!
            task.didReceive(response)
            task.didFinish()
            return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? Self.mime[file.pathExtension] ?? "application/octet-stream"
        let headers = ["Content-Type": mime, "Content-Length": String(data.count), "Access-Control-Allow-Origin": "*"]
        task.didReceive(HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

    private static let mime = ["js": "text/javascript", "mjs": "text/javascript", "mpd": "text/plain", "glb": "model/gltf-binary", "stl": "model/stl", "webmanifest": "application/manifest+json"]
}

/// A page of the bundled content. Links to the web open in Safari; nothing else leaves the app:
/// pages may not load anything from the internet (no analytics, no CDN).
struct WebPage: UIViewRepresentable {
    let path: String
    /// A website page: hides its own header and footer (the app has its own navigation) and lets iOS
    /// inset the scrolling page. A model page (false) is a fixed full-screen layout that handles the
    /// safe area itself (CSS env(safe-area-inset-bottom)).
    var sitePage = true

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: WebContent.scheme)
        config.allowsInlineMediaPlayback = true
        if sitePage {
            let css = "body > header, body > footer, .skip-link { display: none !important; }"
            let js = "const s = document.createElement('style'); s.textContent = \(String(reflecting: css)); document.documentElement.appendChild(s);"
            config.userContentController.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        }
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = .systemBackground
        view.scrollView.contentInsetAdjustmentBehavior = sitePage ? .automatic : .never
        view.scrollView.isScrollEnabled = sitePage
        #if DEBUG
        if #available(iOS 16.4, *) { view.isInspectable = true }
        #endif
        Coordinator.blockRemote(config) { view.load(URLRequest(url: WebContent.url(path))) }
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        /// Blocks every request to the internet that a page makes by itself (scripts, images, fonts).
        static func blockRemote(_ config: WKWebViewConfiguration, then load: @escaping () -> Void) {
            let rules = #"[{"trigger":{"url-filter":"^https?://"},"action":{"type":"block"}}]"#
            WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "fwq-block-remote", encodedContentRuleList: rules) { list, _ in
                if let list { config.userContentController.add(list) }
                load()
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.cancel) }
            if url.scheme == WebContent.scheme || url.scheme == "about" { return decisionHandler(.allow) }
            decisionHandler(.cancel)
            // A tap on a link to the web (or mailto:) leaves the app.
            if action.navigationType == .linkActivated || action.targetFrame == nil {
                if url.scheme == "https" || url.scheme == "http" { Safari.open(url) } else { UIApplication.shared.open(url) }
            }
        }
    }
}

/// Opens a web page in an in-app Safari sheet.
enum Safari {
    @MainActor static func open(_ url: URL) {
        guard let scene = UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first,
              var top = scene.windows.first(where: \.isKeyWindow)?.rootViewController else { return }
        while let next = top.presentedViewController { top = next }
        top.present(SFSafariViewController(url: url), animated: true)
    }
}
