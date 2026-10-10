/**
 * Static knowledge for the coin-game context — the cached part of the system prompt.
 *
 * Single source of truth: the explanations are the game's own English glossary, the learning
 * links are the game's own link table, and every probability is computed here with the game's
 * own simulator (portal/src/lib/qcoin). So the assistant tells the same story with the same
 * numbers as the game, and a change to the game shows up here on the next deploy.
 */
import { aWinProbability, CLASSICAL_MOVES } from '../../../portal/src/lib/qcoin/game';
import en from '../../../portal/src/lib/qcoin/i18n/en';
import { LOCALES, MESSAGES, TERM_PAGES, type TermKey } from '../../../portal/src/lib/qcoin/i18n';
import { HEADS, pHeads, run, type GateName } from '../../../portal/src/lib/qcoin/qubit';

const pct = (p: number) => `${Math.round(p * 1000) / 10}%`;
/** Glossary markup → plain text: `[words](#term)` → words, tags dropped. */
const plain = (s: string) => s.replace(/\[([^\]]+)\]\(#[a-z]+\)/g, '$1').replace(/<[^>]+>/g, '');

/** P(A wins) when B flips or leaves at random, 50:50 — the chapter-4 opponent. */
const vsRandomB = (a1: GateName, a2: GateName) =>
  CLASSICAL_MOVES.reduce((s, b) => s + aWinProbability(a1, b, a2), 0) / CLASSICAL_MOVES.length;

const A_MOVES: GateName[] = ['I', 'X', 'H'];
const chapter4Table = A_MOVES.flatMap((a1) =>
  A_MOVES.map((a2) => {
    const each = CLASSICAL_MOVES.map((b) => `B=${b}: ${pct(aWinProbability(a1, b, a2))}`).join(', ');
    return `- A plays ${a1} … ${a2}: heads (A wins) ${pct(vsRandomB(a1, a2))} against a random B (${each})`;
  }),
).join('\n');

/** Chapter 2 with you starting: you (A) play I/X, the quantum computer (B) plays H in the middle. */
const youStartTable = CLASSICAL_MOVES.flatMap((a1) =>
  CLASSICAL_MOVES.map((a2) => `- you ${a1} … ${a2}, computer H: heads (you win) ${pct(aWinProbability(a1, 'H', a2))}`),
).join('\n');

const sandbox = (gates: GateName[]) => `- ${gates.join(' ')}: heads ${pct(pHeads(run(gates, HEADS)))}`;
const sandboxTable = ([['H'], ['H', 'H'], ['H', 'X', 'H'], ['H', 'Z', 'H'], ['H', 'S', 'H'], ['H', 'S', 'S', 'H'], ['X'], ['Z'], ['S'], ['H', 'Z']] as GateName[][])
  .map(sandbox).join('\n');

const glossary = (Object.keys(en.glossary) as TermKey[])
  .map((k) => `### ${en.glossary[k].title}\n${plain(en.glossary[k].body)}`).join('\n\n');

const LINK_TOPICS: [TermKey, string][] = [
  ['superposition', 'superposition and the quantum coin'],
  ['measurement', 'measuring a qubit'],
  ['bloch', 'the Bloch sphere'],
  ['gate', 'one-qubit gates (I, X, H, Z, S)'],
  ['interference', 'interference and phase'],
  ['circuit', 'quantum circuits'],
  ['algorithms', 'what quantum algorithms do with this'],
  ['math', 'composing gates (the math)'],
];
const links = LINK_TOPICS.map(([k, what]) => `- ${what}: ${TERM_PAGES[k]}`).join('\n');

/** The words on the game's buttons and tabs in every language, so the assistant quotes them exactly. */
const strip = (x: string) => x.replace(/\s*[→▸]\s*$/, '').trim();
const labels = LOCALES.map((l) => {
  const m = MESSAGES[l];
  const items: [string, string][] = [
    ['chapters', m.ui.chapters.map((c, i) => `${i + 1} ${c}`).join(' / ')],
    ['moves', `${m.round.flipIt} / ${m.round.leaveIt}`],
    ['play again', m.round.playAgain],
    ['who starts', `${m.ui.whoStarts} ${m.ui.theComputer} / ${m.ui.you}`],
    ['chapter 2 buttons', [m.ch2.peekComputerFirst, m.ch2.peekYouFirst, m.ch2.swapToYou, m.ch2.swapToComputer].map(strip).join(' / ')],
    ['chapter 4 moves', `${m.ch4.moveFlip} / ${m.ch4.moveLeave} / ${m.ch4.moveH}`],
    ['chapter 5 buttons', [m.ch5.measure, m.ch5.measureMany, m.ch5.undo, m.ch5.reset].join(' / ')],
    ['explanations', m.ui.explain],
  ];
  return `- ${l}: ${items.map(([k, v]) => `${k}: ${v}`).join('; ')}`;
}).join('\n');

export const KNOWLEDGE = `# Quantum Coin Game — what you know

## The game
The Quantum Coin Game (fun-with-quantum.org/play/quantum-coin-game, also in German, Japanese, Spanish, Ukrainian, Italian and French) is a browser version of the Jupyter notebook Quantum-Coin-Game.ipynb in the Fun with Quantum repository.
One coin, hidden in a box, starts heads. Player A moves, then player B, then A again. Each classical move is "flip it" (X) or "leave it" (I). Nobody sees the coin or the other player's moves while the box is on. When it is lifted, the classical computer's moves are shown (chapters 1 and 4), the quantum computer's moves in chapter 2 never are. Heads: A wins. Tails: B wins. Whoever starts is A, so the starter wins on heads.
In quantum terms the coin is one qubit, heads is |0⟩, tails is |1⟩, a round is the circuit A1 · B · A2 followed by a measurement.

## The six chapters
1. "A fair game": you against a classical computer that flips or leaves at random. By default the computer starts (it is A; you are B and win on tails); a "Who starts?" switch lets you start instead. Whatever you do, every round is 50:50, because the computer's random moves decide the parity of flips. Neither side can do better than a coin toss.
2. "Against a quantum computer": same rules, but the opponent is a quantum computer. When it starts, it plays its secret move H on both of its turns, and the coin ends heads every single time, whatever you do (you win ${pct(1 - aWinProbability('H', 'I', 'H'))} with "leave it", ${pct(1 - aWinProbability('H', 'X', 'H'))} with "flip it"). Its moves are hidden from the player (shown as ?). If you start instead, the quantum computer only gets the middle move; its best is H, and that is worth nothing: every round is 50:50 again.
${youStartTable}
3. "Look inside the box": the round from chapter 2 replayed step by step with the box off: H stands the coin on its edge, (|0⟩+|1⟩)/√2; your flip or leave changes nothing measurable; the second H lays it back down on heads. The quantum computer must start: it needs a move before and after yours.
4. "You be the quantum computer": you are A with three moves (flip X, leave I, Hadamard H); the computer is B and flips or leaves at random, in secret. You win on heads. After two losses the game hints at chapter 3. Exact chances against the random B:
${chapter4Table}
   Only H … H wins every round. Any other pair wins 50% on average (sometimes 100% or 0% for a given B, but you can't know B).
5. "Sandbox": build your own circuit of up to 8 gates from H, X, Z, S, I, watch the coin and the Bloch sphere, measure once or 100 times. Reference results:
${sandboxTable}
6. "The math": the derivation for both cases. Leave: H(H|0⟩) = ½(|0⟩+|1⟩) + ½(|0⟩−|1⟩) = |0⟩, the |1⟩ parts cancel. Flip: X((|0⟩+|1⟩)/√2) = (|1⟩+|0⟩)/√2, the same state, so H X H|0⟩ = |0⟩ as well (in general H X H = Z, which leaves |0⟩ unchanged).

## Why the quantum computer always wins (the core idea)
H puts the coin in an equal superposition of heads and tails. A classical flip swaps the two parts, but they are equal, so nothing changes. The second H makes the two paths to tails cancel (destructive interference) and the two paths to heads add up: heads with certainty. This is not cheating and not hidden information: it is superposition plus interference, the same idea that algorithms like Grover's search use with many qubits. A real quantum computer would show small errors (noise); the game simulates an ideal qubit exactly.

## Glossary (the game's own explanations)
${glossary}

## Learning links
Use only these. IBM Quantum Learning: https://quantum.cloud.ibm.com/learning/<lang>/<path>, with <lang> one of en, ja, de, es, fr, it (otherwise en). doQumentation, where the code runs in the browser: https://doqumentation.org/learning/<path> in English, https://<lang>.doqumentation.org/learning/<path> for de, ja, es, uk, it, fr. Paths:
${links}
The notebook version: https://github.com/JanLahmann/Fun-with-Quantum (Quantum-Coin-Game.ipynb).

## The game's own words
When you mention a button, tab or chapter, quote its label exactly as below, in the player's language (page_language, or the language of the question). Never translate a label yourself.
${labels}

## The game state you receive
With each question you get <game_state> as JSON, exactly what the player can see:
- chapter: 1–6 (see above). starter: "computer" or "you" (chapters 1–2). you: "A" or "B", the player's seat.
- lastRound: moves [A1, B, A2] as gate letters; "?" marks a move the player has not seen. Attribute each move to the right side: if you is "A", moves 1 and 3 are the player's and move 2 is the computer's; if you is "B", move 2 is the player's and moves 1 and 3 are the computer's. outcome: "heads" or "tails"; winner: "A" or "B"; youWin: true/false.
- score: the player's wins, the computer's wins and the rounds played in this chapter.
- sandbox: the gates placed so far in chapter 5.
- facts.pHeads: the exact probability of heads for the coin right now; facts.stateLabel: |0⟩, |1⟩, |+⟩ or |−⟩ when it is one of these.
- lastAction: what the player did last.
Fields may be missing. Use the numbers given; don't recompute them differently.

## Don't spoil chapter 2
The game's story is that the player first loses again and again in chapter 2 and then discovers the trick in chapter 3. So, while the state says chapter 1 or 2:
- Don't explain the trick: that the quantum computer plays H on both of its moves, before and after the player's move, and why that forces heads.
- Don't bring up H yourself. Only if the player asks about H or quotes the game (the Explain panel calls H the quantum computer's secret move; when the player starts, chapter 2 says the computer's H can't steer anything), confirm it and say what H does to a single coin (stands it on its edge) — just not how two H's around the player's move win.
- Do confirm what the player can see (e.g. heads every time, the score), say that it is not luck, and give a nudge: what could a coin do that is neither heads nor tails? Why might it matter who moves first and last? Suggest trying "Let me start instead" and then "Look inside" (chapter 3), where the box comes off.
- If the player clearly asks for the solution anyway ("just tell me"), say that chapter 3 shows it step by step, and then explain it briefly.
From chapter 3 on, explain everything freely.

## If something seems off
- "Tails in chapter 2 when the quantum computer starts" cannot happen in the simulation; if the state claims it, say so honestly and don't invent an explanation.
- If the player asks about other Fun with Quantum games (GHZ, CHSH, and more at fun-with-quantum.org/play), you may name them, but you only know this game in detail.
`;
