# Fun with Quantum — Umami event taxonomy (v2)

All family sites report to one Umami Cloud property (`97f347ac…`, per-site `data-domains`). Page views
come for free; the events below are the shared vocabulary.

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
| `Portal: shop click` | `host` | portal footer |
| `Portal: workshop request` | — | /workshops/ — "Request support" (opens the issue form) |
| `Portal: highlight click` | `id` (highlight), `target` | homepage highlight box (`portal/src/data/highlights.ts`) |
| `Portal: coin game chapter` | `chapter` (1–5) | /play/quantum-coin-game/ — the browser game, chapter opened |
| `Portal: coin game round` | `chapter`, `result` (you win \| computer wins), `starts` (you \| computer, chapters 1–2), `strategy` (chapter 4: your two moves) | a finished round |
| `Portal: coin game order` | `chapter`, `starts` | "Who starts?" switched in chapters 1–2 |
| `Portal: coin game explain` | `term`, `lang` | an explanation opened (term link, ⓘ, or the Explain index) |
| `Portal: coin game learn more` | `site` (ibm \| doqumentation), `term` | "Learn more" link in an explanation clicked |
| `Portal: coin game peek` | — | "Look inside" pressed after losing to the quantum computer |
| `Portal: coin game sandbox` | `action` (measure \| measure 100), `outcome` / `gates` | sandbox measurements |
| `QuBins: notebook launch` | `image`, `mode`, `ui`, `notebook` | qubins.org/launch (waits ≤1.5 s for the tracker, then redirects) |
| `QuBins: hero launch click` · `example launch click` · `catalog launch click` | `tag` / `example` | qubins.org landing page |
| `QuBins: hero docker copy` · `catalog docker copy` · `catalog filter minor` · `catalog filter flavor` · `catalog show all` | `tag` / `value` | qubins.org catalog |
| `QuBins: launch url copy` · `launch badge copy` · `launch mode override` | as before | qubins.org launch-link builder |
| `doQumentation: notebook launch` | `target` (binder \| colab), `notebook`, `page`, `locale` | Binder banner, Colab buttons |
| `doQumentation: notebook download` | `notebook`, `page`, `locale` | download button |
| `doQumentation: code run` · `run all` | `page`, `locale` | executable code cells |
| `doQumentation: tutorial feedback` · `translation feedback` | `rating`, `page`, `locale` | feedback widgets |
| `doQumentation: outbound click` | `host`, `category`, `url`, `path`, `from`, `locale` | every external link (JS tracker) |
| `Quantego: file download` | `kind` (pdf \| studio \| pab), `file` | quantego.org instruction and model files |
| `Qutie: STL download` | `file` | qutie.org |
| `Qutie: shop click` | `host` | qutie.org footer |
| `RasQberry Two: image download` | `file`, `stream`, `tag` | rasqberry.org/latest redirect |
| `RasQberry Two: beta box click` | `target` (imager \| release-notes \| feedback \| ab-image \| learning-paths) | rasqberry.org homepage "New beta" box |
| `RasQberry Two: newsletter open` | — | rasqberry.org footer |
| `Entangible: runner start` · `runner finish` | `level` (+ `score` on finish) | entangible.org Runner |
| `Entangible: golf hole finished` · `golf round finished` | `qubits`, `score`, `course` / `course`, `scope` | entangible.org Golf |
| `racetraQ: mode change` · `track change` | `mode` (watch \| race \| evolution), `track` | racetraq.org (browser edition) — header tabs |
| `racetraQ: driver change` · `rival change` | `driver` (weights id), `qubits` / `rival` (none \| mlp \| pro) | browser edition — driver and rival chips |
| `racetraQ: race lap` | `track`, `lap_time` (s, 1 decimal), `clean` (yes \| no), `opponent` | a visitor's finished lap in Race mode |
| `racetraQ: composer open` | `qubits`, `track` | "Open this decision in IBM Quantum Composer" |
| `racetraQ: about open` | — | "What is this?" |
| `racetraQ: outbound click` | `host` | footer and About links |

v1 names (`family-footer`, `launch`, `download`, `outbound`, `game`, `newsletter`, doQumentation's
`Run Code` etc.) stop on the v2 rollout; boards read both until v1 data ages out.

racetraQ (formerly traQmania): only the browser edition (racetraq.org, GitHub Pages) is
instrumented — the Python demo app has no web tracker. Events are defined in `browser/src/analytics.ts`.
Not instrumented: qamposer.org (no Umami tag yet — co-owned).
cleanjibe.org (Jan's WingFoil project, not a family site) also reports into this property — the
Umami Hobby plan allows one website. Exclude hostname `cleanjibe.org` in family-wide reports.

## Reading it in Umami

Website dashboard → **Events** lists names grouped by site prefix; click one for its properties.
Reports: *Breakdown* (hostname × event × property), *Funnel* (portal page view → `Portal: family
footer click` → member page view — works across hostnames because all sites share one property),
*Journey*, *Goals*, *UTM*. Boards: Family overview · Family: events · Family: campaigns
(`utm_source=linkedin&utm_medium=social&utm_campaign=<slug>` on every shared link).
