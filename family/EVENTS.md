# Fun with Quantum — Umami event taxonomy (v2)

All family sites report to one Umami Cloud property (`97f347ac…`, per-site `data-domains`). Page views
come for free; the events below are the shared vocabulary.

## The tracker tag (family standard, 2026-10-19)

Every family site, on all pages and locales, loads Umami with these two tags, the inline one first.
Only `data-domains` differs per site (its own host or hosts):

```html
<script>(function(){try{var q=location.search;if(/[?&]notrack\b/.test(q))localStorage.setItem('umami.disabled','1');if(/[?&]track\b/.test(q))localStorage.removeItem('umami.disabled')}catch(e){}window.fwqUmamiBeforeSend=function(t,p){var n=navigator;return(n.webdriver||/HeadlessChrome|bot|crawl|spider|Lighthouse|PageSpeed/i.test(n.userAgent))?false:p}})();</script>
<script defer src="https://cloud.umami.is/script.js" data-website-id="97f347ac-e7ba-4be3-b26f-ab4b328bdbf2" data-domains="YOUR-HOST(S)" data-before-send="fwqUmamiBeforeSend"></script>
```

* **No automated browsers.** `fwqUmamiBeforeSend` drops every page view and event from a browser that is
  driven by automation (`navigator.webdriver`) or names itself a bot, crawler, Lighthouse or PageSpeed —
  in October 2026 about 30 % of all visitors were headless Chrome from Singapore.
* **`?notrack`** (the parameter's presence, any value) on any URL of a site switches counting off for that browser and that site
  (`localStorage` `umami.disabled`, which Umami's tracker honors); **`?track`** switches it back on. Jan
  uses it once per site and browser to keep his own visits out.
* **Strict CSP** (no inline scripts): put the inline code into a small same-origin `.js` file and load it,
  not deferred, before the tracker.
* **Check** after a change: a normal browser sends (a POST to `…/api/send`; the tracker now posts to
  `gateway.umami.is`), a headless or Playwright run sends nothing, and `?notrack` stops sending.
  `family/audit/family-audit.sh` reports the tag per site (column `bsend`).

Hostnames besides the sites' own: `app.fun-with-quantum.org` (the FwQ iOS app, below),
`device.rasqberry.org` (RasQberry Two devices: on-device pages and helpers report under this hostname,
not as rasqberry.org), `ios.cleanjibe.org` (CleanJibe's iOS app, not a family site).

## Events

**Naming: `<Site>: <what happened>`**, lower case after the colon. Every name says which site it came
from, so any Umami report is readable without a hostname filter. `<Site>` is the member's manifest
`label` (defaults to `name`; the portal is `Portal`). Details go in properties, never in the name.
Family-wide totals: filter the event name with **contains**, e.g. `family footer click` or
`notebook launch`.

Most events need **no JavaScript**: Umami's tracker records a click on any element that carries
`data-umami-event="<name>"`, and every `data-umami-event-<prop>="<value>"` becomes a property.

| Event | Properties | Where |
|---|---|---|
| `<Site>: family footer click` | `to` (member id) | every family footer — the name comes from the renderers / `footerEvent()`, so all sites get it from the manifest |
| `Portal: notebook launch` | `target`, `image`, `notebook` | portal game pages |
| `Portal: game start` | `game` (quantum-coin-game \| ghz-game \| chsh-game) | the public browser games: the player's first answer (button press) on the page |
| `Portal: game finish` | `game` | played through: on from the last play chapter to the closing one (coin game: "You be quantum" → Sandbox; GHZ: Team quantum → How it works; CHSH: Turn the angles → Why 85%). Once per page view each; the preview games don't send them |
| `Portal: outbound click` | `host` | any external link without an event of its own (`Base.astro`, sent at click time without holding the link) |
| `Portal: app store click` | `target` (testflight \| app-store) | any link to the app on TestFlight or the App Store (none yet) |
| `Portal: share click` | `target` | reserved for share buttons (the portal has none yet) |
| `Portal: shop click` | `host` | portal footer |
| `Portal: workshop request` | — | /workshops/ — "Request support" (opens the issue form) |
| `Portal: hero click` | `target` (coin-game \| play) | homepage hero buttons "▶ Play in your browser" and "All games" |
| `Portal: highlight click` | `id` (highlight), `target` | homepage highlight box (`portal/src/data/highlights.ts`) |
| `Portal: coin game chapter` | `chapter` (1–5) | /play/quantum-coin-game/ — the browser game, chapter opened |
| `Portal: coin game round` | `chapter`, `result` (you win \| computer wins), `starts` (you \| computer, chapters 1–2), `strategy` (chapter 4: your two moves) | a finished round |
| `Portal: coin game order` | `chapter`, `starts` | "Who starts?" switched in chapters 1–2 |
| `Portal: coin game explain` | `term`, `lang` | an explanation opened (term link, ⓘ, or the Explain index) |
| `Portal: coin game learn more` | `site` (ibm \| doqumentation), `term` | "Learn more" link in an explanation clicked |
| `Portal: coin game peek` | — | "Look inside" pressed after losing to the quantum computer |
| `Portal: coin game sandbox` | `action` (measure \| measure 100), `outcome` / `gates` | sandbox measurements |
| `Portal: ghz game round` · `classical` · `1000 rounds` | `result` (win \| lost), `question` / `won` | /play/ghz-game/: a quantum round; a classical team tested on the four questions; 1000 rounds at once |
| `Portal: ghz game all strategies` · `proof` · `explain section` | — / `section` | GHZ: "try all strategies", the proof, a section of "How it works" |
| `Portal: chsh game round` · `1000 rounds` | `chapter`, `result` / `won`, `question` | /play/chsh-game/ |
| `Portal: chsh game angles` · `all strategies` · `proof` · `explain section` | `action`, `win` (%) / — / `section` | CHSH: angle presets, the classical proof, a section of "Why 85%" |
| `Portal: ghz game chapter` · `chsh game chapter` · `… explain` · `… learn more` | as for the coin game | the shared game frame (`src/lib/games/shell.ts`) |
| `Portal: coin game why` | `chapter`, `v` (2) | redesign preview (/preview/quantum-coin-game/): "Why?" opened |
| `Portal: coin game step` | `action` (toggle), `move`, `step`, `v` (2) | redesign preview, chapter 3: your move changed in the step-by-step view |
| `Portal: coin game math` | `action` (toggle), `move`, `step`, `v` (2) | redesign preview, chapter 6: your move changed |

The redesign preview sends the coin-game events above with an extra `v: 2`, and `Portal: coin game round` also with `replay` (yes \| no: "Same round, other move").
| `Portal: assistant open` | `context` (coin-game \| guide) | Ket's chat box opened: under a game, or the family guide (home page, doors, teachers, workshops) |
| `Portal: assistant ask` | `context`, `level` (games only) | a question sent |
| `Portal: assistant level` | `context`, `level` (kids \| normal \| math) | the level switch changed |
| `Portal: assistant vote` | `context`, `vote` (up \| down) | thumbs under an answer |
| `QuBins: notebook launch` | `image`, `mode`, `ui`, `notebook` | qubins.org/launch (waits ≤1.5 s for the tracker, then redirects) |
| `QuBins: hero launch click` · `example launch click` · `catalog launch click` | `tag` / `example` | qubins.org landing page |
| `QuBins: hero docker copy` · `catalog docker copy` · `catalog filter minor` · `catalog filter flavor` · `catalog show all` | `tag` / `value` | qubins.org catalog |
| `QuBins: launch url copy` · `launch badge copy` · `launch mode override` | as before | qubins.org launch-link builder |
| `doQumentation: notebook launch` | `target` (binder \| colab), `notebook`, `page`, `locale` | Binder banner, Colab buttons |
| `doQumentation: notebook download` | `notebook`, `page`, `locale` | download button |
| `doQumentation: code run` · `run all` | `page`, `locale` | executable code cells |
| `doQumentation: tutorial feedback` · `translation feedback` | `rating`, `page`, `locale` | feedback widgets |
| `doQumentation: play box click` | `game` (coin \| ghz \| chsh \| ghzReal \| sat), `page`, `locale` | "Play it as a game" box at the end of matching tutorials, linking to fun-with-quantum.org/play/ (UTM `utm_source=doqumentation&utm_medium=referral&utm_campaign=play-box`) |
| `doQumentation: outbound click` | `host`, `category`, `url`, `path`, `from`, `locale` | every external link (JS tracker) |
| `Quantego: file download` | `kind` (pdf \| studio \| pab \| ldraw), `file` | quantego.org instruction and model files |
| `Quantego: outbound click` | `host` | every link to another site (footer links keep their own event) |
| `Qutie: STL download` | `file` | qutie.org |
| `Qutie: shop click` | `host` | qutie.org footer |
| `Qutie: outbound click` | `host` | external links without an event of their own |
| `CertiQ: quiz start` | `mode` (drill \| mock), `section` (s1–s8 \| all), `objective` (drill only) | certiq.dev quiz |
| `CertiQ: quiz finish` | as quiz start, plus `score` (0-49 \| 50-69 \| 70-89 \| 90-100); a mock also `result` (pass \| fail) | a finished quiz |
| `CertiQ: objective filter` | `section`, `objective` | the objective filter |
| `CertiQ: outbound click` | `host`, `category` (ibm-exam \| docs \| github \| doqumentation \| apps \| other) | external links |
| `CertiQ: file download` | `kind` (anki \| epub), `file` | Anki deck and EPUB downloads |
| `RasQberry Two: image download` | `file`, `stream`, `tag` | rasqberry.org/latest redirect |
| `RasQberry Two: beta box click` | `target` (imager \| release-notes \| feedback \| ab-image \| learning-paths) | rasqberry.org homepage "New beta" box |
| `RasQberry Two: newsletter open` | — | rasqberry.org footer |
| `RasQberry Two: assistant open` / `ask` / `vote` | `context` (build \| device), `vote` | the RasQberry helper (widget.js from the assistant Worker) |
| `App: outbound click` | `host` | the FwQ iOS app (hostname `app.fun-with-quantum.org`): any link that opens in Safari |
| `App: notebook launch` | `notebook` (game id) | the app's Play tab, a notebook game row |
| `App: AR open` | `model` | the app's Build tab, "View in AR" |
| `App: assistant open` · `ask` · `vote` | `context` (guide), `vote` (up \| down) | the app's native Ket guide sheet |
| `Entangible: runner start` · `runner finish` | `level` (+ `score` on finish) | entangible.org Runner; also in the FwQ app, as Golf (start: once per run, when play begins) |
| `Entangible: golf hole finished` · `golf round finished` | `qubits`, `score`, `course` / `course`, `scope` | entangible.org Golf; also in the FwQ app (hostname `app.fun-with-quantum.org`), through its `window.umami` bridge |
| `racetraQ: mode change` · `track change` | `mode` (watch \| race \| evolution), `track` | racetraq.org (browser edition) — header tabs |
| `racetraQ: driver change` · `rival change` | `driver` (weights id), `qubits` / `rival` (none \| mlp \| pro) | browser edition — driver and rival chips |
| `racetraQ: race lap` | `track`, `lap_time` (s, 1 decimal), `clean` (yes \| no), `opponent` | a visitor's finished lap in Race mode |
| `racetraQ: composer open` | `qubits`, `track` | "Open this decision in IBM Quantum Composer" |
| `racetraQ: about open` | — | "What is this?" |
| `racetraQ: outbound click` | `host` | footer and About links |

v1 names (`family-footer`, `launch`, `download`, `outbound`, `game`, `newsletter`, doQumentation's
`Run Code` etc.) are retired: every site sends v2 names only (Jan, 2026-10-19). Properties carry no
personal data and no free text.

racetraQ (formerly traQmania): only the browser edition (racetraq.org, GitHub Pages) is
instrumented — the Python demo app has no web tracker. Events are defined in `browser/src/analytics.ts`.
Not instrumented: qamposer.org (no Umami tag yet — co-owned).
**The FwQ iOS app** reports with hostname `app.fun-with-quantum.org`: page views at the website's paths for its own
screens (`/`, `/play/`, `/build/`, `/learn/`) and for every page it shows (`/play/<game>/`, `/models/<id>.html`,
`/bundles/<id>/index.html`), the pages' own events under their website names (`Portal: coin game round`, …) and the
`App: …` events above. No tracker script: `ios/FunWithQuantum/Sources/Analytics.swift` gives the pages
`window.umami` and sends natively; simulator runs send nothing.
cleanjibe.org (Jan's WingFoil project, not a family site) also reports into this property — the
Umami Hobby plan allows one website — and so will its iOS app, as `ios.cleanjibe.org`. Exclude the hostnames
`cleanjibe.org` and `ios.cleanjibe.org` in family-wide reports.

## Reading it in Umami

Website dashboard → **Events** lists names grouped by site prefix; click one for its properties.
Reports: *Breakdown* (hostname × event × property), *Funnel* (portal page view → `Portal: family
footer click` → member page view — works across hostnames because all sites share one property),
*Journey*, *Goals*, *UTM*. Boards: Family overview · Family: events · Family: campaigns
(`utm_source=linkedin&utm_medium=social&utm_campaign=<slug>` on every shared link).
