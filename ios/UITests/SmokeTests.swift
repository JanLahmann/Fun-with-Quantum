import XCTest

/// Walks the three tabs, opens a game and each kind of 3D viewer, and checks the web content
/// rendered. With FWQ_SCREENSHOTS=<dir> in the environment, saves a screenshot of each screen there.
final class SmokeTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false
        app = XCUIApplication()
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
        XCTAssertTrue(app.navigationBars["Play"].waitForExistence(timeout: 10))
        shot("1-play")

        open("Quantum Coin Game")
        XCTAssertTrue(app.webViews.firstMatch.waitForExistence(timeout: 10))
        // A cold simulator on CI takes a while for its first web page; the screenshot comes first, so a failure shows what was there.
        let rendered = app.webViews.staticTexts.containing(NSPredicate(format: "label CONTAINS[c] 'coin'")).firstMatch.waitForExistence(timeout: 60)
        sleep(2); shot("2-coin-game")
        XCTAssertTrue(rendered, "the coin game page didn't render")
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
