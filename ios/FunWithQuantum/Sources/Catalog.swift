import Foundation

/// What the native lists show, from Web/catalog.json (built from portal/src/content by scripts/build-web.mjs).
struct Catalog: Decodable {
    struct Game: Decodable, Identifiable {
        let id, title, tagline, icon, concept, duration, level, audience, page, notebookUrl: String
        let webGame: Bool
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

    let games: [Game]
    let projects: [Project]
    let models: [Model]
    let credits: [Credit]

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
