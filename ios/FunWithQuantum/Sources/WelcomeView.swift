import SwiftUI

/// The first start: the homepage's headline and lead and its three doors, Play, Build and Learn, with their
/// photos and words (portal/src/data/home.ts, through catalog.json), and a word about Ket. A door opens its tab.
struct WelcomeView: View {
    let catalog: Catalog
    /// Opened again from (i): a close button that keeps the current tab.
    var closable = false
    /// The tab to open, or nil to keep the current one.
    let done: (String?) -> Void
    @Environment(\.horizontalSizeClass) private var width
    @State private var finePrint = false

    private static let doorColor: [String: Color] = [
        "play": Color(red: 0.047, green: 0.463, blue: 0.576),   // --cyan
        "learn": Color(red: 0.761, green: 0.184, blue: 0.431),  // --magenta
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Image("LaunchMark").resizable().scaledToFit().frame(width: 64, height: 64).accessibilityHidden(true)
                headline.font(.largeTitle.bold()).fixedSize(horizontal: false, vertical: true)
                Text(catalog.welcome.lead).font(.body).foregroundStyle(.secondary)

                let columns = width == .regular ? [GridItem(.flexible(), spacing: 16), GridItem(.flexible(), spacing: 16), GridItem(.flexible(), spacing: 16)] : [GridItem(.flexible())]
                LazyVGrid(columns: columns, alignment: .leading, spacing: 16) {
                    ForEach(catalog.welcome.doors) { door in
                        Button { done(door.key) } label: { DoorCard(door: door) }
                            .buttonStyle(.plain)
                            .accessibilityHint("Opens the \(door.title) tab")
                    }
                }

                VStack(alignment: .leading, spacing: 6) {
                    Label(catalog.ket.open, systemImage: "bubble.left.and.text.bubble.right").font(.headline)
                    Text(catalog.ket.intro).font(.subheadline)
                    Text(catalog.ket.privacy).font(.footnote).foregroundStyle(.secondary)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 14))

                Button { done("play") } label: {
                    Text("Let's play").font(.headline).frame(maxWidth: .infinity).padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)

                Button("About, privacy and licenses") { finePrint = true }
                    .font(.footnote)
                    .frame(maxWidth: .infinity)
            }
            .padding(24)
            .frame(maxWidth: 980)
            .frame(maxWidth: .infinity)
        }
        .background(Color("LaunchBackground"))
        .overlay(alignment: .topTrailing) {
            if closable {
                Button { done(nil) } label: {
                    Image(systemName: "xmark").font(.body.weight(.semibold)).padding(10).background(.thinMaterial, in: Circle())
                }
                .accessibilityLabel("Close")
                .padding()
            }
        }
        .sheet(isPresented: $finePrint) { AboutView(catalog: catalog) }
    }

    /// "Quantum computing you can play, build & learn." with the door words colored as on the homepage
    /// (play cyan, build the cyan-to-magenta gradient, learn magenta).
    private var headline: Text {
        catalog.welcome.title.reduce(Text("")) { text, part in
            switch part.door {
            case nil: return text + Text(part.text)
            case "build":
                let gradient = LinearGradient(colors: [Self.doorColor["play"]!, Self.doorColor["learn"]!], startPoint: .leading, endPoint: .trailing)
                return text + Text(part.text).foregroundStyle(gradient)
            case let door?: return text + Text(part.text).foregroundStyle(Self.doorColor[door] ?? .primary)
            }
        } + Text(".")
    }
}

private struct DoorCard: View {
    let door: Catalog.Welcome.Door

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            photo
                .frame(height: 150)
                .frame(maxWidth: .infinity)
                .clipped()
                .background(Color.white)
            VStack(alignment: .leading, spacing: 6) {
                Text("\(door.title) →").font(.title3.bold())
                Text(door.text).font(.subheadline).foregroundStyle(.secondary).fixedSize(horizontal: false, vertical: true)
            }
            .padding(16)
        }
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(.separator), lineWidth: 0.5))
        .contentShape(RoundedRectangle(cornerRadius: 14))
    }

    /// As on the homepage: contain (the mug), cover (the photo), left (a screenshot, its left part).
    @ViewBuilder private var photo: some View {
        if let file = WebContent.root?.appendingPathComponent(String(door.image.dropFirst())),
           let image = UIImage(contentsOfFile: file.path) {
            let img = Image(uiImage: image).resizable()
            switch door.fit {
            case "contain": img.scaledToFit().padding(12).accessibilityLabel(door.imageAlt)
            case "left": GeometryReader { g in img.scaledToFill().frame(width: g.size.width, height: g.size.height, alignment: .leading).clipped() }.accessibilityLabel(door.imageAlt)
            default: img.scaledToFill().accessibilityLabel(door.imageAlt)
            }
        } else {
            Color.clear
        }
    }
}
