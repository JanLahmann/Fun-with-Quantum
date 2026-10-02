import type { Messages } from './types';

const de: Messages = {
  lang: 'de',
  langName: 'Deutsch',

  page: {
    title: 'Quanten-Münzspiel — Vorschau | Fun with Quantum',
    description: 'Spiel das Quanten-Münzspiel im Browser: Besiege einen Quantencomputer beim Münzspiel — und finde heraus, warum du nie eine Chance hattest.',
    kicker: 'Play · Superposition & Interferenz · Vorschau',
    heading: 'Quanten-Münzspiel',
    lead: 'Besiege einen Quantencomputer beim Münzspiel — und finde heraus, warum du nie eine Chance hattest.',
    notebook: 'Dasselbe Spiel als Jupyter-Notebook, mit echtem Qiskit-Code:',
    notebookLink: 'Notebook öffnen ↗',
    preview: 'Vorschau',
  },

  ui: {
    chapters: ['Ein faires Spiel', 'gegen einen Quantencomputer', 'Blick in die Box', 'Du bist Quanten', 'Sandkasten'],
    chaptersLabel: 'Kapitel',
    heads: 'Kopf',
    tails: 'Zahl',
    probsLabel: 'Messwahrscheinlichkeiten',
    coinInBox: 'hier drin ist die Münze',
    hiddenInBox: 'versteckt in der Box',
    whoStarts: 'Wer fängt an?',
    theComputer: 'Der Computer',
    you: 'Du',
    blochCaption: 'Bloch-Kugel',
    explain: 'Erklärung',
    explainTitle: 'Erklärungen',
    allTerms: '← alle Begriffe',
    close: 'Schließen',
    learnMoreIbm: 'Mehr dazu bei IBM Quantum Learning ↗',
    learnMoreDoq: 'In doQumentation ausführen ↗',
    noscript: 'Die Browser-Version braucht JavaScript — das Notebook funktioniert auch ohne.',
    circuitLabel: 'Der Schaltkreis bisher',
    coin: 'Münze',
    look: 'schauen',
    whoYou: 'du',
    whoComputer: 'Computer',
    score: (you, computer, rounds) => `Spielstand — du: ${you} · Computer: ${computer} · Runden: ${rounds}`,
  },

  states: {
    zero: '|0⟩ · Kopf, liegt flach',
    one: '|1⟩ · Zahl, liegt flach',
    plus: '|+⟩ = (|0⟩+|1⟩)/√2 · auf der Kante, Kopfseite nach außen',
    minus: '|−⟩ = (|0⟩−|1⟩)/√2 · auf der Kante, Zahlseite nach außen',
    other: (x, y, z) => `auf der Kante, gedreht · Bloch (${x}, ${y}, ${z})`,
  },

  gates: {
    name: { I: 'so lassen', X: 'umdrehen', H: 'Hadamard', Z: 'Phasenflip', S: 'Viertelphase' },
    fx: {
      I: '[<b>I</b>](#igate) · keine Drehung — der Pfeil bleibt, wo er ist.',
      X: '[<b>X</b>](#xgate) · halbe Drehung (180°) um die <b>x-Achse</b> (durch |+⟩ und |−⟩): Kopf ↔ Zahl, während |+⟩ und |−⟩ bleiben, wo sie sind.',
      H: '[<b>H</b>](#hadamard) · halbe Drehung (180°) um die <b>Diagonale zwischen x und z</b>: |0⟩ ↔ |+⟩ und |1⟩ ↔ |−⟩ — flach ↔ auf der Kante.',
      Z: '[<b>Z</b>](#zgate) · halbe Drehung (180°) um die <b>z-Achse</b> (durch |0⟩ und |1⟩): |+⟩ ↔ |−⟩, während Kopf und Zahl bleiben, wo sie sind.',
      S: '[<b>S</b>](#sgate) · Vierteldrehung (90°) um die <b>z-Achse</b>: |+⟩ → |+i⟩ — weiter 50:50, auch nach einem H. Zwei S ergeben ein Z: |+⟩ → |−⟩.',
    },
  },

  round: {
    startsHeads: 'Die Münze liegt am Anfang auf <strong>Kopf</strong>. Ab in die Box …',
    intoBox: 'Ab in die Box — jetzt zieht der Computer heimlich.',
    lifting: 'Die Box wird angehoben!',
    onEdge: 'Die Münze steht auf der Kante — Kopf <em>und</em> Zahl. [Hinschauen](#measurement) erzwingt eine Entscheidung …',
    flipIt: 'Umdrehen',
    leaveIt: 'So lassen',
    yourMoveB: 'Du bist dran. Münze umdrehen oder so lassen, wie sie ist?',
    youStartA: 'Du fängst an. Münze umdrehen oder so lassen?',
    yourLastA: 'Dein letzter Zug — immer noch blind. Umdrehen oder so lassen?',
    computerFirst: 'Der Computer macht seinen ersten Zug — du siehst ihn nicht.',
    computerLast: 'Der Computer macht seinen letzten Zug …',
    computerMiddle: 'Der Computer macht seinen Zug — du siehst ihn nicht.',
    playAgain: 'Noch mal spielen',
  },

  ch1: {
    title: '1 · Ein faires Spiel',
    rulesComputerFirst: 'Erst zieht der Computer, dann du, dann wieder der Computer.',
    rulesYouFirst: 'Erst ziehst du, dann der Computer, dann wieder du.',
    winComputerFirst: '<strong>Bei Zahl gewinnst du, bei Kopf der Computer.</strong>',
    winYouFirst: '<strong>Bei Kopf gewinnst du, bei Zahl der Computer.</strong> (Wer anfängt, gewinnt bei Kopf.)',
    intro: (rules, win) => `<p>Du und der Computer, ihr teilt euch eine Münze, versteckt in einer Box. Am Anfang liegt sie auf <strong>Kopf</strong>. ${rules} Jeder Zug heißt <em>umdrehen</em> oder <em>so lassen</em>, und keiner sieht die Züge des anderen.</p>
      <p>${win} Kann einer von euch besser sein als der reine Zufall?</p>`,
    youWin: (side) => `<strong>${side} — du gewinnst!</strong> Der Computer hat auch nur geraten.`,
    computerWins: (side) => `<strong>${side} — der Computer gewinnt.</strong> Er hatte kein Geheimnis, nur Glück.`,
    next: 'Jetzt gegen einen Quantencomputer spielen →',
  },

  ch2: {
    title: '2 · Gegen einen Quantencomputer',
    introComputerFirst: (rules, win) => `<p>Gleiche Box, gleiche Münze, gleiche Regeln: ${rules} ${win} Nur dein Gegner ist ein anderer — er läuft jetzt auf einem <strong>Quantencomputer</strong>.</p>
      <p>Spiel ein paar Runden. Probier alles aus.</p>`,
    introYouFirst: (win) => `<p>Diesmal <strong>fängst du an</strong>, du hast also den ersten und den letzten Zug; der <strong>Quantencomputer</strong> bekommt nur den Zug in der Mitte. ${win}</p>
      <p>Hilft ihm seine Quantenpower trotzdem?</p>`,
    lossLines: [
      'Kopf. Der Quantencomputer gewinnt.',
      'Schon wieder Kopf. Pech gehabt?',
      'Kopf. Dreimal hintereinander — das ist kein Zufall mehr.',
      'Kopf. Jedes. Einzelne. Mal.',
      'Kopf. Egal, was du machst, oder?',
    ],
    impossible: 'Zahl?! (Das dürfte eigentlich gar nicht gehen — erzähl uns, wie du das geschafft hast.)',
    youStartWin: '<strong>Kopf — du gewinnst!</strong> Mit nur dem mittleren Zug kann das H des Quantencomputers nichts ausrichten.',
    youStartLoss: (side) => `<strong>${side} — diese Runde geht an den Computer.</strong> Reines Glück: Aus der Mitte heraus ist Quantenpower nichts wert.`,
    peekComputerFirst: 'Wie macht er das? Ein Blick in die Box →',
    peekYouFirst: 'Warum? Ein Blick in die Box →',
    swapToYou: 'Lass mich anfangen',
    swapToComputer: 'Lass den Computer anfangen',
  },

  ch3: {
    title: '3 · Ein Blick in die Box',
    intro: `<p>Hier ist die Runde noch einmal — ohne Box, Schritt für Schritt. Das Geheimnis des Quantencomputers ist ein Zug, den eine normale Münze nicht kennt: das [Hadamard-Gatter, H](#hadamard) — gespielt <em>vor und nach</em> deinem Zug. Deshalb muss er anfangen: Hat er nur den mittleren Zug (probier in Kapitel 2 aus, selbst anzufangen), bringt ihm H überhaupt keinen Vorteil.</p>`,
    start: 'Start: Die Münze liegt auf <strong>Kopf</strong>. Quantenmechanisch gesagt: [|0⟩](#ket), alle Chancen auf Kopf.',
    nextComputer: 'Weiter: der Zug des Computers ▸',
    afterH: '<strong>H stellt die Münze auf die Kante.</strong> Sie ist jetzt Kopf <em>und</em> Zahl zugleich — eine [Superposition](#superposition), 50:50, wenn du jetzt hinschauen würdest.',
    mathH: '|0⟩ → H → (|0⟩ + |1⟩)/√2',
    nextFlip: 'Weiter: du drehst sie um ▸',
    nextLeave: 'Weiter: du lässt sie so ▸',
    afterFlip: '<strong>Du hast sie umgedreht — und nichts hat sich geändert.</strong> Eine Münze umzudrehen, die gleichzeitig Kopf und Zahl ist, vertauscht nur die beiden: Sie ist immer noch Kopf-und-Zahl.',
    afterLeave: '<strong>Du hast sie so gelassen.</strong> Sie steht immer noch auf der Kante: Kopf und Zahl zugleich.',
    mathFlip: 'X: (|0⟩ + |1⟩)/√2 → (|1⟩ + |0⟩)/√2 — derselbe Zustand',
    mathLeave: 'I: (|0⟩ + |1⟩)/√2 bleibt (|0⟩ + |1⟩)/√2',
    nextComputer2: 'Weiter: der zweite Zug des Computers ▸',
    afterH2: '<strong>Das zweite H legt sie wieder hin — auf Kopf, mit Sicherheit.</strong> Die beiden Wege zu Zahl löschen sich gegenseitig aus; die beiden Wege zu Kopf addieren sich. Das ist [Interferenz](#interference).',
    mathH2: 'H: (|0⟩ + |1⟩)/√2 → ½(|0⟩+|1⟩) + ½(|0⟩−|1⟩) = |0⟩',
    tryLeave: 'Probier es mit „so lassen“',
    tryFlip: 'Probier es mit „umdrehen“',
    next: 'Jetzt bist du der Quantencomputer →',
  },

  ch4: {
    title: '4 · Du bist der Quantencomputer',
    intro: `<p>Plätze tauschen: <strong>Du bist jetzt A</strong>, mit drei Zügen — <em>umdrehen</em> ([X](#xgate)), <em>so lassen</em> ([I](#igate)) und dem Quantenzug [<strong>H</strong>](#hadamard). Der Computer spielt B und dreht die Münze heimlich und zufällig um — oder eben nicht.</p>
      <p>Bei Kopf gewinnst du. Schaffst du es, jede Runde zu gewinnen?</p>`,
    moveFlip: 'Umdrehen',
    moveLeave: 'So lassen',
    moveH: 'Hadamard',
    first: 'Dein erster Zug — den darfst du dir ansehen.',
    firstHint: 'Dein erster Zug. (Tipp: Was hat die Münze in Kapitel 3 auf die Kante gestellt?)',
    intoBox: 'Ab in die Box — jetzt zieht der Computer heimlich.',
    last: 'Dein letzter Zug — blind, die Münze bleibt in der Box.',
    sureWin: '<strong>Kopf — und so wird es immer sein.</strong> H, irgendwas, H: Du bist gerade zum Quantencomputer geworden.',
    luckyWin: (flipped) => `<strong>Kopf — du gewinnst!</strong> Aber war das Können oder Glück? Der Computer hat die Münze ${flipped ? 'umgedreht' : 'so gelassen'}.`,
    loss: (flipped) => `<strong>Zahl — der Computer gewinnt.</strong> Er hat die Münze ${flipped ? 'umgedreht' : 'so gelassen'}.`,
    next: 'Ab in den Sandkasten →',
  },

  ch5: {
    title: '5 · Sandkasten',
    intro: `<p>Deine Münze, deine [Gatter](#gate). Füge Züge hinzu und beobachte die Münze: Flach liegend ist sie Kopf oder Zahl, auf der Kante stehend eine [Superposition](#superposition). [<strong>Z</strong>](#zgate) und [<strong>S</strong>](#sgate) drehen eine stehende Münze herum — eine Messung sieht das nicht. Ein H schon: H, Z, H endet auf Zahl. Ein einzelnes S ist kniffliger: H, S, H bleibt 50:50 — probier H, S, S, H.</p>`,
    addGate: 'Füge ein Gatter hinzu.',
    measure: 'Hinschauen (messen)',
    measureMany: '100× messen',
    undo: 'Rückgängig',
    reset: 'Zurücksetzen',
    notebook: 'Das echte Qiskit-Notebook ↗',
    backToHeads: 'Zurück auf Kopf.',
    undone: 'Rückgängig gemacht.',
    many: (h, t, eh, et) => `100 Messungen: ${h}× Kopf, ${t}× Zahl (erwartet ${eh} : ${et})`,
    measured: (side) => `<strong>${side}.</strong> Durch das Hinschauen ist die Münze kollabiert — füge weitere Gatter hinzu oder setz sie zurück.`,
    played: (g, name) => `${g}: ${name}.`,
  },

  glossary: {
    qubit: {
      title: 'Qubit — die Quantenmünze',
      body: 'Ein Qubit ist die Quantenversion eines Bits — in diesem Spiel die Münze. Ein Bit ist 0 oder 1; ein Qubit kann auch in einer [Superposition](#superposition) aus beidem sein. Sein Zustand ist ein Pfeil auf der [Bloch-Kugel](#bloch) — hier die Richtung, in die die Kopfseite der Münze zeigt.',
    },
    superposition: {
      title: 'Superposition (Überlagerung)',
      body: 'Eine Münze, die auf der Kante steht, ist weder Kopf noch Zahl — sie ist beides zugleich, in einer genau festgelegten Mischung. (|0⟩ + |1⟩)/√2 heißt: Kopf und Zahl mit gleichem Gewicht. Das ist kein bloßes Nichtwissen über eine verdeckte Seite: Die beiden Möglichkeiten können noch [interferieren](#interference). Erst eine [Messung](#measurement) erzwingt eine Antwort.',
    },
    measurement: {
      title: 'Messung — auf die Münze schauen',
      body: 'Hinschauen ist eine Messung, und die ergibt immer Kopf oder Zahl — nie „auf der Kante“. Eine flach liegende Münze zeigt ihre Seite mit Sicherheit; eine stehende Münze fällt zufällig auf Kopf oder Zahl, mit den Chancen, die die Balken zeigen. Danach ist die Münze wirklich Kopf oder Zahl: Die Superposition ist weg („Kollaps“).',
    },
    bloch: {
      title: 'Bloch-Kugel',
      body: 'Jeder Zustand eines Qubits ist ein Punkt auf einer Kugel: Kopf [|0⟩](#ket) am Nordpol, Zahl |1⟩ am Südpol, die Superpositionen rund um den Äquator (|+⟩, |−⟩ und die ±i-Zustände). Die Höhe des Pfeils gibt die Chancen an: Norden = immer Kopf, Äquator = 50:50. Jedes [Gatter](#gate) ist eine Drehung der Kugel — und hier zeigt die Kopfseite der Münze genau in Pfeilrichtung.',
    },
    ket: {
      title: 'Die Schreibweise |0⟩',
      body: '|0⟩ und |1⟩ („Ket null“, „Ket eins“) sind die beiden Grundzustände: Kopf und Zahl. (|0⟩ + |1⟩)/√2 = |+⟩ und (|0⟩ − |1⟩)/√2 = |−⟩ sind Superpositionen. Die Zahlen davor sind Amplituden; das Quadrat ihres Betrags, |a|², ist die Wahrscheinlichkeit (hier je ½). Das Vorzeichen dazwischen ist die [Phase](#phase).',
    },
    gate: {
      title: 'Gatter — Münzzüge',
      body: 'Ein Gatter ist ein Zug mit dem Qubit. Jedes Ein-Qubit-Gatter ist eine Drehung der [Bloch-Kugel](#bloch) — achte auf die gestrichelte Achse, während ein Gatter läuft. Die klassischen Münzzüge sind [I](#igate) (so lassen) und [X](#xgate) (umdrehen); die Quantenzüge hier sind [H](#hadamard), [Z](#zgate) und [S](#sgate). Gatter lassen sich immer rückgängig machen: H nach H ergibt wieder, was du vorher hattest.',
    },
    hadamard: {
      title: 'H — das Hadamard-Gatter',
      body: 'H ist der Geheimzug des Quantencomputers: eine halbe Drehung (180°) um die Diagonale zwischen x und z. Es stellt Kopf auf die Kante (|0⟩ → |+⟩) und legt |+⟩ wieder auf Kopf hin. H·H bewirkt also nichts — und dazwischen ändert auch das Umdrehen der stehenden Münze nichts. Deshalb endet H, umdrehen-oder-nicht, H immer mit Kopf.',
    },
    xgate: {
      title: 'X — umdrehen',
      body: 'X ist das klassische Umdrehen: Kopf ↔ Zahl. Auf der Kugel ist es eine halbe Drehung (180°) um die x-Achse. Eine Münze auf der Kante (|+⟩) liegt genau auf dieser Achse, also dreht X sie nur auf der Stelle — nichts, was du je messen könntest, ändert sich.',
    },
    zgate: {
      title: 'Z — Phasenflip',
      body: 'Z ist eine halbe Drehung (180°) um die z-Achse. Kopf und Zahl liegen auf dieser Achse und bleiben, wo sie sind, aber eine stehende Münze dreht sich herum: |+⟩ ↔ |−⟩. Eine Messung merkt davon nichts — ein H danach schon: Es macht aus |+⟩ Kopf, aber aus |−⟩ Zahl. Dieser verborgene Unterschied ist die [Phase](#phase).',
    },
    sgate: {
      title: 'S — Viertelphase',
      body: 'S ist eine Vierteldrehung (90°) um die z-Achse — ein halbes Z. Es bringt |+⟩ nach |+i⟩, einem Punkt auf dem Äquator zwischen |+⟩ und |−⟩. Gemessen immer noch 50:50; der Unterschied steckt ganz in der [Phase](#phase).',
    },
    igate: {
      title: 'I — so lassen',
      body: 'I, die Identität, tut nichts: Die Münze bleibt, wie sie ist. Das ist das klassische „so lassen“ — in einem Schaltkreis zeigt es, dass ein Spieler am Zug war, ohne etwas zu verändern.',
    },
    interference: {
      title: 'Interferenz',
      body: 'Amplituden addieren sich oder löschen sich aus, wie Wellen. Nach H · H haben die beiden Wege zu Zahl entgegengesetzte Vorzeichen und löschen sich aus, während sich die beiden Wege zu Kopf addieren — so wird Kopf sicher. Quantenalgorithmen nutzen genau das, um die Chancen in Richtung der richtigen Antwort zu lenken; siehe [Wozu ist das gut?](#algorithms)',
    },
    phase: {
      title: 'Phase',
      body: 'Das Vorzeichen zwischen den Teilen einer Superposition: |+⟩ = (|0⟩ + |1⟩)/√2 gegenüber |−⟩ = (|0⟩ − |1⟩)/√2. Direkt gemessen ergeben beide 50:50 — die Phase ist unsichtbar. Sie zeigt sich erst durch [Interferenz](#interference): H macht aus |+⟩ Kopf, aber aus |−⟩ Zahl. Auf der [Bloch-Kugel](#bloch) ist die Phase die Richtung rund um den Äquator.',
    },
    circuit: {
      title: 'Quantenschaltkreis',
      body: 'Ein Quantenschaltkreis ist das Programm: eine Linie pro Qubit (hier nur die Münze), die Gatter von links nach rechts in der Reihenfolge, in der sie gespielt werden, und am Ende ein Messgerät für die [Messung](#measurement). Das Spiel ist der Schaltkreis H · (umdrehen oder so lassen) · H.',
    },
    algorithms: {
      title: 'Wozu ist das gut?',
      body: 'Das Münzspiel ist eine Mini-Version dessen, was Quantencomputer tun: Durch [Superposition](#superposition) spielt eine Rechnung viele Möglichkeiten gemeinsam durch, und durch [Interferenz](#interference) löschen sich die falschen Antworten aus, während sich die richtige verstärkt. Grovers Suchalgorithmus und Shors Faktorisierungsalgorithmus beruhen auf dieser Idee — mit vielen Qubits statt einer Münze.',
    },
  },
};

export default de;
