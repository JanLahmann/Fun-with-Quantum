# Fun with Quantum — Umami event taxonomy

All family sites report to one Umami Cloud property (`97f347ac…`, per-site `data-domains`). Page views
come for free; the events below are the shared vocabulary so one report covers the whole family.
Names are kebab-case; properties are the breakdown dimensions in Umami's event-data view.

Most events need **no JavaScript**: Umami's tracker records a click on any element that carries
`data-umami-event="<name>"`, and every `data-umami-event-<prop>="<value>"` becomes a property.

| Event | Properties | Where | Answers |
|---|---|---|---|
| `family-footer` | `to` (member id) | every family footer — emitted by the renderers, so all sites get it from the manifest | Does the footer create cross-traffic, to whom? |
| `launch` | `target` (qubins \| binder \| colab), `image`, `notebook`, `ui` | portal game pages, QuBins (`launch-redirect` is its predecessor), doQumentation, traQmania | Which notebooks get run, on which image? |
| `game` | `name`, `step` (start \| finish \| share) | portal games, traQmania, Entangible runner/golf | Do people finish what they start? |
| `download` | `kind` (stl \| pdf \| image \| zip), `file` | Qutie STL, Quantego instructions, RasQberry images, Entangible kits | What gets printed and built? |
| `outbound` | `host`, `category` (ibm \| github \| shop \| social \| other) | all sites (doQumentation has a JS tracker; elsewhere attributes on the few links that matter) | Where do we send people? |
| `newsletter` | `step` (open \| subscribed) | rasqberry.org | Does the footer newsletter line convert? |

## Rollout status

| Event | Live | Pending |
|---|---|---|
| `family-footer` | all 11 sites (renderers + components) | — |
| `launch` | portal game pages; QuBins launch page (renamed from `launch-redirect`) | doQumentation (PR: Binder/Colab → `launch`) |
| `download` | Qutie STL button; Quantego instructions/Studio/LDraw/PAB files | rasqberry.org image redirect (PR); doQumentation notebook download (PR) |
| `game` | — | Entangible Runner start/finish + Golf finishes (PR) |
| `outbound` | portal + Qutie shop link | doQumentation (PR: `Outbound` → `outbound`, drops the duplicate `Outbound IBM`) |
| `newsletter` | rasqberry.org footer link (`open`) | `subscribed` on the form |

Not instrumented: traQmania (Python app, no web tracker) and qamposer.org (no Umami tag yet — co-owned).

## Reading it in Umami

Website dashboard → filter **Hostname** for one member → **Events** panel lists names; click one for its
properties. Reports: *Breakdown* (hostname × event × property), *Funnel* (portal page view → family-footer →
member page view — works across hostnames because all sites share one property), *Journey*, *Goals*, *UTM*.
Boards to keep: Family overview · Cross-traffic · Engagement · Campaigns
(`utm_source=linkedin&utm_medium=social&utm_campaign=<slug>` on every shared link).
