# fun-with-quantum.org — the portal

Astro site for the Fun with Quantum family: three doors (Play · Build · Learn), the notebook games,
and browser versions of seven of them: the Quantum Coin Game, the GHZ game, the CHSH game, Hardy's paradox, the magic square, the quantum prisoner's dilemma and 3-SAT with Grover. Deployed to GitHub Pages by
`.github/workflows/deploy-portal.yml` on every push to `master`, which also attaches the build as `fwq-portal-<commit>.tar.gz` (+ `.sha256`)
to the `portal-bundles` release, for offline use on RasQberry Two; `portal-ci.yml` runs tests, type
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
| `src/pages/` | home, `/play/`, `/build/`, `/learn/`, `/workshops/`, one page per notebook game (`play/[slug].astro`) |
| `src/content/games/*.md` | the notebook games (Binder/QuBins launch, `webGame: true` = also playable on the page) |
| `src/content/projects/*.md` | the family projects, shown by door and `order` (homepage door links use the same order) |
| `src/components/ProjectRow.astro` | the one row layout used on Play, Build and Learn |
| `src/data/family-manifest.ts` | reads `../family/family.json` for the family footer |
| `src/data/highlights.ts` | family news for the homepage highlight box (`src/components/Highlights.astro`); empty list = no box |
| `astro.config.mjs` | site config + a small build hook that writes `dist/sitemap.xml`: every page except 404, redirects and `noindex` pages (the previews join once launched) |
| `public/robots.txt` | allows everything, points to the sitemap (previews stay crawlable so search engines see their `noindex`) |

## The Quantum Coin Game in the browser

**Public since 2026-10:** `webGame: true` in `src/content/games/quantum-coin-game.md`, so
`/play/quantum-coin-game/` shows the game above the notebook (`src/pages/play/[slug].astro`, with a
language switcher and hreflang), and the homepage card and the Play page link to it. The other six
languages live at `/de/`, `/ja/`, `/es/`, `/uk/`, `/it/`, `/fr/play/quantum-coin-game/`
(`src/pages/[lang]/play/quantum-coin-game.astro` via `src/components/CoinGamePage.astro`). The old
`/…/preview/coin-game/` URLs redirect (`astro.config.mjs`).

The notebook's coin game, six chapters, no Binder:

1. **A fair game** — you vs. a classical computer, coin hidden in a box: 50:50. *Who starts?* is selectable in chapters 1–2: the starter is player A (first and last move).
2. **vs. a quantum computer** — same rules; the computer secretly plays H, you, H and always wins. If *you* start, it only gets the middle move — and its H is worth nothing (50:50): the trick needs a move before and after yours.
3. **Look inside** — the same round step by step, box off, with the circuit and the math.
4. **You be quantum** — you are A with I/X/H against a random classical B.
5. **Sandbox** — any of I, X, H, Z, S; measure once or 100 times.
6. **The math** — the notebook's derivation: the general state α|0⟩ + β|1⟩, the gates on |0⟩ and |1⟩, and why H, I, H and H, X, H both end on |0⟩ (destructive interference of |1⟩); each case is played on the coin.

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
| `src/lib/qcoin/i18n/` | the message catalogue: `types.ts` (the `Messages` type + translator conventions), `en.ts`, `de/ja/es/uk/it/fr.ts`, `index.ts` (locales, glossary links) |
| `test/i18n.test.ts` | every locale complete, same `[words](#term)` links, tags, kets and values as English |

### Translations and explanations

All game text lives in `src/lib/qcoin/i18n/<locale>.ts`, typed by `Messages`, so a missing entry is
a type error. In any string, `[words](#term)` becomes a button that opens the explanation of a
glossary term (15 terms: qubit, superposition, measurement, Bloch sphere, gates, H/X/Z/S/I,
interference, phase, circuit, what it's good for); **ⓘ Explain** lists them all. Every
explanation links to IBM Quantum Learning in the player's language where IBM has it (ja, de, es,
fr, it; else English) and to the same page on doQumentation in that language — paths and anchors
in `TERM_PAGES` (`i18n/index.ts`). To add a language: copy `en.ts`, translate (keep tags, kets,
`#term` anchors), add it to `LOCALES` and `MESSAGES`; `npm test` checks it.

Analytics events (`Portal: coin game …`) are listed in `../family/EVENTS.md`.

## The GHZ game, the CHSH game, Hardy's paradox, the magic square, the prisoner's dilemma and 3-SAT in the browser

**Unlisted for now** (English only): `/preview/ghz-game/`, `/preview/chsh-game/`, `/preview/hardys-paradox/`, `/preview/magic-square/`, `/preview/prisoners-dilemma/` and
`/preview/3sat-grover/` — `noindex`, linked only from each other ("Quantum games, right in your browser",
`src/components/BrowserGames.astro`, which also links the public coin game). Same rules,
same circuits as `GHZ-Game.ipynb`, `CHSH-Game.ipynb`, `Hardys-Paradox.ipynb`, `Mermin-Peres-Game.ipynb`, `Prisoners-Dilemma.ipynb` and `3sat.ipynb`.

| Path | What |
|---|---|
| `src/lib/qsim.ts` | exact state-vector simulator for a few qubits (H, X, Y, Z, S, S†, Ry, Rz, CX, CZ, CRy, RYY, SWAP; Qiskit bit order) |
| `src/lib/ghz/`, `src/lib/chsh/`, `src/lib/hardy/`, `src/lib/magic/`, `src/lib/pd/`, `src/lib/sat/` | game logic (`game.ts`, `square.ts`, `logic.ts`), texts (`messages.ts`), browser side (`ui.ts`) |
| `src/lib/games/` | shared: chapters and buttons (`shell.ts`), circuit drawing (`circuit.ts`), explanations on demand (`glossary.ts`) |
| `src/components/GameFrame.astro` | the frame these games use: chapter tabs, stage, story panel, explanation dialog |
| `test/trio.test.ts` | the simulator, GHZ and magic square (quantum team always wins, classical best 3/4 and 8/9), explanation links |
| `test/sat.test.ts`, `test/fixtures/grover_qiskit.*` | formulas, the two puzzles, and Grover checked against Qiskit (`PhaseOracleGate` + `grover_operator`, as in the notebook) for 9 formulas × 0–4 rounds; regenerate the JSON with the `.py` next to it |
| `test/chsh.test.ts`, `test/fixtures/chsh_qiskit.*` | 16 classical tables (best 3 of 4), the simulator against Qiskit for 14 angle pairs, cos²(Δ/2), win = 1/2 + S/8, S ≤ 2√2, no signaling |
| `test/hardy.test.ts`, `test/fixtures/hardy_qiskit.*` | 16 spec-sheet pairs (5 keep the facts, none both diesel), the simulator against Qiskit (amplitudes, 7 angles × 4 checks), facts exact at every angle, 1/12, u²(1 − u)/(1 + u), the 9.02% maximum |
| `test/pd.test.ts`, `test/fixtures/pd_qiskit.*` | the simulator against Qiskit and the EWL matrices (64 move pairs), the C/D/Q table, (Q, Q) the only equilibrium on a grid, counters worth 5, the 2.25 mix |

1. **GHZ game** — *Team classical* (pick an object per player, ask all four questions; why never 4 of 4) ·
   *Team quantum* (GHZ state, X for colour, Y for shape; 1000 rounds) · *How it works* (the GHZ state,
   exact answer statistics per question, why the proof fails, what it means).
2. **Magic square** (Bravyi et al. convention: Alice gets a column, odd; Bob a row, even) — *Find a magic
   square* (clickable, with the parity proof) · *The best classical team* (8 of 9, all 4096 strategies) ·
   *The quantum team* (two Bell pairs, the circuits of the notebook) · *How it works* (the square of
   measurements, commuting, Bell pairs in every basis, measuring X⊗Z by a basis change).
3. **CHSH game** — *Play classically* (click a table of answers; all 16 tables; why never 4 of 4) ·
   *The quantum team* (a Bell pair measured along arrows on the Bloch circle: Alice 0°/90°, Bob ±45°; about
   85% of the rounds, not all) · *Turn the angles* (sliders, exact win rate per question, 1000 sampled rounds) ·
   *Why 85% is the limit* (P(same) = cos²(Δ/2), S ≤ 2 classically, S ≤ 2√2 = Tsirelson, no signaling, PR box).
4. **Hardy's paradox** — *The car factory* (write spec sheets for two cars; all 16 pairs: 5 keep the three facts, none
   gives two diesels; the 3-line proof) · *Quantum cars* (the factory state (|red,blue⟩ + |blue,red⟩ + |blue,blue⟩)/√3; facts hold,
   both diesel 1/12) · *What went wrong?* (the state, the counterfactual step, no spec sheets, Hardy 1992/1993) · *Find the 9%*
   (engine arrow φ; P = u²(1 − u)/(1 + u), u = cos²(φ/2); maximum (5√5 − 11)/2 at φ ≈ 76.35°).
5. **Quantum prisoner's dilemma** (Eisert, Wilkens, Lewenstein 1999) — *The dilemma* (C or D against a random Bob;
   defecting dominates) · *Quantum moves* (J = RYY(π/2), your U(θ, φ), Bob's C/D/Q, J†; the C/D/Q table) · *Why Q wins*
   (payoff map; (Q, Q) the only equilibrium of the two-angle moves) · *The catch* (Benjamin & Hayden 2001: all one-qubit
   moves — iσx counters Q, every move has a counter, random moves give 2.25 each; link to the coin game).
6. **3-SAT with Grover** — *The party puzzle* (click a guest list; check all 16) · *Grover's search*
   (amplitudes step by step on a ±1 scale, each solution's chance on its bar: H, oracle, diffuser, measure; overshoot after round 2; the notebook's 7-line program in a code box) · *A classic 3-SAT*
   (the notebook's DIMACS problem: 3 of 8, one round = 84.4%) · *Your own puzzle* (any formula with &, |,
   ~ and up to 6 variables; rounds to the first peak, 0 when half or more are solutions) · *How it
   works* (interference, sin²((2k+1)θ), scaling, limits).

Explanations link to IBM Quantum Learning and doQumentation like the coin game's. To translate, add
per-language copies of `messages.ts` and `GLOSSARY_EN` as for `src/lib/qcoin/i18n`. To launch: add the
web game to its `/play/` page (as `play/[slug].astro` does for the coin game with `webGame: true`; the
magic square's, CHSH's, Hardy's, the prisoner's dilemma's and 3-SAT's game entries are still in `content-drafts/`), point `BrowserGames.astro` at the `/play/` pages,
and delete the preview pages.
