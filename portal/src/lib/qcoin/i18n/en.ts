import type { Messages } from './types';

const en: Messages = {
  lang: 'en',
  langName: 'English',

  page: {
    title: 'Quantum Coin Game — preview | Fun with Quantum',
    description: 'Play the Quantum Coin Game in your browser: beat a quantum computer at coin flipping — and find out why you never had a chance.',
    kicker: 'Play · Superposition & interference · preview',
    heading: 'Quantum Coin Game',
    lead: 'Beat a quantum computer at coin flipping — and find out why you never had a chance.',
    notebook: 'The same game as a Jupyter notebook, in real Qiskit code:',
    notebookLink: 'open the notebook ↗',
    notebookWait: 'It starts a free Jupyter session on mybinder.org (via QuBins); starting it can take a few minutes.',
    preview: 'Preview',
  },

  ui: {
    chapters: ['A fair game', 'vs. a quantum computer', 'Look inside', 'You be quantum', 'Sandbox', 'The math'],
    chaptersLabel: 'Chapters',
    heads: 'Heads',
    tails: 'Tails',
    probsLabel: 'Measurement probabilities',
    coinInBox: 'the coin is in here',
    hiddenInBox: 'hidden in the box',
    whoStarts: 'Who starts?',
    theComputer: 'The computer',
    you: 'You',
    blochCaption: 'Bloch sphere',
    explain: 'Explain',
    explainTitle: 'Explanations',
    allTerms: '← all terms',
    close: 'Close',
    learnMoreIbm: 'Learn more on IBM Quantum Learning ↗',
    learnMoreDoq: 'Run it in doQumentation ↗',
    noscript: 'The browser version needs JavaScript — the notebook works without it.',
    circuitLabel: 'The circuit so far',
    coin: 'coin',
    look: 'look',
    whoYou: 'you',
    whoComputer: 'computer',
    score: (you, computer, rounds) => `Score — you: ${you} · computer: ${computer} · rounds: ${rounds}`,
  },

  states: {
    zero: '|0⟩ · heads, lying flat',
    one: '|1⟩ · tails, lying flat',
    plus: '|+⟩ = (|0⟩+|1⟩)/√2 · on its edge, heads side out',
    minus: '|−⟩ = (|0⟩−|1⟩)/√2 · on its edge, tails side out',
    other: (x, y, z) => `on its edge, turned · Bloch (${x}, ${y}, ${z})`,
  },

  gates: {
    name: { I: 'leave it', X: 'flip it', H: 'Hadamard', Z: 'phase flip', S: 'quarter phase' },
    fx: {
      I: '[<b>I</b>](#igate) · no rotation — the arrow stays where it is.',
      X: '[<b>X</b>](#xgate) · half turn (180°) about the <b>x axis</b> (through |+⟩ and |−⟩): heads ↔ tails, while |+⟩ and |−⟩ stay put.',
      H: '[<b>H</b>](#hadamard) · half turn (180°) about the <b>diagonal between x and z</b>: |0⟩ ↔ |+⟩ and |1⟩ ↔ |−⟩ — flat ↔ on its edge.',
      Z: '[<b>Z</b>](#zgate) · half turn (180°) about the <b>z axis</b> (through |0⟩ and |1⟩): |+⟩ ↔ |−⟩, while heads and tails stay put.',
      S: '[<b>S</b>](#sgate) · quarter turn (90°) about the <b>z axis</b>: |+⟩ → |+i⟩ — still 50:50, even after an H. Two S make a Z: |+⟩ → |−⟩.',
    },
  },

  round: {
    startsHeads: 'The coin starts <strong>heads</strong>. Into the box it goes…',
    intoBox: 'Into the box — now the computer moves in secret.',
    lifting: 'Lifting the box!',
    onEdge: 'The coin is on its edge — heads <em>and</em> tails. [Looking](#measurement) forces a choice…',
    flipIt: 'Flip it',
    leaveIt: 'Leave it',
    yourMoveB: 'Your move. Turn the coin over, or leave it as it is?',
    youStartA: 'You start. Turn the coin over, or leave it?',
    yourLastA: 'Your last move — still blind. Flip it, or leave it?',
    computerFirst: 'The computer makes its first move — you can’t see it.',
    computerLast: 'The computer makes its final move…',
    computerMiddle: 'The computer makes its move — you can’t see it.',
    playAgain: 'Play again',
  },

  ch1: {
    title: '1 · A fair game',
    rulesComputerFirst: 'The computer moves, then you, then the computer again.',
    rulesYouFirst: 'You move, then the computer, then you again.',
    winComputerFirst: '<strong>Tails: you win. Heads: the computer wins.</strong>',
    winYouFirst: '<strong>Heads: you win. Tails: the computer wins.</strong> (Whoever starts wins on heads.)',
    intro: (rules, win) => `<p>You and the computer share one coin, hidden in a box. It starts <strong>heads</strong>. ${rules} Each move is <em>flip it</em> or <em>leave it</em>, and nobody sees the other's moves.</p>
      <p>${win} Can either side do better than a coin toss?</p>`,
    youWin: (side) => `<strong>${side} — you win!</strong> The computer was guessing too.`,
    computerWins: (side) => `<strong>${side} — the computer wins.</strong> It had no secret, just luck.`,
    next: 'Now play a quantum computer →',
  },

  ch2: {
    title: '2 · Against a quantum computer',
    introComputerFirst: (rules, win) => `<p>Same box, same coin, same rules: ${rules} ${win} Only your opponent has changed — it now runs on a <strong>quantum computer</strong>.</p>
      <p>Play a few rounds. Try everything.</p>`,
    introYouFirst: (win) => `<p>This time <strong>you start</strong>, so you get the first and the last move; the <strong>quantum computer</strong> only gets the move in the middle. ${win}</p>
      <p>Does quantum power still help it?</p>`,
    lossLines: [
      'Heads. The quantum computer wins.',
      'Heads again. Bad luck?',
      'Heads. Three in a row — that’s not luck any more.',
      'Heads. Every. Single. Time.',
      'Heads. It doesn’t matter what you do, does it?',
    ],
    impossible: 'Tails?! (This should be impossible — tell us how you did it.)',
    youStartWin: '<strong>Heads — you win!</strong> With only the middle move, the quantum computer’s H can’t steer anything.',
    youStartLoss: (side) => `<strong>${side} — the computer wins this one.</strong> Pure luck: from the middle, quantum power is worth nothing.`,
    peekComputerFirst: 'How does it do that? Look inside →',
    peekYouFirst: 'Why? Look inside →',
    swapToYou: 'Let me start instead',
    swapToComputer: 'Let the computer start',
  },

  ch3: {
    title: '3 · Look inside the box',
    intro: `<p>Here is the round again — box off, one step at a time. The quantum computer's secret is one move a normal coin doesn't have: the [Hadamard gate, H](#hadamard) — played <em>before and after</em> your move. That's why it must start: with only the middle move (try “Let me start instead” in chapter 2), H gives no edge at all.</p>`,
    start: 'Start: the coin lies <strong>heads</strong> up. In quantum terms: [|0⟩](#ket), all chances on heads.',
    nextComputer: 'Next: the computer’s move ▸',
    afterH: '<strong>H stands the coin on its edge.</strong> It is now heads <em>and</em> tails at once — a [superposition](#superposition), 50:50 if you looked now.',
    mathH: '|0⟩ → H → (|0⟩ + |1⟩)/√2',
    nextFlip: 'Next: you flip it ▸',
    nextLeave: 'Next: you leave it ▸',
    afterFlip: '<strong>You flipped it — and nothing changed.</strong> Turning over a coin that is heads and tails at once just swaps the two: it is still heads-and-tails.',
    afterLeave: '<strong>You left it.</strong> Still standing on its edge: heads and tails at once.',
    mathFlip: 'X: (|0⟩ + |1⟩)/√2 → (|1⟩ + |0⟩)/√2 — the same state',
    mathLeave: 'I: (|0⟩ + |1⟩)/√2 stays (|0⟩ + |1⟩)/√2',
    nextComputer2: 'Next: the computer’s second move ▸',
    afterH2: '<strong>The second H lays it back down — heads, with certainty.</strong> The two ways of ending up tails cancel each other out; the two ways to heads add up. That is [interference](#interference).',
    mathH2: 'H: (|0⟩ + |1⟩)/√2 → ½(|0⟩+|1⟩) + ½(|0⟩−|1⟩) = |0⟩',
    tryLeave: 'Try it with “leave it”',
    tryFlip: 'Try it with “flip it”',
    next: 'Now you be the quantum computer →',
  },

  ch4: {
    title: '4 · You be the quantum computer',
    intro: `<p>Swap seats: <strong>you are A</strong> now, with three moves — <em>flip</em> ([X](#xgate)), <em>leave</em> ([I](#igate)) and the quantum [<strong>H</strong>](#hadamard). The computer plays B, flipping or not at random, in secret.</p>
      <p>Heads wins for you. Can you win every round?</p>`,
    moveFlip: 'Flip',
    moveLeave: 'Leave',
    moveH: 'Hadamard',
    first: 'Your first move — you can watch this one.',
    firstHint: 'Your first move. (Hint: what made the coin stand on its edge in chapter 3?)',
    intoBox: 'Into the box — now the computer moves in secret.',
    last: 'Your last move — blind, the coin stays in the box.',
    sureWin: '<strong>Heads — and it always will be.</strong> H, anything, H: you just became the quantum computer.',
    luckyWin: (flipped) => `<strong>Heads — you win!</strong> But was that skill or luck? The computer ${flipped ? 'flipped the coin' : 'left the coin alone'}.`,
    loss: (flipped) => `<strong>Tails — the computer wins.</strong> It ${flipped ? 'flipped the coin' : 'left the coin alone'}.`,
    next: 'Open the sandbox →',
  },

  ch5: {
    title: '5 · Sandbox',
    intro: `<p>Your coin, your [gates](#gate). Add moves and watch the coin: lying flat is heads or tails, standing on its edge is a [superposition](#superposition). [<strong>Z</strong>](#zgate) and [<strong>S</strong>](#sgate) turn a standing coin around — a measurement can’t see that. An H can: H, Z, H ends on tails. A single S is subtler: H, S, H stays 50:50 — try H, S, S, H.</p>`,
    addGate: 'Add a gate.',
    measure: 'Look (measure)',
    measureMany: 'Measure 100×',
    undo: 'Undo',
    reset: 'Reset',
    notebook: 'The real Qiskit notebook ↗',
    backToHeads: 'Back to heads.',
    undone: 'Undone.',
    many: (h, t, eh, et) => `100 measurements: ${h}× heads, ${t}× tails (expected ${eh} : ${et})`,
    measured: (side) => `<strong>${side}.</strong> Looking collapsed the coin — add more gates, or reset.`,
    played: (g, name) => `${g}: ${name}.`,
  },

  ch6: {
    title: '6 · The math',
    intro: '<p>Any state of a qubit is α|0⟩ + β|1⟩, with two complex numbers α and β — the amplitudes — and |α|² + |β|² = 1. Measuring gives heads (|0⟩) with chance |α|² and tails (|1⟩) with chance |β|².</p><p>A gate is fixed by what it does to |0⟩ and |1⟩; on a superposition it acts on each part separately:</p><p class="math">X: |0⟩ → |1⟩ and |1⟩ → |0⟩<br>H: |0⟩ → (|0⟩ + |1⟩)/√2 and |1⟩ → (|0⟩ − |1⟩)/√2</p>',
    caseLeave: '<p>If you leave the coin (I), the computer’s two H gates give</p><p class="math">H(H|0⟩) = H((|0⟩ + |1⟩)/√2)<br>= (H|0⟩ + H|1⟩)/√2<br>= ½(|0⟩ + |1⟩) + ½(|0⟩ − |1⟩)<br>= |0⟩</p><p>The two |1⟩ parts cancel — destructive [interference](#interference) — while the two |0⟩ parts add up.</p>',
    caseFlip: '<p>If you flip it (X), nothing changes: X swaps the two parts of (|0⟩ + |1⟩)/√2, and they are equal.</p><p class="math">X((|0⟩ + |1⟩)/√2) = (|1⟩ + |0⟩)/√2 = H|0⟩<br>so H(X(H|0⟩)) = H(H|0⟩) = |0⟩</p>',
    conclusion: '<p>Either way the coin ends on heads, with certainty — the quantum computer wins every round.</p>',
    leave: 'Case 1: you leave it (I)',
    flip: 'Case 2: you flip it (X)',
    pick: 'Pick a case: watch the coin and follow the math.',
    done: 'The coin ends on heads — with certainty.',
  },

  glossary: {
    qubit: {
      title: 'Qubit — the quantum coin',
      body: 'A qubit is the quantum version of a bit — in this game, the coin. A bit is 0 or 1; a qubit can also be in a [superposition](#superposition) of both. Its state is an arrow on the [Bloch sphere](#bloch) — here, the direction the coin’s face points.',
    },
    superposition: {
      title: 'Superposition',
      body: 'A coin standing on its edge is neither heads nor tails — it is both at once, in a definite mix. (|0⟩ + |1⟩)/√2 means heads and tails with equal weight. It is not ignorance about a hidden side: the two possibilities can still [interfere](#interference). Only a [measurement](#measurement) forces one answer.',
    },
    measurement: {
      title: 'Measurement — looking at the coin',
      body: 'Looking is a measurement, and it always gives heads or tails — never “on its edge”. A coin lying flat shows its side for sure; a standing coin falls to heads or tails at random, with the chances shown by the bars. Afterwards the coin really is heads or tails: the superposition is gone (“collapse”).',
    },
    bloch: {
      title: 'Bloch sphere',
      body: 'Every state of one qubit is a point on a sphere: heads [|0⟩](#ket) at the north pole, tails |1⟩ at the south pole, the superpositions around the equator (|+⟩, |−⟩ and the ±i states). The height of the arrow gives the chances: north = always heads, equator = 50:50. Every [gate](#gate) is a rotation of the sphere — and here the coin’s face points exactly along the arrow.',
    },
    ket: {
      title: 'The |0⟩ notation',
      body: '|0⟩ and |1⟩ (“ket zero”, “ket one”) are the two basic states: heads and tails. (|0⟩ + |1⟩)/√2 = |+⟩ and (|0⟩ − |1⟩)/√2 = |−⟩ are superpositions. The numbers in front are amplitudes; the square of their size, |a|², is the probability (½ each here). The sign between them is the [phase](#phase).',
    },
    gate: {
      title: 'Gates — coin moves',
      body: 'A gate is a move on the qubit. Every one-qubit gate is a rotation of the [Bloch sphere](#bloch) — watch the dashed axis while a gate plays. The classical coin moves are [I](#igate) (leave it) and [X](#xgate) (flip it); the quantum ones here are [H](#hadamard), [Z](#zgate) and [S](#sgate). Gates can always be undone: H after H gives back what you had.',
    },
    hadamard: {
      title: 'H — the Hadamard gate',
      body: 'H is the quantum computer’s secret move: a half turn (180°) about the diagonal between x and z. It stands heads up on its edge (|0⟩ → |+⟩) and lays |+⟩ back down to heads. So H·H does nothing — and in between, flipping the standing coin changes nothing either. That’s why H, flip-or-not, H always ends heads.',
    },
    xgate: {
      title: 'X — flip',
      body: 'X is the classical flip: heads ↔ tails. On the sphere it is a half turn (180°) about the x axis. A coin on its edge (|+⟩) lies on that very axis, so X just spins it in place — nothing you could ever measure changes.',
    },
    zgate: {
      title: 'Z — phase flip',
      body: 'Z is a half turn (180°) about the z axis. Heads and tails sit on that axis and stay put, but a standing coin turns around: |+⟩ ↔ |−⟩. A measurement can’t tell the difference — an H afterwards can: it turns |+⟩ into heads but |−⟩ into tails. That hidden difference is the [phase](#phase).',
    },
    sgate: {
      title: 'S — quarter phase',
      body: 'S is a quarter turn (90°) about the z axis — half a Z. It moves |+⟩ to |+i⟩, a point on the equator between |+⟩ and |−⟩. Still 50:50 when measured; the difference is all in the [phase](#phase).',
    },
    igate: {
      title: 'I — leave it',
      body: 'I, the identity, does nothing: the coin stays as it is. It is the classical “leave it” — in a circuit it shows that a player had a turn without changing anything.',
    },
    interference: {
      title: 'Interference',
      body: 'Amplitudes add up or cancel, like waves. After H · H the two ways to end on tails have opposite signs and cancel, while the two ways to heads add up — so heads becomes certain. Quantum algorithms use exactly this to steer the chances toward the right answer; see [what it’s good for](#algorithms).',
    },
    phase: {
      title: 'Phase',
      body: 'The sign between the parts of a superposition: |+⟩ = (|0⟩ + |1⟩)/√2 versus |−⟩ = (|0⟩ − |1⟩)/√2. Measured directly, both give 50:50 — the phase is invisible. It shows up through [interference](#interference): H turns |+⟩ into heads but |−⟩ into tails. On the [Bloch sphere](#bloch) the phase is the direction around the equator.',
    },
    circuit: {
      title: 'Quantum circuit',
      body: 'A quantum circuit is the program: one line per qubit (here just the coin), the gates in the order they are played from left to right, and a meter at the end for the [measurement](#measurement). The game is the circuit H · (flip or leave) · H.',
    },
    algorithms: {
      title: 'What is it good for?',
      body: 'The coin game is a tiny version of what quantum computers do: with [superposition](#superposition) a computation explores possibilities together, and with [interference](#interference) the wrong answers cancel while the right one adds up. Grover’s search and Shor’s factoring algorithm are built on this idea — with many qubits instead of one coin.',
    },
    math: {
      title: 'The math behind the game',
      body: 'A qubit’s state is α|0⟩ + β|1⟩ with |α|² + |β|² = 1. H turns heads |0⟩ into (|0⟩ + |1⟩)/√2, and a second H turns that back into |0⟩: ½(|0⟩ + |1⟩) + ½(|0⟩ − |1⟩) = |0⟩ — the |1⟩ parts cancel. X swaps |0⟩ and |1⟩ and so leaves (|0⟩ + |1⟩)/√2 unchanged: H, X, H ends on heads too. All steps are in chapter 6, “The math”.',
    },
  },
};

export default en;
