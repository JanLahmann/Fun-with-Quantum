import XCTest

/// A screenshot of every screen, scrolled through, for a design review (not run in CI).
///   TEST_RUNNER_FWQ_TOUR=<dir> xcodebuild test … -only-testing:FunWithQuantumUITests/TourTests
final class TourTests: XCTestCase {
    private var app: XCUIApplication!
    private var dir: URL!
    private var n = 0

    override func setUpWithError() throws {
        guard let path = ProcessInfo.processInfo.environment["FWQ_TOUR"] ?? ProcessInfo.processInfo.environment["TEST_RUNNER_FWQ_TOUR"] else { throw XCTSkip("set FWQ_TOUR to take the tour") }
        dir = URL(fileURLWithPath: path)
        continueAfterFailure = true
        app = XCUIApplication()
        app.launchArguments = ["-welcomeSeen", "NO"] + (ProcessInfo.processInfo.environment["TEST_RUNNER_FWQ_TOUR_ARGS"] ?? ProcessInfo.processInfo.environment["FWQ_TOUR_ARGS"] ?? "").split(separator: " ").map(String.init)
        app.launch()
    }

    private func shot(_ name: String) {
        n += 1
        try? app.screenshot().pngRepresentation.write(to: dir.appendingPathComponent(String(format: "%02d-%@.png", n, name)))
    }

    /// Screenshots while scrolling down `pages` screens.
    private func scrollShots(_ name: String, pages: Int) {
        shot("\(name)-0")
        for i in 1...pages { app.swipeUp(velocity: .slow); sleep(1); shot("\(name)-\(i)") }
    }

    private func open(_ label: String) {
        let cell = app.buttons.containing(NSPredicate(format: "label BEGINSWITH %@", label)).firstMatch
        if !cell.waitForExistence(timeout: 5) { for _ in 0..<4 where !cell.isHittable { app.swipeUp() } }
        cell.tap()
    }

    private func back() { app.navigationBars.buttons.firstMatch.tap(); sleep(1) }

    func testTour() {
        XCTAssertTrue(app.buttons["Let's play"].waitForExistence(timeout: 10))
        scrollShots("welcome", pages: 3)
        app.buttons["Let's play"].tap()
        sleep(1)
        scrollShots("play", pages: 2)
        app.swipeDown(); app.swipeDown(); app.swipeDown()
        for (game, pages) in [("Quantum Coin Game", 7), ("GHZ Game", 6), ("The CHSH Game", 6)] {
            open(game); sleep(4)
            scrollShots(game.replacingOccurrences(of: " ", with: "-"), pages: pages)
            back()
        }
        app.tabBars.buttons["Build"].tap(); sleep(1)
        scrollShots("build", pages: 2)
        app.swipeDown(); app.swipeDown()
        for model in ["RasQberry Two", "Quantego Two", "Qutie System Two"] {
            open(model); sleep(8); shot(model.replacingOccurrences(of: " ", with: "-"))
            back()
        }
        app.tabBars.buttons["Learn"].tap(); sleep(1)
        shot("learn")
        app.navigationBars["Learn"].buttons["Ask Ket"].tap(); sleep(1)
        shot("ket-sheet")
        app.buttons["Done"].tap(); sleep(1)
        app.navigationBars["Learn"].buttons["Welcome"].tap(); sleep(1)
        shot("welcome-again")
        app.buttons["About, privacy and licenses"].firstMatch.tap(); sleep(1)
        scrollShots("about", pages: 2)
    }
}
