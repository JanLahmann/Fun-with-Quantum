# Fun with Quantum — family manifest (staging)

**One file, every site.** `family.json` is the single roster of the Fun with Quantum family:
brand line, taglines, and one entry per member (name, URL, repo, door, one-line tagline, and a
`footer` flag that decides whether it appears in the family footer).

This folder is the *staging* home. Its permanent home is the `JanLahmann/fwq-family` repo; once
that exists, this folder moves there unchanged and the consumers below point at
`https://raw.githubusercontent.com/JanLahmann/fwq-family/main/family.json`.

## How it flows

```
family.json ──► build-time renderers ──► every member site + README
                 ├─ Astro component      (portal, Qutie)           portal/src/components/FamilyFooter.astro
                 ├─ Docusaurus footer    (doQumentation, CertiQ)   themeConfig.footer.links from JSON
                 ├─ static HTML snippet  (Quantego, Qoffee, QuBins, Entangible)   render/html-snippet.mjs
                 ├─ Next.js component    (RasQberry Two)
                 └─ Markdown block       (every README, incl. traQmania)          render/readme-block.mjs
```

* **Sites** fetch the manifest at build time (with a vendored fallback copy so a GitHub outage
  never breaks a build) and render the footer from it. When the manifest changes, a workflow in
  `fwq-family` fires `repository_dispatch: family-updated` at every member repo → each rebuilds.
* **READMEs** can't run code, so the same workflow re-renders the block between
  `<!-- FWQ-FAMILY:START -->` / `<!-- FWQ-FAMILY:END -->` and opens a PR per repo.
* A weekly cron re-sync is the backstop for anything that missed a dispatch.

## Renderers

```sh
node family/render/readme-block.mjs family/family.json fun-with-quantum README.md
node family/render/html-snippet.mjs family/family.json quantego > family-footer.html
```

`<self-id>` is the member's `id` in the manifest; a member never lists itself.

## Editing rules

* Add a member: one object in `members`. Order in the array = order in every footer.
* Hide/show in footers: flip `footer`. Members currently hidden and why are in their `note`.
* Never edit a rendered footer or README block by hand — it will be overwritten on the next sync.
