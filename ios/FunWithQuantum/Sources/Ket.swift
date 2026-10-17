import CryptoKit
import DeviceCheck
import Foundation

/// Ket, the family's AI helper, for the app: the shared assistant Worker (assistant/ in this repo,
/// site `fwq`, contexts `coin-game` and `guide`). An app has no Origin the Worker could allow-list,
/// so it proves it is this app with App Attest (assistant/src/app-auth.ts), as CleanJibe does:
///
///   1. once per install: a Secure Enclave key, attested against a one-time challenge
///      (`/attest/challenge`, `/attest`), so Apple vouches that the key belongs to this bundle;
///   2. every hour: an assertion with that key over a fresh challenge (`/token`);
///   3. `/chat` and `/feedback` carry the hour's token in `X-FwQ-Token`, and no Origin.
///
/// The key id is not a secret (the key never leaves the Secure Enclave), so it lives in
/// UserDefaults. A key that stops working (a restore onto another device, a key the Worker purged
/// after 30 unused days) is thrown away and a new one attested, once. The simulator has no App Attest.
actor KetClient {
    static let shared = KetClient()

    static let base = URL(string: "https://fwq-assistant.jan-35c.workers.dev")!
    static let site = "fwq"
    static let header = "X-FwQ-Token"
    private static let keyDefault = "ket.appAttestKeyId"

    enum Event: Sendable {
        case delta(String)
        /// The answer is complete; `id` is what a thumbs vote refers to.
        case done(id: String)
    }

    enum Failure: Error, Equatable {
        case unsupported        // simulator, or a device without App Attest
        case limit              // this device's questions for today
        case busy               // the app's shared daily budget is spent
        case attest             // the Worker refused this app's key
        case network
        case server

        /// The HTTP status the coin game's web chat understands (widget.ts: 429 limit, 503 busy, else "couldn't be reached").
        var status: Int {
            switch self {
            case .limit: 429
            case .busy: 503
            case .unsupported: 501
            case .attest: 401
            case .network, .server: 502
            }
        }
    }

    struct Turn: Sendable { var role: String; var content: String }

    private var token: String?
    private var tokenExpires = Date.distantPast
    /// One sign-in at a time: two refreshes at once would race on the key's counter, and the loser would throw a good key away.
    private var signingIn: Task<String, Error>?
    private let session: URLSession = {
        let c = URLSessionConfiguration.ephemeral
        c.httpCookieStorage = nil
        c.timeoutIntervalForRequest = 60
        return URLSession(configuration: c)
    }()

    static var isSupported: Bool { DCAppAttestService.shared.isSupported }

    // MARK: - The native guide sheet

    /// One question to the guide, answered as a stream of text pieces and then `done`.
    func ask(_ question: String, page: String, history: [Turn]) -> AsyncThrowingStream<Event, Error> {
        let body: [String: Any] = [
            "site": Self.site, "context": "guide", "locale": Self.locale, "question": question,
            "state": ["page": page], "history": history.map { ["role": $0.role, "content": $0.content] },
        ]
        return AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    let data = try JSONSerialization.data(withJSONObject: body)
                    let (response, bytes) = try await self.forward("/chat", body: data)
                    guard response.statusCode == 200 else { throw Self.failure(status: response.statusCode) }
                    // Server-sent events: `event: delta|done|error`, then `data: {json}`, then a blank line.
                    var event = ""
                    for try await line in bytes.lines {
                        if line.hasPrefix("event:") {
                            event = line.dropFirst(6).trimmingCharacters(in: .whitespaces)
                        } else if line.hasPrefix("data:") {
                            let json = Data(line.dropFirst(5).trimmingCharacters(in: .whitespaces).utf8)
                            let data = (try? JSONSerialization.jsonObject(with: json)) as? [String: Any] ?? [:]
                            switch event {
                            case "delta": if let t = data["t"] as? String { continuation.yield(.delta(t)) }
                            case "done": continuation.yield(.done(id: data["id"] as? String ?? "")); continuation.finish(); return
                            case "error": throw Failure.server
                            default: break
                            }
                        }
                    }
                    throw Failure.server // the stream ended without `done`
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    /// A thumbs up (1) or down (-1) on an answer. Best effort: a lost vote is not an error.
    func vote(_ id: String, _ vote: Int) async {
        guard let data = try? JSONSerialization.data(withJSONObject: ["id": id, "vote": vote]) else { return }
        _ = try? await forward("/feedback", body: data)
    }

    // MARK: - Any request (also what the coin game's web chat sends through fwq://app/__ket/…)

    /// POSTs `body` to `/chat` or `/feedback` with this hour's token; a token the Worker no longer takes is renewed once.
    func forward(_ path: String, body: Data, retry: Bool = true) async throws -> (HTTPURLResponse, URLSession.AsyncBytes) {
        let token = try await validToken()
        var req = Self.request(path, token: token)
        req.httpBody = body
        if path == "/chat" { req.setValue("text/event-stream", forHTTPHeaderField: "Accept") }
        let bytes: URLSession.AsyncBytes, response: URLResponse
        do { (bytes, response) = try await session.bytes(for: req) } catch { throw Failure.network }
        guard let http = response as? HTTPURLResponse else { throw Failure.server }
        if http.statusCode == 401, retry {
            self.token = nil
            return try await forward(path, body: body, retry: false)
        }
        return (http, bytes)
    }

    // MARK: - App Attest

    private func validToken() async throws -> String {
        if let token, tokenExpires.timeIntervalSinceNow > 60 { return token }
        guard Self.isSupported else { throw Failure.unsupported }
        if let signingIn { return try await signingIn.value }
        let task = Task { try await self.signIn() }
        signingIn = task
        defer { signingIn = nil }
        return try await task.value
    }

    private func signIn() async throws -> String {
        if let keyId = UserDefaults.standard.string(forKey: Self.keyDefault) {
            do { return try await refresh(keyId) } catch Failure.attest {
                UserDefaults.standard.removeObject(forKey: Self.keyDefault)
            }
        }
        return try await attestNewKey()
    }

    private func attestNewKey() async throws -> String {
        let service = DCAppAttestService.shared
        let keyId: String
        do { keyId = try await service.generateKey() } catch { throw Failure.attest }
        let challenge = try await self.challenge()
        let attestation: Data
        do {
            attestation = try await service.attestKey(keyId, clientDataHash: Self.hash(challenge))
        } catch {
            throw Self.isNetworkish(error) ? Failure.network : Failure.attest
        }
        let reply = try await post("/attest", [
            "site": Self.site, "keyId": keyId, "challenge": challenge,
            "attestation": attestation.base64EncodedString(),
            "bundleId": Bundle.main.bundleIdentifier ?? "",
        ])
        UserDefaults.standard.set(keyId, forKey: Self.keyDefault)
        return try keep(reply)
    }

    private func refresh(_ keyId: String) async throws -> String {
        let challenge = try await self.challenge()
        let assertion: Data
        do {
            assertion = try await DCAppAttestService.shared.generateAssertion(keyId, clientDataHash: Self.hash(challenge))
        } catch {
            throw Self.isNetworkish(error) ? Failure.network : Failure.attest
        }
        let reply = try await post("/token", [
            "site": Self.site, "keyId": keyId, "challenge": challenge,
            "assertion": assertion.base64EncodedString(),
        ])
        return try keep(reply)
    }

    private func challenge() async throws -> String {
        let reply = try await post("/attest/challenge", ["site": Self.site])
        guard let c = reply["challenge"] as? String else { throw Failure.server }
        return c
    }

    private func keep(_ reply: [String: Any]) throws -> String {
        guard let t = reply["token"] as? String else { throw Failure.server }
        token = t
        let expires = (reply["expires"] as? String).flatMap { try? Date($0, strategy: .iso8601) }
        tokenExpires = expires ?? Date(timeIntervalSinceNow: 50 * 60)
        return t
    }

    private func post(_ path: String, _ body: [String: Any]) async throws -> [String: Any] {
        var req = Self.request(path, token: nil)
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let data: Data, response: URLResponse
        do { (data, response) = try await session.data(for: req) } catch { throw Failure.network }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
        // A 429 here is the sign-in's own limit (new keys per address), not today's questions.
        guard status == 200 else { throw status == 401 ? Failure.attest : status == 429 ? Failure.server : Self.failure(status: status) }
        return json
    }

    // MARK: - Pieces

    private static func request(_ path: String, token: String?) -> URLRequest {
        var req = URLRequest(url: base.appending(path: path))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { req.setValue(token, forHTTPHeaderField: header) }
        return req
    }

    /// What the app signs: SHA-256 of the challenge string's UTF-8 bytes (app-auth.ts).
    private static func hash(_ challenge: String) -> Data { Data(SHA256.hash(data: Data(challenge.utf8))) }

    static func failure(status: Int) -> Failure {
        switch status {
        case 429: .limit
        case 503: .busy
        case 401, 403: .attest
        default: .server
        }
    }

    private static func isNetworkish(_ error: Error) -> Bool {
        (error as? DCError)?.code == .serverUnavailable || error is URLError
    }

    /// The device language, for an answer in it when a question's own language is unclear.
    private static var locale: String { Locale.current.language.languageCode?.identifier ?? "en" }
}
