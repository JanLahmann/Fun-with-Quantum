# Fun with Quantum — family manifest

**One file, every site.** `family.json` is the single roster of the Fun with Quantum family:
brand line, taglines, and one entry per member (name, URL, `short` — a 3–5 word footer
description —, repo, door, one-line `tagline` for README tables and About pages, and a `footer`
flag that decides whether it appears in the family footer). This folder is its permanent
home; every member site and README renders from it.

Raw URL for consumers outside this repo:
`https://raw.githubusercontent.com/JanLahmann/Fun-with-Quantum/master/family/family.json`

## How it flows

```
family/family.json ──► build-time renderers ──► every member site + README
                        ├─ Astro component      (portal reads the file directly; Qutie fetches)   portal/src/components/FamilyFooter.astro
                        ├─ Docusaurus footer    (doQumentation, CertiQ)   themeConfig.footer.links from JSON
                        ├─ html block          (Quantego, Qoffee, QuBins — Jekyll/static)   render/render-block.mjs --format=html
                        ├─ Next.js component    (RasQberry Two)
                        └─ Markdown block       (every README, incl. traQmania)          render/render-block.mjs
```

* **The portal** reads the file from disk at build time — it can never lag behind.
* **Other sites** fetch the raw URL at build time, with a vendored fallback copy so a GitHub
  hiccup never breaks a build. When the manifest changes on `master`,
  `.github/workflows/family-dispatch.yml` fires `repository_dispatch: family-updated` at every
  member repo listed in the manifest → each rebuilds its Pages. A weekly cron run is the backstop.
* **Everything that can't fetch at build time** — READMEs, Jekyll sites, plain HTML pages — carries the
  block between `<!-- FWQ-FAMILY:START format=… -->` / `<!-- FWQ-FAMILY:END -->` markers. The
  `family-sync` job in the same workflow re-renders every marker file in every member repo (the markers
  are the opt-in), refreshes any vendored copy named `fwq-family.json`, and opens a PR
  (`fwq-family-sync-<branch>`) when something changed. Members whose site lives on another branch
  list it in `sync_branches` (Qoffee-Maker: `website`).

Both jobs need one secret in this repo: `FWQ_FAMILY_TOKEN`, a personal access token with
*Contents: read & write* and *Pull requests: read & write* on the member repos. A fine-grained PAT
owned by JanLahmann covers his repos; the org-owned ones (QuBins/qiskit-images, QAMP-62/…) need
the token approved for those orgs or a classic token with `repo` scope. Without the secret both
jobs log a notice and do nothing, so the workflow is safe to merge first.

Token lifecycle: the weekly run's `token-check` job reads the expiry GitHub reports for the token and
opens an issue in this repo (label `fwq-family-token`) when fewer than 30 days remain, or at once if
the token stops working. Rotating = new classic PAT (repo scope) → update the secret → run the workflow
once by hand.

## Analytics events

The html renderer and the site components tag every family-footer link with
`data-umami-event="family-footer" data-umami-event-to="<member id>"`. The family-wide event vocabulary
(launch, game, download, outbound, newsletter) is in [EVENTS.md](EVENTS.md).

## Renderers

```sh
node family/render/render-block.mjs family/family.json fun-with-quantum README.md               # list (default)
node family/render/render-block.mjs family/family.json qutie README.md --format=table          # Project | What it is
node family/render/render-block.mjs family/family.json quantego index.html --format=html       # <footer class="family-footer">
```

`<self-id>` is the member's `id` in the manifest; a member never lists itself. The format is remembered
in the START marker, so re-renders keep whatever a file chose. `family-footer.css` has reference styles
for the html block (name + `short` line per member, responsive grid) — copy and adapt per site theme.

Sites that fetch the manifest at build time should cache-bust the raw URL (append `?t=<timestamp>`):
raw.githubusercontent.com is CDN-cached for about five minutes.

## Editing rules

* Add a member: one object in `members`. Order in the array = order in every footer.
* Hide/show in footers: flip `footer`. Members currently hidden and why are in their `note`.
* Bump `updated` when you change the roster (it shows up in build logs downstream).
* Never edit a rendered footer or README block by hand — it will be overwritten on the next sync.
