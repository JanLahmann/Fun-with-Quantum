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

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack { PlayView(catalog: catalog) }
                .tabItem { Label("Play", systemImage: "gamecontroller") }.tag("play")
            NavigationStack { BuildView(catalog: catalog) }
                .tabItem { Label("Build", systemImage: "cube") }.tag("build")
            NavigationStack { LearnView(catalog: catalog) }
                .tabItem { Label("Learn", systemImage: "graduationcap") }.tag("learn")
        }
        .onAppear { if !welcomeSeen { welcomeShown = true } }
        .onReceive(NotificationCenter.default.publisher(for: .showWelcome)) { _ in welcomeShown = true }
        .fullScreenCover(isPresented: $welcomeShown) {
            WelcomeView(catalog: catalog) { door in
                tab = door
                welcomeSeen = true
                welcomeShown = false
            }
        }
    }
}

extension Notification.Name {
    /// About → "Welcome page".
    static let showWelcome = Notification.Name("fwq.showWelcome")
}
