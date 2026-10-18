# Fun with Quantum for iPhone and iPad

The family's browser games and 3D models as an app, offline, with the same three doors as
fun-with-quantum.org. Not in the App Store yet.

| Tab | What |
|---|---|
| Play | the launched browser games (`webGame: true` in `portal/src/content/games/`), from the portal build, and Quantum Golf (Entangible's golf-only build), offline; the notebook games and the Play projects open in Safari |
| Build | 3D models: RasQberry Two (rasqberry.org's viewer: explode, parts, assembly), Quantego One, Two and Two 1024 (quantego.org's LDraw viewer: building steps, explode, parts, tour), Qutie System One and Two (turntable); Quantego One and Two also in AR (AR Quick Look); the Build projects |
| Learn | the Learn projects, in Safari |
| all | "Ask Ket": the family guide (below); Ket also answers under the coin game |

## Ket, the AI helper

- **Under the coin game:** the portal's own chat (`AssistantChat.astro`), shown in the app build. Its requests go to
  `fwq://app/__ket/chat` and `/feedback`; the app forwards them to the Worker (`WebContent.swift`), so pages still
  load nothing from the internet themselves.
- **The family guide:** a native sheet ("Ask Ket" on the Play, Build and Learn tabs, `KetGuideSheet.swift`), context
  `guide`, with the tab's page as state; texts and the sites an answer may link come from the portal (`catalog.json`).
- **Sign-in:** App Attest (`Ket.swift`, as in CleanJibe): the Worker knows the app as site `fwq`
  (`assistant/src/app-auth.ts`), contexts `coin-game` and `guide`, header `X-FwQ-Token`, and counts it against its own
  budget (`[vars.SITES.fwq.budgets.app]`: 30 per device, 500 for all devices per day). The simulator has no App Attest:
  Ket answers only on a real iPhone or iPad.
- **Before the App Store:** Ket is in the app's TestFlight builds while it is still hidden on the website
  (`?assistant=1`). Decide with Jan whether it ships, and keep the App Store privacy answers in line with
  `PrivacyInfo.xcprivacy` (questions and an App Attest key ID, not linked, not tracking).

## How it is built

- `FunWithQuantum/Sources/`: SwiftUI. Web content is served from the app bundle as `fwq://app/…`
  (`WebContent.swift`); pages can't load anything from the internet, and links to the web open in Safari.
- `scripts/build-web.mjs` builds `FunWithQuantum/Web/` (not committed): the portal (its app build, `PUBLIC_FWQ_APP=1` → `portal/dist-app`,
  without analytics, CDN and Ket; never the unlisted `/preview/` pages or their code), the model viewers,
  `licenses.txt` (About → Licenses) and
  `catalog.json` for the native lists.
- `golf/`: Quantum Golf, Entangible's `npm run build:golf`, from its GitHub release asset (`quantum-golf` in
  `web/sources.json`: tag, asset name and sha256); the build checks the hash and that nothing in it reaches the
  internet, and adds its `THIRD_PARTY_NOTICES.txt` to `licenses.txt`. To update: put the new release in
  `web/sources.json`, rebuild, run the smoke test.
- `web/`: the model pages. The viewers and models are the family's own, fetched from their
  repositories at the commits in `web/sources.json`, each bundled with the three.js version it uses
  on the web (`three-160` for Quantego, `three-169` for RasQberry). A fetched viewer is changed only by
  the exact-match `PATCHES` in `build-web.mjs` (one today: Quantego's framing in portrait).
- `project.yml`: the Xcode project, generated with [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
cd portal && npm ci && cd ../ios/web && npm ci && cd ..
node scripts/build-web.mjs          # --skip-portal reuses portal/dist-app
xcodegen generate
open FunWithQuantum.xcodeproj       # or: xcodebuild test -scheme FunWithQuantum -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

`UITests/SmokeTests.swift` walks the tabs and opens a game and each viewer; with
`TEST_RUNNER_FWQ_SCREENSHOTS=<dir>` it saves a screenshot of every screen. CI: `.github/workflows/ios.yml`.

To update a model or viewer: put the new commit in `web/sources.json`, rebuild, run the smoke test
and look at the screenshots.

## TestFlight

App Store Connect: "Fun with Quantum" (app id 6823967331, SKU `fun-with-quantum-ios`, bundle id
`de.lahmann.funwithquantum`, created 2026-10-17). TestFlight group **Internal** gets every build.

```bash
ASC_KEY_ID=… ASC_ISSUER_ID=… ios/scripts/testflight.sh <next build number>
```

The script builds the web content, archives and uploads; the API key stays in `~/.appstoreconnect`.
Signing is local (Apple Distribution certificate, profile "Fun with Quantum App Store", see
`ExportOptions.plist`), because the API key may not use Xcode's cloud signing. When the profile
expires (2027-08-11, with the certificate), create a new one for the bundle id in the developer portal
or through the API, with the same name.
