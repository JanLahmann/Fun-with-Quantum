import type { Messages } from './types';

const fr: Messages = {
  lang: 'fr',
  langName: 'Français',

  page: {
    title: 'Le jeu de la pièce quantique — aperçu | Fun with Quantum',
    description: 'Joue au jeu de la pièce quantique dans ton navigateur : bats un ordinateur quantique à pile ou face — et découvre pourquoi tu n’avais aucune chance.',
    kicker: 'Jouer · Superposition et interférence · aperçu',
    heading: 'Le jeu de la pièce quantique',
    lead: 'Bats un ordinateur quantique à pile ou face — et découvre pourquoi tu n’avais aucune chance.',
    notebook: 'Le même jeu sous forme de notebook Jupyter, avec du vrai code Qiskit :',
    notebookLink: 'ouvrir le notebook ↗',
    preview: 'Aperçu',
  },

  ui: {
    chapters: ['Un jeu équitable', 'Contre un ordinateur quantique', 'Regarde dedans', 'À toi d’être quantique', 'Bac à sable'],
    chaptersLabel: 'Chapitres',
    heads: 'Face',
    tails: 'Pile',
    probsLabel: 'Probabilités de mesure',
    coinInBox: 'la pièce est là-dedans',
    hiddenInBox: 'cachée dans la boîte',
    whoStarts: 'Qui commence ?',
    theComputer: 'L’ordinateur',
    you: 'Toi',
    blochCaption: 'Sphère de Bloch',
    explain: 'Expliquer',
    explainTitle: 'Explications',
    allTerms: '← tous les termes',
    close: 'Fermer',
    learnMoreIbm: 'En savoir plus sur IBM Quantum Learning ↗',
    learnMoreDoq: 'L’exécuter dans doQumentation ↗',
    noscript: 'La version navigateur a besoin de JavaScript — le notebook fonctionne sans.',
    circuitLabel: 'Le circuit jusqu’ici',
    coin: 'pièce',
    look: 'regard',
    whoYou: 'toi',
    whoComputer: 'ordi',
    score: (you, computer, rounds) => `Score — toi : ${you} · ordinateur : ${computer} · manches : ${rounds}`,
  },

  states: {
    zero: '|0⟩ · face, à plat',
    one: '|1⟩ · pile, à plat',
    plus: '|+⟩ = (|0⟩+|1⟩)/√2 · sur la tranche, côté face vers l’avant',
    minus: '|−⟩ = (|0⟩−|1⟩)/√2 · sur la tranche, côté pile vers l’avant',
    other: (x, y, z) => `sur la tranche, tournée · Bloch (${x}, ${y}, ${z})`,
  },

  gates: {
    name: { I: 'la laisser', X: 'la retourner', H: 'Hadamard', Z: 'inversion de phase', S: 'quart de phase' },
    fx: {
      I: '[<b>I</b>](#igate) · aucune rotation — la flèche reste où elle est.',
      X: '[<b>X</b>](#xgate) · demi-tour (180°) autour de l’<b>axe x</b> (qui passe par |+⟩ et |−⟩) : face ↔ pile, tandis que |+⟩ et |−⟩ ne bougent pas.',
      H: '[<b>H</b>](#hadamard) · demi-tour (180°) autour de la <b>diagonale entre x et z</b> : |0⟩ ↔ |+⟩ et |1⟩ ↔ |−⟩ — à plat ↔ sur la tranche.',
      Z: '[<b>Z</b>](#zgate) · demi-tour (180°) autour de l’<b>axe z</b> (qui passe par |0⟩ et |1⟩) : |+⟩ ↔ |−⟩, tandis que face et pile ne bougent pas.',
      S: '[<b>S</b>](#sgate) · quart de tour (90°) autour de l’<b>axe z</b> : |+⟩ → |+i⟩ — toujours 50:50, même après un H. Deux S donnent un Z : |+⟩ → |−⟩.',
    },
  },

  round: {
    startsHeads: 'La pièce commence côté <strong>face</strong>. Hop, dans la boîte…',
    intoBox: 'Dans la boîte — maintenant, l’ordinateur joue en secret.',
    lifting: 'On soulève la boîte !',
    onEdge: 'La pièce est sur la tranche — face <em>et</em> pile. [Regarder](#measurement) l’oblige à choisir…',
    flipIt: 'La retourner',
    leaveIt: 'La laisser',
    yourMoveB: 'À toi de jouer. Tu retournes la pièce, ou tu la laisses comme elle est ?',
    youStartA: 'Tu commences. Tu retournes la pièce, ou tu la laisses ?',
    yourLastA: 'Ton dernier coup — toujours à l’aveugle. Tu la retournes, ou tu la laisses ?',
    computerFirst: 'L’ordinateur joue son premier coup — tu ne peux pas le voir.',
    computerLast: 'L’ordinateur joue son dernier coup…',
    computerMiddle: 'L’ordinateur joue son coup — tu ne peux pas le voir.',
    playAgain: 'Rejouer',
  },

  ch1: {
    title: '1 · Un jeu équitable',
    rulesComputerFirst: 'L’ordinateur joue, puis toi, puis de nouveau l’ordinateur.',
    rulesYouFirst: 'Tu joues, puis l’ordinateur, puis de nouveau toi.',
    winComputerFirst: '<strong>Pile : tu gagnes. Face : l’ordinateur gagne.</strong>',
    winYouFirst: '<strong>Face : tu gagnes. Pile : l’ordinateur gagne.</strong> (Celui qui commence gagne sur face.)',
    intro: (rules, win) => `<p>Toi et l’ordinateur partagez une seule pièce, cachée dans une boîte. Elle commence côté <strong>face</strong>. ${rules} À chaque coup, on peut <em>la retourner</em> ou <em>la laisser</em>, et personne ne voit les coups de l’autre.</p>
      <p>${win} L’un des deux peut-il faire mieux qu’un simple pile ou face ?</p>`,
    youWin: (side) => `<strong>${side} — tu gagnes !</strong> L’ordinateur jouait au hasard, lui aussi.`,
    computerWins: (side) => `<strong>${side} — l’ordinateur gagne.</strong> Aucun secret, juste de la chance.`,
    next: 'Maintenant, affronte un ordinateur quantique →',
  },

  ch2: {
    title: '2 · Contre un ordinateur quantique',
    introComputerFirst: (rules, win) => `<p>Même boîte, même pièce, mêmes règles : ${rules} ${win} Seul ton adversaire a changé — il tourne maintenant sur un <strong>ordinateur quantique</strong>.</p>
      <p>Joue quelques manches. Essaie tout.</p>`,
    introYouFirst: (win) => `<p>Cette fois, <strong>c’est toi qui commences</strong> : tu as le premier et le dernier coup ; l’<strong>ordinateur quantique</strong> n’a que le coup du milieu. ${win}</p>
      <p>Sa puissance quantique l’aide-t-elle encore ?</p>`,
    lossLines: [
      'Face. L’ordinateur quantique gagne.',
      'Encore face. Pas de chance ?',
      'Face. Trois fois de suite — ce n’est plus de la chance.',
      'Face. À. Chaque. Fois.',
      'Face. Quoi que tu fasses, ça ne change rien, hein ?',
    ],
    impossible: 'Pile ?! (Ça devrait être impossible — dis-nous comment tu as fait.)',
    youStartWin: '<strong>Face — tu gagnes !</strong> Avec seulement le coup du milieu, le H de l’ordinateur quantique ne peut rien orienter.',
    youStartLoss: (side) => `<strong>${side} — l’ordinateur gagne cette fois.</strong> Pure chance : depuis le milieu, la puissance quantique ne sert à rien.`,
    peekComputerFirst: 'Comment fait-il ? Regarde dedans →',
    peekYouFirst: 'Pourquoi ? Regarde dedans →',
    swapToYou: 'Je veux commencer',
    swapToComputer: 'Laisser l’ordinateur commencer',
  },

  ch3: {
    title: '3 · Regarde dans la boîte',
    intro: `<p>Voici de nouveau la manche — sans la boîte, étape par étape. Le secret de l’ordinateur quantique, c’est un coup qu’une pièce normale ne connaît pas : la [porte de Hadamard, H](#hadamard) — jouée <em>avant et après</em> ton coup. C’est pour ça qu’il doit commencer : avec seulement le coup du milieu (essaie de commencer toi-même au chapitre 2), H ne donne aucun avantage.</p>`,
    start: 'Départ : la pièce est à plat, côté <strong>face</strong>. En langage quantique : [|0⟩](#ket), toutes les chances sur face.',
    nextComputer: 'Suite : le coup de l’ordinateur ▸',
    afterH: '<strong>H pose la pièce sur la tranche.</strong> Elle est maintenant face <em>et</em> pile à la fois — une [superposition](#superposition), à 50:50 si tu regardais maintenant.',
    mathH: '|0⟩ → H → (|0⟩ + |1⟩)/√2',
    nextFlip: 'Suite : tu la retournes ▸',
    nextLeave: 'Suite : tu la laisses ▸',
    afterFlip: '<strong>Tu l’as retournée — et rien n’a changé.</strong> Retourner une pièce qui est face et pile à la fois ne fait qu’échanger les deux : elle est toujours face-et-pile.',
    afterLeave: '<strong>Tu l’as laissée.</strong> Toujours debout sur la tranche : face et pile à la fois.',
    mathFlip: 'X: (|0⟩ + |1⟩)/√2 → (|1⟩ + |0⟩)/√2 — le même état',
    mathLeave: 'I: (|0⟩ + |1⟩)/√2 reste (|0⟩ + |1⟩)/√2',
    nextComputer2: 'Suite : le second coup de l’ordinateur ▸',
    afterH2: '<strong>Le second H la recouche — face, à coup sûr.</strong> Les deux chemins qui mènent à pile s’annulent ; les deux chemins vers face s’additionnent. C’est l’[interférence](#interference).',
    mathH2: 'H: (|0⟩ + |1⟩)/√2 → ½(|0⟩+|1⟩) + ½(|0⟩−|1⟩) = |0⟩',
    tryLeave: 'Essaie avec « la laisser »',
    tryFlip: 'Essaie avec « la retourner »',
    next: 'À toi d’être l’ordinateur quantique →',
  },

  ch4: {
    title: '4 · À toi d’être l’ordinateur quantique',
    intro: `<p>On échange les places : <strong>tu es A</strong> maintenant, avec trois coups — <em>retourner</em> ([X](#xgate)), <em>laisser</em> ([I](#igate)) et le [<strong>H</strong>](#hadamard) quantique. L’ordinateur joue B : il retourne la pièce ou non, au hasard et en secret.</p>
      <p>Face, tu gagnes. Peux-tu gagner à chaque manche ?</p>`,
    moveFlip: 'Retourner',
    moveLeave: 'Laisser',
    moveH: 'Hadamard',
    first: 'Ton premier coup — celui-là, tu peux le voir.',
    firstHint: 'Ton premier coup. (Indice : qu’est-ce qui a mis la pièce sur la tranche au chapitre 3 ?)',
    intoBox: 'Dans la boîte — maintenant, l’ordinateur joue en secret.',
    last: 'Ton dernier coup — à l’aveugle, la pièce reste dans la boîte.',
    sureWin: '<strong>Face — et ce sera toujours le cas.</strong> H, n’importe quoi, H : tu viens de devenir l’ordinateur quantique.',
    luckyWin: (flipped) => `<strong>Face — tu gagnes !</strong> Mais talent ou chance ? L’ordinateur ${flipped ? 'a retourné la pièce' : 'a laissé la pièce telle quelle'}.`,
    loss: (flipped) => `<strong>Pile — l’ordinateur gagne.</strong> Il ${flipped ? 'a retourné la pièce' : 'a laissé la pièce telle quelle'}.`,
    next: 'Ouvrir le bac à sable →',
  },

  ch5: {
    title: '5 · Bac à sable',
    intro: `<p>Ta pièce, tes [portes](#gate). Ajoute des coups et observe la pièce : à plat, c’est face ou pile ; debout sur la tranche, c’est une [superposition](#superposition). [<strong>Z</strong>](#zgate) et [<strong>S</strong>](#sgate) font pivoter une pièce debout — une mesure ne le voit pas. Un H, si : H, Z, H finit sur pile. Un seul S est plus subtil : H, S, H reste à 50:50 — essaie H, S, S, H.</p>`,
    addGate: 'Ajoute une porte.',
    measure: 'Regarder (mesurer)',
    measureMany: 'Mesurer 100×',
    undo: 'Annuler',
    reset: 'Réinitialiser',
    notebook: 'Le vrai notebook Qiskit ↗',
    backToHeads: 'Retour côté face.',
    undone: 'Annulé.',
    many: (h, t, eh, et) => `100 mesures : ${h}× face, ${t}× pile (attendu : ${eh} : ${et})`,
    measured: (side) => `<strong>${side}.</strong> Regarder a fait s’effondrer la pièce — ajoute d’autres portes, ou réinitialise.`,
    played: (g, name) => `${g} : ${name}.`,
  },

  glossary: {
    qubit: {
      title: 'Qubit — la pièce quantique',
      body: 'Un qubit est la version quantique d’un bit — dans ce jeu, c’est la pièce. Un bit vaut 0 ou 1 ; un qubit peut aussi être dans une [superposition](#superposition) des deux. Son état est une flèche sur la [sphère de Bloch](#bloch) — ici, la direction vers laquelle pointe le côté face de la pièce.',
    },
    superposition: {
      title: 'Superposition',
      body: 'Une pièce debout sur la tranche n’est ni face ni pile — elle est les deux à la fois, dans un mélange bien précis. (|0⟩ + |1⟩)/√2 signifie face et pile avec le même poids. Ce n’est pas qu’on ignore un côté caché : les deux possibilités peuvent encore [interférer](#interference). Seule une [mesure](#measurement) impose une réponse.',
    },
    measurement: {
      title: 'Mesure — regarder la pièce',
      body: 'Regarder, c’est mesurer, et ça donne toujours face ou pile — jamais « sur la tranche ». Une pièce à plat montre son côté à coup sûr ; une pièce debout tombe sur face ou pile au hasard, avec les chances indiquées par les barres. Ensuite, la pièce est vraiment face ou pile : la superposition a disparu (« effondrement »).',
    },
    bloch: {
      title: 'Sphère de Bloch',
      body: 'Chaque état d’un qubit est un point sur une sphère : face [|0⟩](#ket) au pôle Nord, pile |1⟩ au pôle Sud, les superpositions autour de l’équateur (|+⟩, |−⟩ et les états ±i). La hauteur de la flèche donne les chances : nord = toujours face, équateur = 50:50. Chaque [porte](#gate) est une rotation de la sphère — et ici, le côté face de la pièce pointe exactement dans la direction de la flèche.',
    },
    ket: {
      title: 'La notation |0⟩',
      body: '|0⟩ et |1⟩ (« ket zéro », « ket un ») sont les deux états de base : face et pile. (|0⟩ + |1⟩)/√2 = |+⟩ et (|0⟩ − |1⟩)/√2 = |−⟩ sont des superpositions. Les nombres devant sont des amplitudes ; le carré de leur module, |a|², donne la probabilité (½ chacune ici). Le signe entre les deux est la [phase](#phase).',
    },
    gate: {
      title: 'Portes — les coups sur la pièce',
      body: 'Une porte est un coup joué sur le qubit. Toute porte à un qubit est une rotation de la [sphère de Bloch](#bloch) — observe l’axe en pointillés pendant qu’une porte agit. Les coups classiques sont [I](#igate) (la laisser) et [X](#xgate) (la retourner) ; les coups quantiques ici sont [H](#hadamard), [Z](#zgate) et [S](#sgate). Une porte peut toujours être défaite : H après H redonne ce que tu avais.',
    },
    hadamard: {
      title: 'H — la porte de Hadamard',
      body: 'H est le coup secret de l’ordinateur quantique : un demi-tour (180°) autour de la diagonale entre x et z. Elle met sur la tranche une pièce côté face (|0⟩ → |+⟩) et recouche |+⟩ côté face. Donc H·H ne fait rien — et entre les deux, retourner la pièce debout ne change rien non plus. Voilà pourquoi H, retourner-ou-pas, H finit toujours sur face.',
    },
    xgate: {
      title: 'X — retourner',
      body: 'X est le retournement classique : face ↔ pile. Sur la sphère, c’est un demi-tour (180°) autour de l’axe x. Une pièce sur la tranche (|+⟩) se trouve justement sur cet axe, alors X la fait juste tourner sur place — rien de ce que tu pourrais mesurer ne change.',
    },
    zgate: {
      title: 'Z — inversion de phase',
      body: 'Z est un demi-tour (180°) autour de l’axe z. Face et pile sont sur cet axe et ne bougent pas, mais une pièce debout fait demi-tour : |+⟩ ↔ |−⟩. Une mesure ne voit pas la différence — un H ensuite, si : il transforme |+⟩ en face mais |−⟩ en pile. Cette différence cachée, c’est la [phase](#phase).',
    },
    sgate: {
      title: 'S — quart de phase',
      body: 'S est un quart de tour (90°) autour de l’axe z — la moitié d’un Z. Il amène |+⟩ sur |+i⟩, un point de l’équateur entre |+⟩ et |−⟩. Toujours 50:50 à la mesure ; toute la différence est dans la [phase](#phase).',
    },
    igate: {
      title: 'I — la laisser',
      body: 'I, l’identité, ne fait rien : la pièce reste comme elle est. C’est le « la laisser » classique — dans un circuit, il montre qu’un joueur a eu son tour sans rien changer.',
    },
    interference: {
      title: 'Interférence',
      body: 'Les amplitudes s’additionnent ou s’annulent, comme des vagues. Après H · H, les deux chemins qui mènent à pile ont des signes opposés et s’annulent, tandis que les deux chemins vers face s’additionnent — face devient donc certain. Les algorithmes quantiques utilisent exactement cela pour orienter les chances vers la bonne réponse ; voir [à quoi ça sert](#algorithms).',
    },
    phase: {
      title: 'Phase',
      body: 'Le signe entre les parties d’une superposition : |+⟩ = (|0⟩ + |1⟩)/√2 contre |−⟩ = (|0⟩ − |1⟩)/√2. Mesurés directement, les deux donnent 50:50 — la phase est invisible. Elle se révèle par l’[interférence](#interference) : H transforme |+⟩ en face mais |−⟩ en pile. Sur la [sphère de Bloch](#bloch), la phase est la direction autour de l’équateur.',
    },
    circuit: {
      title: 'Circuit quantique',
      body: 'Un circuit quantique, c’est le programme : une ligne par qubit (ici, juste la pièce), les portes dans l’ordre où elles sont jouées, de gauche à droite, et un appareil de mesure à la fin pour la [mesure](#measurement). Le jeu, c’est le circuit H · (retourner ou laisser) · H.',
    },
    algorithms: {
      title: 'À quoi ça sert ?',
      body: 'Le jeu de la pièce est une version miniature de ce que font les ordinateurs quantiques : grâce à la [superposition](#superposition), un calcul explore plusieurs possibilités ensemble, et grâce à l’[interférence](#interference), les mauvaises réponses s’annulent tandis que la bonne s’additionne. L’algorithme de recherche de Grover et l’algorithme de factorisation de Shor reposent sur cette idée — avec beaucoup de qubits au lieu d’une seule pièce.',
    },
  },
};

export default fr;
