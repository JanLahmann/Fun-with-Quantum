import SwiftUI

/// Ket as the family guide, native: the same Worker context as the guide box on fun-with-quantum.org
/// (`guide`), with the tab's page as its state ("/play/", "/build/", "/learn/"). Answers stream in;
/// **bold** and links work, links only to the sites the web chat links too.
struct KetGuideSheet: View {
    let texts: Catalog.KetTexts
    let page: String
    @Environment(\.dismiss) private var dismiss
    @State private var messages: [Message] = []
    @State private var input = ""
    @State private var task: Task<Void, Never>?
    @FocusState private var focused: Bool

    struct Message: Identifiable {
        let id = UUID()
        let fromUser: Bool
        var text: String
        var answerId: String?
        var failed = false
        var voted = false
    }

    var body: some View {
        NavigationStack {
            ScrollViewReader { scroll in
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        Text(texts.intro).font(.subheadline)
                        Text(texts.privacy).font(.footnote).foregroundStyle(.secondary)
                        ForEach($messages) { $m in bubble($m).id(m.id) }
                    }
                    .padding()
                }
                .onChange(of: messages.last?.text) { _, _ in
                    if let last = messages.last { withAnimation { scroll.scrollTo(last.id, anchor: .bottom) } }
                }
            }
            .safeAreaInset(edge: .bottom) { askBar }
            .navigationTitle(texts.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
            .environment(\.openURL, OpenURLAction { url in Safari.open(url); return .handled })
        }
        .onDisappear { task?.cancel() }
    }

    @ViewBuilder private func bubble(_ m: Binding<Message>) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(m.wrappedValue.fromUser ? texts.you : texts.explainer)
                .font(.caption2.weight(.semibold)).foregroundStyle(.secondary).textCase(.uppercase)
            if m.wrappedValue.fromUser {
                Text(m.wrappedValue.text)
            } else if m.wrappedValue.text.isEmpty {
                Text(texts.thinking).italic().foregroundStyle(.secondary)
            } else {
                Text(rendered(m.wrappedValue.text))
                    .foregroundStyle(m.wrappedValue.failed ? Color.red : Color.primary)
                    .textSelection(.enabled)
                    .padding(.leading, 10)
                    .overlay(alignment: .leading) { Rectangle().fill(Color.pink).frame(width: 3) }
                if let id = m.wrappedValue.answerId {
                    if m.wrappedValue.voted {
                        Text(texts.thanks).font(.caption).foregroundStyle(.secondary)
                    } else {
                        HStack(spacing: 8) {
                            Button { vote(m, id, 1) } label: { Text("👍") }.accessibilityLabel(texts.helpful)
                            Button { vote(m, id, -1) } label: { Text("👎") }.accessibilityLabel(texts.notHelpful)
                        }
                        .buttonStyle(.bordered).controlSize(.small)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var askBar: some View {
        HStack(alignment: .bottom, spacing: 8) {
            TextField(texts.placeholder, text: $input, axis: .vertical)
                .lineLimit(1...5)
                .textFieldStyle(.roundedBorder)
                .focused($focused)
                .onSubmit(send)
            Button(texts.send, action: send)
                .buttonStyle(.borderedProminent)
                .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || task != nil)
        }
        .padding()
        .background(.bar)
    }

    private func send() {
        let question = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !question.isEmpty, task == nil else { return }
        input = ""
        // The last ten question/answer pairs that went through, for follow-up questions.
        var history: [KetClient.Turn] = []
        for (q, a) in zip(messages, messages.dropFirst()) where q.fromUser && !a.fromUser && a.answerId != nil {
            history += [.init(role: "user", content: q.text), .init(role: "assistant", content: a.text)]
        }
        messages.append(Message(fromUser: true, text: String(question.prefix(1000))))
        messages.append(Message(fromUser: false, text: ""))
        let index = messages.count - 1
        task = Task {
            do {
                for try await event in await KetClient.shared.ask(String(question.prefix(1000)), page: page, history: Array(history.suffix(20))) {
                    switch event {
                    case .delta(let t): messages[index].text += t
                    case .done(let id): messages[index].answerId = id.isEmpty ? nil : id
                    }
                }
            } catch {
                messages[index].failed = true
                messages[index].text = switch error as? KetClient.Failure {
                case .limit: texts.errRate
                case .busy: texts.errBusy
                case .unsupported: "Ket needs an iPhone or iPad with App Attest (not the simulator)."
                default: texts.errNetwork
                }
            }
            task = nil
        }
    }

    private func vote(_ m: Binding<Message>, _ id: String, _ value: Int) {
        m.wrappedValue.voted = true
        Task { await KetClient.shared.vote(id, value) }
    }

    /// The answer's Markdown (bold, links) as text; a link to a site the web chat wouldn't link stays plain.
    private func rendered(_ text: String) -> AttributedString {
        let options = AttributedString.MarkdownParsingOptions(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        var s = (try? AttributedString(markdown: text, options: options)) ?? AttributedString(text)
        let trusted = try? Regex(texts.trusted)
        for run in s.runs {
            guard let url = run.link else { continue }
            let ok = trusted.map { url.absoluteString.firstMatch(of: $0) != nil } ?? false
            if !ok { s[run.range].link = nil }
        }
        return s
    }
}

/// The toolbar button that opens the guide sheet on a tab.
struct AskKetButton: ToolbarContent {
    let texts: Catalog.KetTexts
    let page: String
    @State private var shown = false

    var body: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button { shown = true } label: { Label(texts.open, systemImage: "bubble.left.and.text.bubble.right") }
                .sheet(isPresented: $shown) { KetGuideSheet(texts: texts, page: page) }
        }
    }
}
