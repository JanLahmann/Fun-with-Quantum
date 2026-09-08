# Fun with Quantum — family manifest

**One file, every site.** `family.json` is the single roster of the Fun with Quantum family:
brand line, taglines, and one entry per member (name, URL, repo, door, one-line tagline, and a
`footer` flag that decides whether it appears in the family footer). This folder is its permanent
home; every member site and README renders from it.

Raw URL for consumers outside this repo:
`https://raw.githubusercontent.com/JanLahmann/Fun-with-Quantum/master/family/family.json`

## How it flows

```
family/family.json ──► build-time renderers ──► every member site + README
                        ├─ Astro component      (portal reads the file directly; Qutie fetches)   portal/src/components/FamilyFooter.astro
                        ├─ Docusaurus footer    (doQumentation, CertiQ)   themeConfig.footer.links from JSON
                        ├─ static HTML snippet  (Quantego, Qoffee, QuBins, Entangible)   render/html-snippet.mjs
                        ├─ Next.js component    (RasQberry Two)
                        └─ Markdown block       (every README, incl. traQmania)          render/readme-block.mjs
```

* **The portal** reads the file from disk at build time — it can never lag behind.
* **Other sites** fetch the raw URL at build time, with a vendored fallback copy so a GitHub
  hiccup never breaks a build. When the manifest changes on `master`,
  `.github/workflows/family-dispatch.yml` fires `repository_dispatch: family-updated` at every
  member repo listed in the manifest → each rebuilds its Pages. A weekly cron run is the backstop.
* **READMEs** can't run code, so the same workflow will re-render the block between
  `<!-- FWQ-FAMILY:START -->` / `<!-- FWQ-FAMILY:END -->` and open a PR per repo (added with the
  member rollout).

The dispatch needs one secret in this repo: `FWQ_FAMILY_TOKEN`, a fine-grained PAT with
*Contents: read & write* on the member repos (that is the permission GitHub requires for
`repository_dispatch`). Without the secret the workflow logs a notice and does nothing.

## Renderers

```sh
node family/render/readme-block.mjs family/family.json fun-with-quantum README.md
node family/render/html-snippet.mjs family/family.json quantego > family-footer.html
```

`<self-id>` is the member's `id` in the manifest; a member never lists itself.

## Editing rules

* Add a member: one object in `members`. Order in the array = order in every footer.
* Hide/show in footers: flip `footer`. Members currently hidden and why are in their `note`.
* Bump `updated` when you change the roster (it shows up in build logs downstream).
* Never edit a rendered footer or README block by hand — it will be overwritten on the next sync.
