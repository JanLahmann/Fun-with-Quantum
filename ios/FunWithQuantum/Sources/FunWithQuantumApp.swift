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

    var body: some View {
        TabView {
            NavigationStack { PlayView(catalog: catalog) }
                .tabItem { Label("Play", systemImage: "gamecontroller") }
            NavigationStack { BuildView(catalog: catalog) }
                .tabItem { Label("Build", systemImage: "cube") }
            NavigationStack { LearnView(catalog: catalog) }
                .tabItem { Label("Learn", systemImage: "graduationcap") }
        }
    }
}
