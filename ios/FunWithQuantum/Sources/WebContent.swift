import SafariServices
import SwiftUI
import UniformTypeIdentifiers
import WebKit

/// The bundled web content, served to WKWebView as fwq://app/… (ES modules and fetch need a real
/// origin, which file:// URLs don't give): /models/… from Web/models, /golf/… from Web/golf, everything else from Web/site.
enum WebContent {
    static let scheme = "fwq"
    static let root = Bundle.main.url(forResource: "Web", withExtension: nil)

    static func url(_ path: String) -> URL { URL(string: "\(scheme)://app\(path)")! }

    /// The file behind an fwq://app URL, or nil if it is outside Web/ or missing.
    static func file(for url: URL) -> URL? {
        guard let root, url.host == "app" else { return nil }
        var path = url.path
        if path.isEmpty || path.hasSuffix("/") { path += "index.html" }
        let base = path.hasPrefix("/models/") || path.hasPrefix("/golf/") ? root : root.appendingPathComponent("site")
        let file = base.appendingPathComponent(path).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path + "/") else { return nil }
        var isDir: ObjCBool = false
        if FileManager.default.fileExists(atPath: file.path, isDirectory: &isDir) {
            return isDir.boolValue ? file.appendingPathComponent("index.html") : file
        }
        return nil
    }
}

@MainActor
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    /// Ket requests on their way (fwq://app/__ket/…), so a page that goes away stops them.
    private var live: [ObjectIdentifier: Task<Void, Never>] = [:]

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        if let url = task.request.url, url.host == "app", url.path.hasPrefix("/__ket/") { return forwardToKet(task, url) }
        guard let url = task.request.url, let file = WebContent.file(for: url), let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
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

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
        live.removeValue(forKey: ObjectIdentifier(task))?.cancel()
    }

    /// The coin game's chat (portal widget, data-url fwq://app/__ket): its /chat and /feedback go to the
    /// Worker natively, with the App Attest token and no Origin; the answer streams back to the page as is.
    /// Pages themselves still can't reach the internet (the content rule list), only through here.
    private func forwardToKet(_ task: WKURLSchemeTask, _ url: URL) {
        let id = ObjectIdentifier(task)
        let path = String(url.path.dropFirst("/__ket".count))
        let body = task.request.httpBody ?? task.request.httpBodyStream.map(Self.read) ?? Data()
        guard task.request.httpMethod == "POST", path == "/chat" || path == "/feedback" else {
            return Self.reply(task, url, status: 404, json: #"{"error":"not_found"}"#)
        }
        live[id] = Task { [weak self] in
            let alive = { self?.live[id] != nil }
            var responseSent = false
            do {
                let (response, bytes) = try await KetClient.shared.forward(path, body: body)
                guard alive() else { return }
                let type = response.value(forHTTPHeaderField: "Content-Type") ?? "application/json"
                task.didReceive(HTTPURLResponse(url: url, statusCode: response.statusCode, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": type])!)
                responseSent = true
                // Pass each line on as it arrives, so the answer appears while it is written.
                var line = Data()
                for try await byte in bytes {
                    line.append(byte)
                    if byte == 0x0A { guard alive() else { return }; task.didReceive(line); line.removeAll(keepingCapacity: true) }
                }
                guard alive() else { return }
                if !line.isEmpty { task.didReceive(line) }
                task.didFinish()
            } catch {
                guard alive() else { return }
                // Once the response has started, a second one would crash WebKit: end the stream as failed instead.
                if responseSent { task.didFailWithError(error) } else {
                    let failure = error as? KetClient.Failure ?? .network
                    Self.reply(task, url, status: failure.status, json: #"{"error":"ket"}"#)
                }
            }
            self?.live[id] = nil
        }
    }

    private static func reply(_ task: WKURLSchemeTask, _ url: URL, status: Int, json: String) {
        task.didReceive(HTTPURLResponse(url: url, statusCode: status, httpVersion: "HTTP/1.1", headerFields: ["Content-Type": "application/json"])!)
        task.didReceive(Data(json.utf8))
        task.didFinish()
    }

    private static func read(_ stream: InputStream) -> Data {
        var data = Data()
        stream.open()
        defer { stream.close() }
        var buffer = [UInt8](repeating: 0, count: 16_384)
        while stream.hasBytesAvailable {
            let n = stream.read(&buffer, maxLength: buffer.count)
            if n <= 0 { break }
            data.append(buffer, count: n)
        }
        return data
    }

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
    /// Whether the page scrolls; by default only website pages do (Quantum Golf is a full-screen page that scrolls on a phone).
    var scrolls: Bool?
    /// The view's colour until the page paints (Quantum Golf is dark only).
    var background: UIColor = .systemBackground

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: WebContent.scheme)
        config.allowsInlineMediaPlayback = true
        if sitePage {
            let css = "body > header, body > footer, .skip-link { display: none !important; }"
            let js = "const s = document.createElement('style'); s.textContent = \(String(reflecting: css)); document.documentElement.appendChild(s);"
            config.userContentController.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }
        let view = WKWebView(frame: .zero, configuration: config)
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.isOpaque = false
        view.backgroundColor = background
        view.scrollView.contentInsetAdjustmentBehavior = sitePage ? .automatic : .never
        view.scrollView.isScrollEnabled = scrolls ?? sitePage
        // A page's own links (the coin game's languages) open in place: a swipe from the edge goes back.
        view.allowsBackForwardNavigationGestures = sitePage
        if sitePage { view.pageZoom = Self.zoom(context.environment.dynamicTypeSize) }
        // The first page takes a moment (the web process starts, the rule list compiles): show that it's coming.
        let spinner = UIActivityIndicatorView(style: .large)
        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.startAnimating()
        view.addSubview(spinner)
        NSLayoutConstraint.activate([spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor), spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor)])
        context.coordinator.spinner = spinner
        #if DEBUG
        if #available(iOS 16.4, *) { view.isInspectable = true }
        #endif
        Coordinator.blockRemote(config) { ok in
            if ok { view.load(URLRequest(url: WebContent.url(path))) }
            else { view.loadHTMLString("<p style='font:17px -apple-system;padding:24px'>This page can't be shown.</p>", baseURL: nil) }
        }
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {
        if sitePage { view.pageZoom = Self.zoom(context.environment.dynamicTypeSize) } // a new text size calls this again
    }

    /// The iPhone's text size (Settings → Display & Brightness → Text Size, or Accessibility → Larger Text)
    /// as the page's zoom: 1 at the default size, from 0.85 up to 1.4 — more would squeeze the games'
    /// layout into too narrow a page.
    static func zoom(_ size: DynamicTypeSize) -> CGFloat {
        let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(size))
        return min(1.4, max(0.85, UIFontMetrics(forTextStyle: .body).scaledValue(for: 17, compatibleWith: traits) / 17))
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        weak var spinner: UIActivityIndicatorView?

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { spinner?.removeFromSuperview() }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { spinner?.removeFromSuperview() }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { spinner?.removeFromSuperview() }

        private static let rules = #"[{"trigger":{"url-filter":"^https?://"},"action":{"type":"block"}}]"#
        private static let ruleID = "fwq-block-remote-v1"

        /// Blocks every request to the internet that a page makes by itself (scripts, images, fonts).
        /// Fails closed: without the rule list, `load` gets false and no bundled page is shown.
        static func blockRemote(_ config: WKWebViewConfiguration, then load: @escaping (Bool) -> Void) {
            let store = WKContentRuleListStore.default()!
            let add = { (list: WKContentRuleList?) -> Bool in
                guard let list else { return false }
                config.userContentController.add(list)
                return true
            }
            store.lookUpContentRuleList(forIdentifier: ruleID) { found, _ in
                if let found { return load(add(found)) }
                store.compileContentRuleList(forIdentifier: ruleID, encodedContentRuleList: rules) { list, _ in load(add(list)) }
            }
        }

        /// The web content process was ended (memory pressure): show the page again instead of a blank view.
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }

        /// target=_blank and window.open: web links leave the app, bundled pages open in place.
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url {
                if url.scheme == WebContent.scheme { webView.load(URLRequest(url: url)) } else { Self.leave(url) }
            }
            return nil
        }

        static func leave(_ url: URL) {
            if url.scheme == "https" || url.scheme == "http" { Safari.open(url) } else { UIApplication.shared.open(url) }
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.cancel) }
            if url.scheme == WebContent.scheme || url.scheme == "about" { return decisionHandler(.allow) }
            decisionHandler(.cancel)
            // A link to the web (or mailto:) leaves the app; a page can't navigate there by itself.
            if action.navigationType == .linkActivated || action.targetFrame == nil { Self.leave(url) }
        }
    }
}

/// Opens a web page in Safari inside the app (SFSafariViewController), in the window in front.
enum Safari {
    @MainActor static func open(_ url: URL) {
        guard url.scheme == "https" || url.scheme == "http" else { return }
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        guard let scene = scenes.first(where: { $0.activationState == .foregroundActive }) ?? scenes.first,
              var top = scene.windows.first(where: \.isKeyWindow)?.rootViewController else { return }
        while let next = top.presentedViewController { top = next }
        top.present(SFSafariViewController(url: url), animated: true)
    }
}
