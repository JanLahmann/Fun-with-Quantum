import Foundation
import UIKit
import WebKit

/// Anonymous counts, as on the family's websites (family/EVENTS.md): Umami Cloud, cookieless, the family's
/// shared property, told apart by the hostname app.fun-with-quantum.org. No IDs, no tracking: a page or
/// screen, an event name with a few properties, and what Umami derives itself (device type, system,
/// language, country). Offline, an event is dropped. Simulator runs (tests, CI) send nothing.
enum Analytics {
    static let website = "97f347ac-e7ba-4be3-b26f-ab4b328bdbf2"
    static let hostname = "app.fun-with-quantum.org"
    private static let endpoint = URL(string: "https://cloud.umami.is/api/send")!

    /// A screen of the app's own (the tabs, the welcome page), as a page view at the website's path.
    static func view(_ path: String, title: String) { send(["url": path, "title": title]) }

    /// An event, named `App: …` for the app's own controls (the pages send their website names).
    static func event(_ name: String, _ data: [String: String] = [:], path: String = "/") {
        send(["url": path, "name": name, "data": data])
    }

    /// From the pages (the injected `window.umami`, posted to fwq://app/__umami): only the fields Umami
    /// reads, as strings and flat properties, so a page can't send anything else.
    static func forward(_ body: Data) {
        guard let p = try? JSONSerialization.jsonObject(with: body) as? [String: Any] else { return }
        var payload: [String: Any] = [:]
        for key in ["url", "title", "name"] { if let v = p[key] as? String, !v.isEmpty { payload[key] = String(v.prefix(500)) } }
        guard payload["url"] != nil else { return }
        if let data = p["data"] as? [String: Any] {
            payload["data"] = data.compactMapValues { v -> Any? in v is String || v is NSNumber ? v : nil }
        }
        send(payload)
    }

    private static func send(_ fields: [String: Any]) {
        #if targetEnvironment(simulator)
        if ProcessInfo.processInfo.environment["FWQ_ANALYTICS_LOG"] != nil { NSLog("FWQANALYTICS %@", String(describing: fields)) }
        return
        #else
        var payload = fields
        payload["website"] = website
        payload["hostname"] = hostname
        payload["language"] = Locale.preferredLanguages.first ?? "en"
        payload["screen"] = screen
        guard let body = try? JSONSerialization.data(withJSONObject: ["type": "event", "payload": payload]) else { return }
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.httpBody = body
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Umami reads device type and system from the user agent and drops unknown agents as bots:
        // the one Safari on this device would send.
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        URLSession.shared.dataTask(with: request).resume()
        #endif
    }

    private static let screen: String = {
        let b = UIScreen.main.nativeBounds.size, s = UIScreen.main.nativeScale
        return "\(Int(b.width / s))x\(Int(b.height / s))"
    }()

    private static let userAgent: String = {
        let os = UIDevice.current.systemVersion.replacingOccurrences(of: ".", with: "_")
        let device = UIDevice.current.userInterfaceIdiom == .pad ? "iPad; CPU OS \(os)" : "iPhone; CPU iPhone OS \(os)"
        return "Mozilla/5.0 (\(device) like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/\(UIDevice.current.systemVersion.split(separator: ".").first ?? "18").0 Mobile/15E148 Safari/604.1"
    }()

    /// The pages' `window.umami`: the same calls the website's tracker offers (`track(name, data)`,
    /// `data-umami-event` clicks, a page view per page), posted to the app instead of the internet.
    static let pageScript = WKUserScript(source: #"""
    (() => {
      const send = (p) => { try { fetch('fwq://app/__umami', { method: 'POST', body: JSON.stringify(p) }).catch(() => {}); } catch (e) {} };
      const base = () => ({ url: location.pathname, title: document.title });
      window.umami = { track: (name, data) => send(typeof name === 'string' ? { ...base(), name, data: data || {} } : base()) };
      addEventListener('load', () => send(base()));
      document.addEventListener('click', (e) => {
        const el = e.target && e.target.closest ? e.target.closest('[data-umami-event]') : null;
        if (!el) return;
        const data = {};
        for (const a of el.attributes) { const m = /^data-umami-event-(.+)$/.exec(a.name); if (m) data[m[1]] = a.value; }
        send({ ...base(), name: el.getAttribute('data-umami-event'), data });
      }, true);
    })();
    """#, injectionTime: .atDocumentStart, forMainFrameOnly: true)
}
