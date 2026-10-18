import XCTest

/// Walks the three tabs, opens a game, the bundled games and each kind of 3D viewer, and checks the web content
/// rendered. With FWQ_SCREENSHOTS=<dir> in the environment, saves a screenshot of each screen there.
final class SmokeTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-welcomeSeen", "NO"] // always start on the welcome page
        app.launch()
    }

    private func shot(_ name: String) {
        guard let dir = ProcessInfo.processInfo.environment["FWQ_SCREENSHOTS"] ?? ProcessInfo.processInfo.environment["TEST_RUNNER_FWQ_SCREENSHOTS"] else { return }
        try? app.screenshot().pngRepresentation.write(to: URL(fileURLWithPath: dir).appendingPathComponent("\(name).png"))
    }

    private func open(_ label: String) {
        let cell = app.buttons.containing(NSPredicate(format: "label BEGINSWITH %@", label)).firstMatch
        XCTAssertTrue(cell.waitForExistence(timeout: 10), "\(label) not listed")
        cell.tap()
    }

    func testPlayBuildLearn() {
        // The welcome page: the homepage's three doors; "Let's play" opens the Play tab.
        XCTAssertTrue(app.buttons["Let's play"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label BEGINSWITH '3D-print or LEGO-build'")).firstMatch.exists)
        shot("0-welcome")
        app.buttons["Let's play"].tap()
        XCTAssertTrue(app.navigationBars["Play"].waitForExistence(timeout: 10))
        shot("1-play")

        // The guide sheet: asks the Worker through App Attest, which the simulator doesn't have.
        app.navigationBars["Play"].buttons["Ask Ket"].tap()
        let field = app.textFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        field.tap()
        field.typeText("I have a 3D printer. What can I build?")
        // The simulator's one-time keyboard tip can cover the sheet.
        if app.buttons["Continue"].waitForExistence(timeout: 1) { app.buttons["Continue"].tap() }
        app.buttons["Ask"].tap()
        let unsupported = app.staticTexts.containing(NSPredicate(format: "label CONTAINS 'needs an iPhone or iPad'")).firstMatch.waitForExistence(timeout: 10)
        shot("1b-ket-guide")
        XCTAssertTrue(unsupported, "the guide sheet didn't answer")
        app.buttons["Done"].tap()

        open("Quantum Coin Game")
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 10))
        // A cold simulator on CI takes a while for its first web page; the screenshot comes first, so a failure shows what was there.
        let rendered = app.webViews.staticTexts.containing(NSPredicate(format: "label CONTAINS[c] 'coin'")).firstMatch.waitForExistence(timeout: 60)
        sleep(2); shot("2-coin-game")
        XCTAssertTrue(rendered, "the coin game page didn't render")
        // Ket's chat under the game is there (the app's own Ket, through fwq://app/__ket).
        let askKet = app.webViews.buttons.containing(NSPredicate(format: "label CONTAINS 'Ask Ket'")).firstMatch
        for _ in 0..<12 where !askKet.exists { app.swipeUp() }
        XCTAssertTrue(askKet.exists, "the coin game has no Ask Ket button")
        app.navigationBars.buttons.firstMatch.tap()

        // Quantum Golf: Entangible's golf-only bundle, offline from the app.
        open("Quantum Golf")
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 10))
        // its gate tools are switches, in any language (the game follows the device: English or German)
        let golf = app.webViews.switches.firstMatch.waitForExistence(timeout: 30)
        sleep(2); shot("2b-quantum-golf")
        XCTAssertTrue(golf, "Quantum Golf didn't render")
        app.navigationBars.buttons.firstMatch.tap()

        // Quantum Runner: Entangible's runner bundle; a run starts with its Start button (any language).
        open("Quantum Runner")
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 10))
        let runner = app.webViews.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'start'")).firstMatch.waitForExistence(timeout: 30)
        sleep(2); shot("2c-quantum-runner")
        XCTAssertTrue(runner, "Quantum Runner didn't render")
        app.navigationBars.buttons.firstMatch.tap()

        XCTAssertTrue(app.tabBars.buttons["Build"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Build"].tap()
        XCTAssertTrue(app.navigationBars["Build"].waitForExistence(timeout: 5))
        shot("3-build")
        for (model, wait) in [("RasQberry Two", 8), ("Quantego Two", 10), ("Qutie System One", 6)] {
            open(model)
            XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 10))
            sleep(UInt32(wait))
            shot("4-\(model.replacingOccurrences(of: " ", with: "-"))")
            app.navigationBars.buttons.firstMatch.tap()
        }

        XCTAssertTrue(app.tabBars.buttons["Learn"].waitForExistence(timeout: 5))
        app.tabBars.buttons["Learn"].tap()
        XCTAssertTrue(app.navigationBars["Learn"].waitForExistence(timeout: 5))
        shot("5-learn")
    }
}
