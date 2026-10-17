import QuickLook
import SwiftUI

// MARK: - Play

struct PlayView: View {
    let catalog: Catalog

    var body: some View {
        List {
            Section {
                ForEach(catalog.games.filter(\.webGame)) { game in
                    NavigationLink { GameView(game: game) } label: { GameRow(game: game) }
                }
            } header: { Text("Play right here") } footer: { Text("Nothing to install, no account: the games run on your device, also offline.") }

            Section {
                ForEach(catalog.games.filter { !$0.webGame }) { game in
                    Button { if let url = URL(string: game.notebookUrl) { Safari.open(url) } } label: { GameRow(game: game, external: true) }
                        .tint(.primary)
                }
            } header: { Text("Notebook games") } footer: { Text("Interactive Jupyter notebooks with the Qiskit code. They open in a free online session (mybinder.org via QuBins), which can take a few minutes to start.") }

            ProjectSection(title: "More to play", projects: catalog.projects(door: "play"))
        }
        .navigationTitle("Play")
        .toolbar { AboutButton(catalog: catalog); AskKetButton(texts: catalog.ket, page: "/play/") }
    }
}

struct GameRow: View {
    let game: Catalog.Game
    var external = false

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text(game.icon).font(.title2).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(game.title).font(.headline)
                    if external { Image(systemName: "arrow.up.right.square").foregroundStyle(.secondary).accessibilityLabel("opens in Safari") }
                }
                Text(game.tagline).font(.subheadline).foregroundStyle(.secondary)
                Text("\(game.concept) · \(game.duration) · \(game.level)").font(.caption).foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct GameView: View {
    let game: Catalog.Game

    var body: some View {
        WebPage(path: game.page)
            .ignoresSafeArea(edges: .bottom)
            .navigationTitle(game.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .tabBar)
    }
}

// MARK: - Build

struct BuildView: View {
    let catalog: Catalog

    var body: some View {
        List {
            Section {
                ForEach(catalog.models) { model in
                    NavigationLink { ModelView(model: model, project: catalog.project(model.project)) } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(model.title).font(.headline)
                                if model.ar != nil { Image(systemName: "arkit").foregroundStyle(.secondary).accessibilityLabel("also in AR") }
                            }
                            Text(model.blurb).font(.subheadline).foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            } header: { Text("3D models") } footer: { Text("Drag to spin, pinch to zoom. Models marked with the AR symbol can also stand on your desk.") }

            ProjectSection(title: "Build your own", projects: catalog.projects(door: "build"))
        }
        .navigationTitle("Build")
        .toolbar { AboutButton(catalog: catalog); AskKetButton(texts: catalog.ket, page: "/build/") }
    }
}

struct ModelView: View {
    let model: Catalog.Model
    let project: Catalog.Project?
    @State private var arFile: URL?

    var body: some View {
        WebPage(path: model.page, sitePage: false)
            .ignoresSafeArea(edges: .bottom)
            .navigationTitle(model.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .tabBar)
            .toolbar {
                if let ar = model.ar, let file = WebContent.root?.appendingPathComponent(String(ar.dropFirst())) {
                    Button { arFile = file } label: { Label("View in AR", systemImage: "arkit") }
                }
                if let project, let url = URL(string: project.url) {
                    Button { Safari.open(url) } label: { Label("\(project.title) website", systemImage: "safari") }
                }
            }
            .quickLookPreview($arFile)
    }
}

// MARK: - Learn

struct LearnView: View {
    let catalog: Catalog

    var body: some View {
        List {
            ProjectSection(title: "Learn quantum computing", projects: catalog.projects(door: "learn"))
        }
        .navigationTitle("Learn")
        .toolbar { AboutButton(catalog: catalog); AskKetButton(texts: catalog.ket, page: "/learn/") }
    }
}

// MARK: - Shared

struct ProjectSection: View {
    let title: String
    let projects: [Catalog.Project]

    var body: some View {
        Section {
            ForEach(projects) { p in
                Button { if let url = URL(string: p.url) { Safari.open(url) } } label: {
                    HStack(alignment: .top, spacing: 12) {
                        Text(p.icon).font(.title2).accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(p.title).font(.headline)
                                Image(systemName: "arrow.up.right.square").foregroundStyle(.secondary).accessibilityLabel("opens in Safari")
                            }
                            Text(p.tagline).font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .tint(.primary)
            }
        } header: { Text(title) }
    }
}

/// The (i) button: the welcome page, which links on to the fine print (About).
struct AboutButton: ToolbarContent {
    let catalog: Catalog

    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { NotificationCenter.default.post(name: .showWelcome, object: nil) } label: { Label("Welcome", systemImage: "info.circle") }
        }
    }
}

struct AboutView: View {
    let catalog: Catalog
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("Quantum computing you can play, build and learn. Open source, built by Jan-R. Lahmann and the RasQberry community.")
                    Link("fun-with-quantum.org", destination: URL(string: "https://fun-with-quantum.org")!)
                }
                Section("Privacy") {
                    Text("This app has no account and no tracking, and it doesn't count how you use it. The games and models run on your device; links open in Safari, where the linked site's own privacy policy applies.")
                    Text("Ket, the AI helper: only when you send a question, it goes with the earlier questions and answers of the chat, the page or the visible game state, the level you picked and the language through our server at Cloudflare to Anthropic, whose Claude model writes the answer. We store the question, the answer, the page or game state and your thumbs up or down for 30 days to answer and to improve Ket, then delete them. So that only this app can ask, it proves it is genuine with Apple's App Attest: the server keeps that key (its ID and public key, which say nothing about you) until 30 days after its last use and counts the questions per key per day; to limit new keys, it counts them per day under a pseudonym of your IP address that changes every day. Please don't enter personal data.")
                        .font(.footnote)
                    Button("More about privacy") { Safari.open(URL(string: "https://fun-with-quantum.org/about/#privacy")!) }
                }
                Section("The 3D models") {
                    ForEach(catalog.credits, id: \.repo) { c in
                        Button("\(c.repo) (\(String(c.ref.prefix(8))))") { Safari.open(URL(string: "https://github.com/\(c.repo)")!) }
                    }
                    Text("Viewers and models from the family's open-source repositories (Apache License 2.0), with three.js (MIT) and parts from the LDraw Parts Library (CC BY 4.0).").font(.footnote).foregroundStyle(.secondary)
                    NavigationLink("Licenses") { LicensesView() }
                }
                Section {
                    Text("Not affiliated with or endorsed by IBM, the LEGO Group or BrickLink. IBM, IBM Quantum and Qiskit are trademarks of International Business Machines Corporation; LEGO and BrickLink are trademarks of the LEGO Group.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section {
                    Text("Version \(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "?") (\(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "?"))")
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Fun with Quantum")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
    }
}

struct LicensesView: View {
    private let text = WebContent.root.flatMap { try? String(contentsOf: $0.appendingPathComponent("licenses.txt"), encoding: .utf8) } ?? ""

    var body: some View {
        ScrollView {
            Text(text).font(.system(.footnote, design: .monospaced)).textSelection(.enabled).padding()
        }
        .navigationTitle("Licenses")
        .navigationBarTitleDisplayMode(.inline)
    }
}
