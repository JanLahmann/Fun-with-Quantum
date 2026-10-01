# fun-with-quantum.org — the portal

Astro site for the Fun with Quantum family: three doors (Play · Build · Learn), the notebook games,
and the browser version of the Quantum Coin Game. Deployed to GitHub Pages by
`.github/workflows/deploy-portal.yml` on every push to `master`; `portal-ci.yml` runs tests, type
check and build on pull requests.

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # unit tests (vitest)
npm run check    # type check (astro check)
npm run build    # static site in dist/
```

## Where things live

| Path | What |
|---|---|
| `src/pages/` | home, `/play/`, `/build/`, `/learn/`, one page per notebook game (`play/[slug].astro`) |
| `src/content/games/*.md` | the notebook games (Binder/QuBins launch, `webGame: true` = also playable on the page) |
| `src/content/projects/*.md` | the family projects, shown by door and `order` (homepage door links use the same order) |
| `src/components/ProjectRow.astro` | the one row layout used on Play, Build and Learn |
| `src/data/family-manifest.ts` | reads `../family/family.json` for the family footer |

## The Quantum Coin Game in the browser

**Unlisted for now:** `/preview/coin-game/` (`src/pages/preview/coin-game.astro`) — linked from
nowhere, `noindex`. To launch: set `webGame: true` in `src/content/games/quantum-coin-game.md`
(the game page then shows it above the notebook, and the homepage and Play page link to it) and
delete the preview page.

The notebook's coin game, five chapters, no Binder:

1. **A fair game** — you vs. a classical computer, coin hidden in a box: 50:50. *Who starts?* is selectable in chapters 1–2: the starter is player A (first and last move).
2. **vs. a quantum computer** — same rules; the computer secretly plays H, you, H and always wins. If *you* start, it only gets the middle move — and its H is worth nothing (50:50): the trick needs a move before and after yours.
3. **Look inside** — the same round step by step, box off, with the circuit and the math.
4. **You be quantum** — you are A with I/X/H against a random classical B.
5. **Sandbox** — any of I, X, H, Z, S; measure once or 100 times.

**The coin is the qubit.** The coin's face normal is the Bloch vector: lying heads-up = |0⟩,
tails-up = |1⟩, standing on its edge = superposition (heads side out = |+⟩, tails side out = |−⟩).
Next to the coin a Bloch sphere (drawn from the textbook angle) shows the same vector as an arrow; while a gate plays, its rotation axis is dashed on the sphere and a line explains the turn ("H · half turn (180°) about the diagonal between x and z …"). Every gate is played out as the exact Bloch-sphere rotation it is (X = half turn about x, H = half
turn about the x+z diagonal, …), so what you see is what the maths says.

| File | |
|---|---|
| `src/lib/qcoin/qubit.ts` | one qubit, exactly: amplitudes, gates, Bloch vector, measurement |
| `src/lib/qcoin/game.ts` | the game rules and strategies (pure, deterministic with injected randomness) |
| `src/lib/qcoin/rotation.ts` | coin orientation ↔ Bloch sphere, CSS `matrix3d`, lift, shading |
| `src/lib/qcoin/ui.ts` | the chapters (each an async script) and the animated coin |
| `src/components/CoinGame.astro` | markup + styles: the CSS-3D coin (two faces + rim), the box, the panel |
| `public/coin/face-*.webp` | coin faces, cut from the RasQberry Kivy coin renders (`JanLahmann/RasQberry/Kivy/Images`) |
| `test/qcoin.test.ts` | the notebook's truth table, H…H as the only sure win, coin normal = Bloch vector |

Analytics events (`Portal: coin game …`) are listed in `../family/EVENTS.md`.
