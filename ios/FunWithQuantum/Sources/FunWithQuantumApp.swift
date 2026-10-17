import SwiftUI

/// Fun with Quantum: the family's browser games and 3D models, on the device and offline.
/// Play, Build and Learn as on fun-with-quantum.org; the web content comes from Web/ (scripts/build-web.mjs).
@main
struct FunWithQuantumApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

struct RootView: View {
    private let catalog = Catalog.bundled
    @State private var tab = "play"
    /// The welcome page shows once, on the first start (and again from About).
    @AppStorage("welcomeSeen") private var welcomeSeen = false
    @State private var welcomeShown = false
    /// Opened again from (i): it can be closed without changing the tab.
    @State private var welcomeAgain = false

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack { PlayView(catalog: catalog) }
                .tabItem { Label("Play", systemImage: "gamecontroller") }.tag("play")
            NavigationStack { BuildView(catalog: catalog) }
                .tabItem { Label("Build", systemImage: "cube") }.tag("build")
            NavigationStack { LearnView(catalog: catalog) }
                .tabItem { Label("Learn", systemImage: "graduationcap") }.tag("learn")
        }
        .onAppear { if !welcomeSeen { welcomeAgain = false; welcomeShown = true } }
        .onReceive(NotificationCenter.default.publisher(for: .showWelcome)) { _ in welcomeAgain = true; welcomeShown = true }
        .fullScreenCover(isPresented: $welcomeShown) {
            WelcomeView(catalog: catalog, closable: welcomeAgain) { door in
                if let door { tab = door }
                welcomeSeen = true
                welcomeShown = false
            }
        }
    }
}

extension Notification.Name {
    /// The (i) button on every tab.
    static let showWelcome = Notification.Name("fwq.showWelcome")
}
