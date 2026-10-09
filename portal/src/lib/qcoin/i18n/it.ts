import type { Messages } from './types';

const it: Messages = {
  lang: 'it',
  langName: 'Italiano',

  page: {
    title: 'Il gioco della moneta quantistica — anteprima | Fun with Quantum',
    description: 'Gioca nel browser al gioco della moneta quantistica: batti un computer quantistico a testa o croce — e scopri perché non avevi nessuna possibilità.',
    kicker: 'Gioca · Sovrapposizione e interferenza · anteprima',
    heading: 'Il gioco della moneta quantistica',
    lead: 'Batti un computer quantistico a testa o croce — e scopri perché non avevi nessuna possibilità.',
    notebook: 'Lo stesso gioco come notebook Jupyter, con vero codice Qiskit:',
    notebookLink: 'apri il notebook ↗',
    notebookWait: 'Avvia una sessione Jupyter gratuita su mybinder.org (tramite QuBins); l’avvio può richiedere qualche minuto.',
    preview: 'Anteprima',
  },

  ui: {
    chapters: ['Un gioco equo', 'Contro un computer quantistico', 'Guarda dentro', 'Fai tu il quantistico', 'Sandbox', 'La matematica'],
    chaptersLabel: 'Capitoli',
    heads: 'Testa',
    tails: 'Croce',
    probsLabel: 'Probabilità di misurazione',
    coinInBox: 'qui dentro c’è la moneta',
    hiddenInBox: 'nascosta nella scatola',
    whoStarts: 'Chi comincia?',
    theComputer: 'Il computer',
    you: 'Tu',
    blochCaption: 'Sfera di Bloch',
    explain: 'Spiegami',
    explainTitle: 'Spiegazioni',
    allTerms: '← tutti i termini',
    close: 'Chiudi',
    learnMoreIbm: 'Scopri di più su IBM Quantum Learning ↗',
    learnMoreDoq: 'Eseguilo in doQumentation ↗',
    noscript: 'La versione per browser richiede JavaScript — il notebook funziona anche senza.',
    circuitLabel: 'Il circuito finora',
    coin: 'moneta',
    look: 'guarda',
    whoYou: 'tu',
    whoComputer: 'computer',
    score: (you, computer, rounds) => `Punteggio — tu: ${you} · computer: ${computer} · partite: ${rounds}`,
  },

  states: {
    zero: '|0⟩ · testa, distesa',
    one: '|1⟩ · croce, distesa',
    plus: '|+⟩ = (|0⟩+|1⟩)/√2 · sul bordo, lato testa in fuori',
    minus: '|−⟩ = (|0⟩−|1⟩)/√2 · sul bordo, lato croce in fuori',
    other: (x, y, z) => `sul bordo, ruotata · Bloch (${x}, ${y}, ${z})`,
  },

  gates: {
    name: { I: 'lasciala', X: 'girala', H: 'Hadamard', Z: 'inversione di fase', S: 'quarto di fase' },
    fx: {
      I: '[<b>I</b>](#igate) · nessuna rotazione — la freccia resta dov’è.',
      X: '[<b>X</b>](#xgate) · mezzo giro (180°) attorno all’<b>asse x</b> (passante per |+⟩ e |−⟩): testa ↔ croce, mentre |+⟩ e |−⟩ restano fermi.',
      H: '[<b>H</b>](#hadamard) · mezzo giro (180°) attorno alla <b>diagonale tra x e z</b>: |0⟩ ↔ |+⟩ e |1⟩ ↔ |−⟩ — distesa ↔ sul bordo.',
      Z: '[<b>Z</b>](#zgate) · mezzo giro (180°) attorno all’<b>asse z</b> (passante per |0⟩ e |1⟩): |+⟩ ↔ |−⟩, mentre testa e croce restano ferme.',
      S: '[<b>S</b>](#sgate) · quarto di giro (90°) attorno all’<b>asse z</b>: |+⟩ → |+i⟩ — ancora 50:50, anche dopo una H. Due S fanno una Z: |+⟩ → |−⟩.',
    },
  },

  round: {
    startsHeads: 'La moneta parte da <strong>testa</strong>. Dentro la scatola…',
    intoBox: 'Dentro la scatola — ora il computer muove in segreto.',
    lifting: 'Si alza la scatola!',
    onEdge: 'La moneta è in piedi sul bordo — testa <em>e</em> croce. [Guardarla](#measurement) costringe a scegliere…',
    flipIt: 'Girala',
    leaveIt: 'Lasciala',
    yourMoveB: 'Tocca a te. Giri la moneta o la lasci com’è?',
    youStartA: 'Cominci tu. Giri la moneta o la lasci com’è?',
    yourLastA: 'La tua ultima mossa — sempre alla cieca. La giri o la lasci?',
    computerFirst: 'Il computer fa la sua prima mossa — non puoi vederla.',
    computerLast: 'Il computer fa la sua ultima mossa…',
    computerMiddle: 'Il computer fa la sua mossa — non puoi vederla.',
    playAgain: 'Gioca ancora',
  },

  ch1: {
    title: '1 · Un gioco equo',
    rulesComputerFirst: 'Muove il computer, poi tu, poi di nuovo il computer.',
    rulesYouFirst: 'Muovi tu, poi il computer, poi di nuovo tu.',
    winComputerFirst: '<strong>Croce: vinci tu. Testa: vince il computer.</strong>',
    winYouFirst: '<strong>Testa: vinci tu. Croce: vince il computer.</strong> (Chi comincia vince con testa.)',
    intro: (rules, win) => `<p>Tu e il computer condividete una sola moneta, nascosta in una scatola. Parte da <strong>testa</strong>. ${rules} A ogni mossa si può <em>girarla</em> o <em>lasciarla</em>, e nessuno vede le mosse dell’altro.</p>
      <p>${win} Qualcuno dei due può fare meglio di un semplice lancio di moneta?</p>`,
    youWin: (side) => `<strong>${side} — hai vinto!</strong> Anche il computer tirava a indovinare.`,
    computerWins: (side) => `<strong>${side} — vince il computer.</strong> Nessun segreto, solo fortuna.`,
    next: 'Ora gioca contro un computer quantistico →',
  },

  ch2: {
    title: '2 · Contro un computer quantistico',
    introComputerFirst: (rules, win) => `<p>Stessa scatola, stessa moneta, stesse regole: ${rules} ${win} È cambiato solo l’avversario — ora gira su un <strong>computer quantistico</strong>.</p>
      <p>Gioca qualche partita. Prova di tutto.</p>`,
    introYouFirst: (win) => `<p>Questa volta <strong>cominci tu</strong>, quindi hai la prima e l’ultima mossa; il <strong>computer quantistico</strong> ha solo la mossa di mezzo. ${win}</p>
      <p>La potenza quantistica lo aiuta ancora?</p>`,
    lossLines: [
      'Testa. Vince il computer quantistico.',
      'Di nuovo testa. Sfortuna?',
      'Testa. Tre di fila — questa non è più fortuna.',
      'Testa. Ogni. Singola. Volta.',
      'Testa. Qualunque cosa tu faccia non cambia niente, vero?',
    ],
    impossible: 'Croce?! (Dovrebbe essere impossibile — raccontaci come ci sei riuscito.)',
    youStartWin: '<strong>Testa — hai vinto!</strong> Con la sola mossa di mezzo, la H del computer quantistico non può guidare niente.',
    youStartLoss: (side) => `<strong>${side} — questa la vince il computer.</strong> Pura fortuna: dal centro, la potenza quantistica non vale nulla.`,
    peekComputerFirst: 'Come ci riesce? Guarda dentro →',
    peekYouFirst: 'Perché? Guarda dentro →',
    swapToYou: 'Fammi cominciare',
    swapToComputer: 'Fai cominciare il computer',
  },

  ch3: {
    title: '3 · Guarda dentro la scatola',
    intro: `<p>Ecco di nuovo la partita — senza scatola, un passo alla volta. Il segreto del computer quantistico è una mossa che una moneta normale non ha: la [porta di Hadamard, H](#hadamard) — giocata <em>prima e dopo</em> la tua mossa. Ecco perché deve cominciare lui: con la sola mossa di mezzo (prova “Fammi cominciare” nel capitolo 2), H non dà alcun vantaggio.</p>`,
    start: 'Inizio: la moneta è distesa con <strong>testa</strong> in su. In termini quantistici: [|0⟩](#ket), tutte le probabilità su testa.',
    nextComputer: 'Avanti: la mossa del computer ▸',
    afterH: '<strong>H mette la moneta in piedi sul bordo.</strong> Ora è testa <em>e</em> croce allo stesso tempo — una [sovrapposizione](#superposition), 50:50 se guardassi adesso.',
    mathH: '|0⟩ → H → (|0⟩ + |1⟩)/√2',
    nextFlip: 'Avanti: tu la giri ▸',
    nextLeave: 'Avanti: tu la lasci ▸',
    afterFlip: '<strong>L’hai girata — e non è cambiato niente.</strong> Girare una moneta che è testa e croce allo stesso tempo scambia solo le due: resta testa-e-croce.',
    afterLeave: '<strong>L’hai lasciata.</strong> Sempre in piedi sul bordo: testa e croce allo stesso tempo.',
    mathFlip: 'X: (|0⟩ + |1⟩)/√2 → (|1⟩ + |0⟩)/√2 — lo stesso stato',
    mathLeave: 'I: (|0⟩ + |1⟩)/√2 resta (|0⟩ + |1⟩)/√2',
    nextComputer2: 'Avanti: la seconda mossa del computer ▸',
    afterH2: '<strong>La seconda H la rimette distesa — testa, con certezza.</strong> I due modi di finire su croce si annullano a vicenda; i due modi di finire su testa si sommano. Questa è l’[interferenza](#interference).',
    mathH2: 'H: (|0⟩ + |1⟩)/√2 → ½(|0⟩+|1⟩) + ½(|0⟩−|1⟩) = |0⟩',
    tryLeave: 'Prova con “lasciala”',
    tryFlip: 'Prova con “girala”',
    next: 'Ora fai tu il computer quantistico →',
  },

  ch4: {
    title: '4 · Fai tu il computer quantistico',
    intro: `<p>Scambiatevi i posti: ora <strong>tu sei A</strong>, con tre mosse — <em>girala</em> ([X](#xgate)), <em>lasciala</em> ([I](#igate)) e la quantistica [<strong>H</strong>](#hadamard). Il computer gioca B, girando o no a caso, in segreto.</p>
      <p>Con testa vinci tu. Riesci a vincere ogni partita?</p>`,
    moveFlip: 'Girala',
    moveLeave: 'Lasciala',
    moveH: 'Hadamard',
    first: 'La tua prima mossa — questa puoi vederla.',
    firstHint: 'La tua prima mossa. (Suggerimento: cosa ha messo la moneta in piedi sul bordo nel capitolo 3?)',
    intoBox: 'Dentro la scatola — ora il computer muove in segreto.',
    last: 'La tua ultima mossa — alla cieca, la moneta resta nella scatola.',
    sureWin: '<strong>Testa — e sarà sempre così.</strong> H, qualsiasi cosa, H: sei appena diventato il computer quantistico.',
    luckyWin: (flipped) => `<strong>Testa — hai vinto!</strong> Ma era abilità o fortuna? Il computer ${flipped ? 'ha girato la moneta' : 'ha lasciato la moneta com’era'}.`,
    loss: (flipped) => `<strong>Croce — vince il computer.</strong> ${flipped ? 'Ha girato la moneta' : 'Ha lasciato la moneta com’era'}.`,
    next: 'Apri la sandbox →',
  },

  ch5: {
    title: '5 · Sandbox',
    intro: `<p>La tua moneta, le tue [porte](#gate). Aggiungi mosse e osserva la moneta: distesa è testa o croce, in piedi sul bordo è una [sovrapposizione](#superposition). [<strong>Z</strong>](#zgate) e [<strong>S</strong>](#sgate) fanno ruotare una moneta in piedi — una misurazione non lo vede. Una H sì: H, Z, H finisce su croce. Una sola S è più sottile: H, S, H resta 50:50 — prova H, S, S, H.</p>`,
    addGate: 'Aggiungi una porta.',
    measure: 'Guarda (misura)',
    measureMany: 'Misura 100×',
    undo: 'Annulla',
    reset: 'Ricomincia',
    notebook: 'Il vero notebook Qiskit ↗',
    backToHeads: 'Di nuovo testa.',
    undone: 'Annullato.',
    many: (h, t, eh, et) => `100 misurazioni: ${h}× testa, ${t}× croce (attese ${eh} : ${et})`,
    measured: (side) => `<strong>${side}.</strong> Guardarla ha fatto collassare la moneta — aggiungi altre porte, o ricomincia.`,
    played: (g, name) => `${g}: ${name}.`,
  },

  ch6: {
    title: '6 · La matematica',
    intro: '<p>Ogni stato di un qubit è α|0⟩ + β|1⟩, con due numeri complessi α e β — le ampiezze — e |α|² + |β|² = 1. Una misurazione dà testa (|0⟩) con probabilità |α|² e croce (|1⟩) con probabilità |β|².</p><p>Una porta è definita da ciò che fa a |0⟩ e |1⟩; su una sovrapposizione agisce su ciascuna parte separatamente:</p><p class="math">X: |0⟩ → |1⟩ e |1⟩ → |0⟩<br>H: |0⟩ → (|0⟩ + |1⟩)/√2 e |1⟩ → (|0⟩ − |1⟩)/√2</p>',
    caseLeave: '<p>Se lasci la moneta (I), le due H del computer danno</p><p class="math">H(H|0⟩) = H((|0⟩ + |1⟩)/√2)<br>= (H|0⟩ + H|1⟩)/√2<br>= ½(|0⟩ + |1⟩) + ½(|0⟩ − |1⟩)<br>= |0⟩</p><p>Le due parti con |1⟩ si annullano — [interferenza](#interference) distruttiva — mentre le due con |0⟩ si sommano.</p>',
    caseFlip: '<p>Se la giri (X), non cambia nulla: X scambia le due parti di (|0⟩ + |1⟩)/√2, che sono uguali.</p><p class="math">X((|0⟩ + |1⟩)/√2) = (|1⟩ + |0⟩)/√2 = H|0⟩<br>quindi H(X(H|0⟩)) = H(H|0⟩) = |0⟩</p>',
    conclusion: '<p>In entrambi i casi la moneta finisce su testa con certezza: il computer quantistico vince ogni partita.</p>',
    leave: 'Caso 1: la lasci (I)',
    flip: 'Caso 2: la giri (X)',
    pick: 'Scegli un caso: guarda la moneta e segui i calcoli.',
    done: 'La moneta finisce su testa, con certezza.',
  },

  glossary: {
    qubit: {
      title: 'Qubit — la moneta quantistica',
      body: 'Un qubit è la versione quantistica di un bit — in questo gioco, la moneta. Un bit è 0 o 1; un qubit può anche trovarsi in una [sovrapposizione](#superposition) dei due. Il suo stato è una freccia sulla [sfera di Bloch](#bloch) — qui, la direzione in cui punta la faccia della moneta.',
    },
    superposition: {
      title: 'Sovrapposizione',
      body: 'Una moneta in piedi sul bordo non è né testa né croce — è entrambe allo stesso tempo, in una miscela ben precisa. (|0⟩ + |1⟩)/√2 significa testa e croce con lo stesso peso. Non è ignoranza su un lato nascosto: le due possibilità possono ancora [interferire](#interference). Solo una [misurazione](#measurement) impone una risposta.',
    },
    measurement: {
      title: 'Misurazione — guardare la moneta',
      body: 'Guardare è una misurazione, e dà sempre testa o croce — mai “sul bordo”. Una moneta distesa mostra di sicuro il suo lato; una moneta in piedi cade su testa o croce a caso, con le probabilità indicate dalle barre. Dopo, la moneta è davvero testa o croce: la sovrapposizione è sparita (“collasso”).',
    },
    bloch: {
      title: 'Sfera di Bloch',
      body: 'Ogni stato di un qubit è un punto su una sfera: testa [|0⟩](#ket) al polo nord, croce |1⟩ al polo sud, le sovrapposizioni lungo l’equatore (|+⟩, |−⟩ e gli stati ±i). L’altezza della freccia dà le probabilità: nord = sempre testa, equatore = 50:50. Ogni [porta](#gate) è una rotazione della sfera — e qui la faccia della moneta punta esattamente lungo la freccia.',
    },
    ket: {
      title: 'La notazione |0⟩',
      body: '|0⟩ e |1⟩ (“ket zero”, “ket uno”) sono i due stati di base: testa e croce. (|0⟩ + |1⟩)/√2 = |+⟩ e (|0⟩ − |1⟩)/√2 = |−⟩ sono sovrapposizioni. I numeri davanti sono le ampiezze; il quadrato del loro modulo, |a|², è la probabilità (qui ½ ciascuna). Il segno tra loro è la [fase](#phase).',
    },
    gate: {
      title: 'Porte — le mosse della moneta',
      body: 'Una porta (gate) è una mossa sul qubit. Ogni porta a singolo qubit è una rotazione della [sfera di Bloch](#bloch) — osserva l’asse tratteggiato mentre una porta agisce. Le mosse classiche della moneta sono [I](#igate) (lasciala) e [X](#xgate) (girala); quelle quantistiche qui sono [H](#hadamard), [Z](#zgate) e [S](#sgate). Le porte si possono sempre annullare: H dopo H ti ridà quello che avevi.',
    },
    hadamard: {
      title: 'H — la porta di Hadamard',
      body: 'H è la mossa segreta del computer quantistico: mezzo giro (180°) attorno alla diagonale tra x e z. Mette in piedi sul bordo una moneta su testa (|0⟩ → |+⟩) e rimette |+⟩ distesa su testa. Quindi H·H non fa nulla — e nel mezzo, anche girare la moneta in piedi non cambia nulla. Ecco perché H, gira-o-no, H finisce sempre su testa.',
    },
    xgate: {
      title: 'X — girala',
      body: 'X è il giro classico: testa ↔ croce. Sulla sfera è un mezzo giro (180°) attorno all’asse x. Una moneta sul bordo (|+⟩) sta proprio su quell’asse, quindi X la fa solo ruotare sul posto — niente di ciò che potresti mai misurare cambia.',
    },
    zgate: {
      title: 'Z — inversione di fase',
      body: 'Z è un mezzo giro (180°) attorno all’asse z. Testa e croce stanno su quell’asse e restano ferme, ma una moneta in piedi si gira: |+⟩ ↔ |−⟩. Una misurazione non vede la differenza — una H subito dopo sì: trasforma |+⟩ in testa ma |−⟩ in croce. Quella differenza nascosta è la [fase](#phase).',
    },
    sgate: {
      title: 'S — quarto di fase',
      body: 'S è un quarto di giro (90°) attorno all’asse z — mezza Z. Porta |+⟩ in |+i⟩, un punto sull’equatore tra |+⟩ e |−⟩. Misurata dà ancora 50:50; la differenza sta tutta nella [fase](#phase).',
    },
    igate: {
      title: 'I — lasciala',
      body: 'I, l’identità, non fa nulla: la moneta resta com’è. È il classico “lasciala” — in un circuito mostra che un giocatore ha avuto il suo turno senza cambiare niente.',
    },
    interference: {
      title: 'Interferenza',
      body: 'Le ampiezze si sommano o si annullano, come le onde. Dopo H · H i due modi di finire su croce hanno segni opposti e si annullano, mentre i due modi di finire su testa si sommano — così testa diventa certa. Gli algoritmi quantistici usano proprio questo per spingere le probabilità verso la risposta giusta; vedi [a cosa serve](#algorithms).',
    },
    phase: {
      title: 'Fase',
      body: 'Il segno tra le parti di una sovrapposizione: |+⟩ = (|0⟩ + |1⟩)/√2 contro |−⟩ = (|0⟩ − |1⟩)/√2. Misurati direttamente, danno entrambi 50:50 — la fase è invisibile. Si manifesta attraverso l’[interferenza](#interference): H trasforma |+⟩ in testa ma |−⟩ in croce. Sulla [sfera di Bloch](#bloch) la fase è la direzione lungo l’equatore.',
    },
    circuit: {
      title: 'Circuito quantistico',
      body: 'Un circuito quantistico è il programma: una linea per ogni qubit (qui solo la moneta), le porte nell’ordine in cui vengono giocate da sinistra a destra, e un misuratore alla fine per la [misurazione](#measurement). Il gioco è il circuito H · (girala o lasciala) · H.',
    },
    algorithms: {
      title: 'A cosa serve?',
      body: 'Il gioco della moneta è una versione in miniatura di ciò che fanno i computer quantistici: con la [sovrapposizione](#superposition) un calcolo esplora più possibilità insieme, e con l’[interferenza](#interference) le risposte sbagliate si annullano mentre quella giusta si rafforza. L’algoritmo di ricerca di Grover e quello di fattorizzazione di Shor si basano su questa idea — con molti qubit invece di una sola moneta.',
    },
    math: {
      title: 'La matematica del gioco',
      body: 'Lo stato di un qubit è α|0⟩ + β|1⟩ con |α|² + |β|² = 1. H trasforma testa |0⟩ in (|0⟩ + |1⟩)/√2, e una seconda H lo riporta a |0⟩: ½(|0⟩ + |1⟩) + ½(|0⟩ − |1⟩) = |0⟩ — le parti con |1⟩ si annullano. X scambia |0⟩ e |1⟩ e quindi lascia (|0⟩ + |1⟩)/√2 invariato: anche H, X, H finisce su testa. Tutti i passaggi sono nel capitolo 6, «La matematica».',
    },
  },
};

export default it;
