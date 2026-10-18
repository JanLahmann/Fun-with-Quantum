import Foundation

/// What the native lists show, from Web/catalog.json (built from portal/src/content by scripts/build-web.mjs).
struct Catalog: Decodable {
    struct Game: Decodable, Identifiable {
        let id, title, tagline, icon, concept, duration, level, audience, page, notebookUrl: String
        let webGame: Bool
    }
    /// Quantum Golf: Entangible's golf-only build, bundled from its release (sources.json `quantum-golf`).
    struct Golf: Decodable {
        let id, title, tagline, icon, concept, page, project, repo, release: String
    }
    struct Project: Decodable, Identifiable {
        let id, door, title, tagline, icon, url: String
    }
    struct Model: Decodable, Identifiable {
        let id, title, blurb, page: String
        let ar: String?
        let project: String?
    }
    struct Credit: Decodable { let name, repo, ref: String }
    /// The guide sheet's texts (the portal's guide box) and the sites an answer may link (render.ts TRUSTED).
    struct KetTexts: Decodable {
        let open, title, intro, privacy, placeholder, send, thinking, you, explainer, helpful, notHelpful, thanks, errRate, errBusy, errNetwork, trusted: String
    }

    let games: [Game]
    let golf: Golf
    let projects: [Project]
    let models: [Model]
    let credits: [Credit]
    let ket: KetTexts
    let welcome: Welcome

    /// The welcome page: the homepage's hero and its three doors (portal/src/data/home.ts).
    struct Welcome: Decodable {
        struct Part: Decodable { let text: String; let door: String? }
        struct Door: Decodable, Identifiable { let key, title, text, image, imageAlt, fit: String; var id: String { key } }
        let title: [Part]
        let lead: String
        let doors: [Door]
    }

    func projects(door: String) -> [Project] { projects.filter { $0.door == door } }
    func project(_ id: String?) -> Project? { projects.first { $0.id == id } }

    static let bundled: Catalog = {
        guard let url = WebContent.root?.appendingPathComponent("catalog.json"),
              let data = try? Data(contentsOf: url),
              let catalog = try? JSONDecoder().decode(Catalog.self, from: data)
        else { fatalError("Web/catalog.json is missing or invalid: run `node ios/scripts/build-web.mjs` before building") }
        return catalog
    }()
}
