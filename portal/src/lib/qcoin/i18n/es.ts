import type { Messages } from './types';

const es: Messages = {
  lang: 'es',
  langName: 'Español',

  page: {
    title: 'El juego de la moneda cuántica — vista previa | Fun with Quantum',
    description: 'Juega al juego de la moneda cuántica en tu navegador: intenta ganarle a un ordenador cuántico a cara o cruz… y descubre por qué nunca tuviste ninguna oportunidad.',
    kicker: 'Jugar · Superposición e interferencia · vista previa',
    heading: 'El juego de la moneda cuántica',
    lead: 'Intenta ganarle a un ordenador cuántico a cara o cruz… y descubre por qué nunca tuviste ninguna oportunidad.',
    notebook: 'El mismo juego como notebook de Jupyter, con código Qiskit de verdad:',
    notebookLink: 'abrir el notebook ↗',
    notebookWait: 'Abre una sesión gratuita de Jupyter en mybinder.org (a través de QuBins); el arranque puede tardar unos minutos.',
    preview: 'Vista previa',
  },

  ui: {
    chapters: ['Un juego justo', 'contra un ordenador cuántico', 'Mira dentro', 'Sé tú el cuántico', 'Laboratorio', 'Las matemáticas'],
    chaptersLabel: 'Capítulos',
    heads: 'Cara',
    tails: 'Cruz',
    probsLabel: 'Probabilidades de medición',
    coinInBox: 'aquí dentro está la moneda',
    hiddenInBox: 'escondida en la caja',
    whoStarts: '¿Quién empieza?',
    theComputer: 'El ordenador',
    you: 'Tú',
    blochCaption: 'Esfera de Bloch',
    explain: 'Explicar',
    explainTitle: 'Explicaciones',
    allTerms: '← todos los términos',
    close: 'Cerrar',
    learnMoreIbm: 'Aprende más en IBM Quantum Learning ↗',
    learnMoreDoq: 'Ejecútalo en doQumentation ↗',
    noscript: 'La versión para el navegador necesita JavaScript; el notebook funciona sin él.',
    circuitLabel: 'El circuito hasta ahora',
    coin: 'moneda',
    look: 'mirar',
    whoYou: 'tú',
    whoComputer: 'ordenador',
    score: (you, computer, rounds) => `Marcador — tú: ${you} · ordenador: ${computer} · rondas: ${rounds}`,
  },

  states: {
    zero: '|0⟩ · cara, plana sobre la mesa',
    one: '|1⟩ · cruz, plana sobre la mesa',
    plus: '|+⟩ = (|0⟩+|1⟩)/√2 · de canto, con la cara hacia fuera',
    minus: '|−⟩ = (|0⟩−|1⟩)/√2 · de canto, con la cruz hacia fuera',
    other: (x, y, z) => `de canto, girada · Bloch (${x}, ${y}, ${z})`,
  },

  gates: {
    name: { I: 'déjala', X: 'dale la vuelta', H: 'Hadamard', Z: 'cambio de fase', S: 'cuarto de fase' },
    fx: {
      I: '[<b>I</b>](#igate) · sin rotación: la flecha se queda donde está.',
      X: '[<b>X</b>](#xgate) · media vuelta (180°) alrededor del <b>eje x</b> (que pasa por |+⟩ y |−⟩): cara ↔ cruz, mientras |+⟩ y |−⟩ no se mueven.',
      H: '[<b>H</b>](#hadamard) · media vuelta (180°) alrededor de la <b>diagonal entre x y z</b>: |0⟩ ↔ |+⟩ y |1⟩ ↔ |−⟩, es decir, plana ↔ de canto.',
      Z: '[<b>Z</b>](#zgate) · media vuelta (180°) alrededor del <b>eje z</b> (que pasa por |0⟩ y |1⟩): |+⟩ ↔ |−⟩, mientras cara y cruz no se mueven.',
      S: '[<b>S</b>](#sgate) · un cuarto de vuelta (90°) alrededor del <b>eje z</b>: |+⟩ → |+i⟩: sigue al 50:50, incluso tras una H. Dos S forman una Z: |+⟩ → |−⟩.',
    },
  },

  round: {
    startsHeads: 'La moneda empieza en <strong>cara</strong>. Y a la caja…',
    intoBox: 'A la caja: ahora el ordenador juega en secreto.',
    lifting: '¡Levantamos la caja!',
    onEdge: 'La moneda está de canto: cara <em>y</em> cruz. [Mirar](#measurement) la obliga a elegir…',
    flipIt: 'Dale la vuelta',
    leaveIt: 'Déjala',
    yourMoveB: 'Te toca. ¿Le das la vuelta a la moneda o la dejas como está?',
    youStartA: 'Empiezas tú. ¿Le das la vuelta a la moneda o la dejas?',
    yourLastA: 'Tu última jugada, todavía a ciegas. ¿Le das la vuelta o la dejas?',
    computerFirst: 'El ordenador hace su primera jugada; no puedes verla.',
    computerLast: 'El ordenador hace su última jugada…',
    computerMiddle: 'El ordenador hace su jugada; no puedes verla.',
    playAgain: 'Jugar otra vez',
  },

  ch1: {
    title: '1 · Un juego justo',
    rulesComputerFirst: 'Juega el ordenador, luego tú y luego otra vez el ordenador.',
    rulesYouFirst: 'Juegas tú, luego el ordenador y luego otra vez tú.',
    winComputerFirst: '<strong>Cruz: ganas tú. Cara: gana el ordenador.</strong>',
    winYouFirst: '<strong>Cara: ganas tú. Cruz: gana el ordenador.</strong> (Quien empieza gana con cara).',
    intro: (rules, win) => `<p>El ordenador y tú comparten una moneda, escondida en una caja. Empieza en <strong>cara</strong>. ${rules} En cada jugada puedes <em>darle la vuelta</em> o <em>dejarla</em>, y nadie ve las jugadas del otro.</p>
      <p>${win} ¿Puede alguno de los dos hacerlo mejor que lanzar una moneda al aire?</p>`,
    youWin: (side) => `<strong>${side}: ¡ganas tú!</strong> El ordenador también estaba adivinando.`,
    computerWins: (side) => `<strong>${side}: gana el ordenador.</strong> No tenía ningún secreto, solo suerte.`,
    next: 'Ahora juega contra un ordenador cuántico →',
  },

  ch2: {
    title: '2 · Contra un ordenador cuántico',
    introComputerFirst: (rules, win) => `<p>La misma caja, la misma moneda, las mismas reglas: ${rules} ${win} Solo ha cambiado tu rival: ahora funciona en un <strong>ordenador cuántico</strong>.</p>
      <p>Juega unas cuantas rondas. Prueba de todo.</p>`,
    introYouFirst: (win) => `<p>Esta vez <strong>empiezas tú</strong>, así que tienes la primera y la última jugada; el <strong>ordenador cuántico</strong> solo juega la del medio. ${win}</p>
      <p>¿Le sigue sirviendo de algo el poder cuántico?</p>`,
    lossLines: [
      'Cara. Gana el ordenador cuántico.',
      'Cara otra vez. ¿Mala suerte?',
      'Cara. Tres seguidas: eso ya no es suerte.',
      'Cara. Todas. Las. Veces.',
      'Cara. Da igual lo que hagas, ¿verdad?',
    ],
    impossible: '¡¿Cruz?! (Esto debería ser imposible: cuéntanos cómo lo has hecho).',
    youStartWin: '<strong>Cara: ¡ganas tú!</strong> Con solo la jugada del medio, la H del ordenador cuántico no puede dirigir nada.',
    youStartLoss: (side) => `<strong>${side}: esta vez gana el ordenador.</strong> Pura suerte: desde el medio, el poder cuántico no vale nada.`,
    peekComputerFirst: '¿Cómo lo hace? Mira dentro →',
    peekYouFirst: '¿Por qué? Mira dentro →',
    swapToYou: 'Quiero empezar yo',
    swapToComputer: 'Que empiece el ordenador',
  },

  ch3: {
    title: '3 · Mira dentro de la caja',
    intro: `<p>Aquí está otra vez la ronda, sin caja y paso a paso. El secreto del ordenador cuántico es una jugada que una moneda normal no tiene: la [puerta de Hadamard, H](#hadamard), que juega <em>antes y después</em> de tu jugada. Por eso tiene que empezar él: con solo la jugada del medio (prueba a empezar tú en el capítulo 2), H no le da ninguna ventaja.</p>`,
    start: 'Inicio: la moneda está con la <strong>cara</strong> hacia arriba. En términos cuánticos: [|0⟩](#ket), toda la probabilidad en cara.',
    nextComputer: 'Siguiente: la jugada del ordenador ▸',
    afterH: '<strong>H pone la moneda de canto.</strong> Ahora es cara <em>y</em> cruz a la vez: una [superposición](#superposition), 50:50 si miraras ahora.',
    mathH: '|0⟩ → H → (|0⟩ + |1⟩)/√2',
    nextFlip: 'Siguiente: le das la vuelta ▸',
    nextLeave: 'Siguiente: la dejas ▸',
    afterFlip: '<strong>Le diste la vuelta… y no cambió nada.</strong> Dar la vuelta a una moneda que es cara y cruz a la vez solo intercambia las dos: sigue siendo cara-y-cruz.',
    afterLeave: '<strong>La dejaste.</strong> Sigue de canto: cara y cruz a la vez.',
    mathFlip: 'X: (|0⟩ + |1⟩)/√2 → (|1⟩ + |0⟩)/√2 — el mismo estado',
    mathLeave: 'I: (|0⟩ + |1⟩)/√2 sigue siendo (|0⟩ + |1⟩)/√2',
    nextComputer2: 'Siguiente: la segunda jugada del ordenador ▸',
    afterH2: '<strong>La segunda H vuelve a tumbar la moneda: cara, con total certeza.</strong> Los dos caminos que acaban en cruz se anulan entre sí; los dos caminos hacia cara se suman. Eso es la [interferencia](#interference).',
    mathH2: 'H: (|0⟩ + |1⟩)/√2 → ½(|0⟩+|1⟩) + ½(|0⟩−|1⟩) = |0⟩',
    tryLeave: 'Pruébalo con “déjala”',
    tryFlip: 'Pruébalo con “dale la vuelta”',
    next: 'Ahora sé tú el ordenador cuántico →',
  },

  ch4: {
    title: '4 · Sé tú el ordenador cuántico',
    intro: `<p>Cambiamos de sitio: ahora <strong>tú eres A</strong>, con tres jugadas posibles: <em>dar la vuelta</em> ([X](#xgate)), <em>dejar</em> ([I](#igate)) y la cuántica [<strong>H</strong>](#hadamard). El ordenador juega como B y, en secreto, le da la vuelta o no al azar.</p>
      <p>Con cara ganas tú. ¿Puedes ganar todas las rondas?</p>`,
    moveFlip: 'Dar la vuelta',
    moveLeave: 'Dejar',
    moveH: 'Hadamard',
    first: 'Tu primera jugada: esta sí puedes verla.',
    firstHint: 'Tu primera jugada. (Pista: ¿qué puso la moneda de canto en el capítulo 3?)',
    intoBox: 'A la caja: ahora el ordenador juega en secreto.',
    last: 'Tu última jugada, a ciegas: la moneda sigue en la caja.',
    sureWin: '<strong>Cara, y siempre lo será.</strong> H, cualquier cosa, H: acabas de convertirte en el ordenador cuántico.',
    luckyWin: (flipped) => `<strong>Cara: ¡ganas tú!</strong> Pero ¿fue habilidad o suerte? El ordenador ${flipped ? 'le dio la vuelta a la moneda' : 'dejó la moneda como estaba'}.`,
    loss: (flipped) => `<strong>Cruz: gana el ordenador.</strong> ${flipped ? 'Le dio la vuelta a la moneda' : 'Dejó la moneda como estaba'}.`,
    next: 'Abre el laboratorio →',
  },

  ch5: {
    title: '5 · Laboratorio',
    intro: `<p>Tu moneda, tus [puertas](#gate). Añade jugadas y observa la moneda: plana es cara o cruz; de canto es una [superposición](#superposition). [<strong>Z</strong>](#zgate) y [<strong>S</strong>](#sgate) hacen girar una moneda que está de canto, algo que una medición no ve. Una H sí: H, Z, H termina en cruz. Una sola S es más sutil: H, S, H sigue al 50:50; prueba H, S, S, H.</p>`,
    addGate: 'Añade una puerta.',
    measure: 'Mirar (medir)',
    measureMany: 'Medir 100×',
    undo: 'Deshacer',
    reset: 'Reiniciar',
    notebook: 'El notebook de Qiskit de verdad ↗',
    backToHeads: 'De vuelta a cara.',
    undone: 'Deshecho.',
    many: (h, t, eh, et) => `100 mediciones: ${h}× cara, ${t}× cruz (lo esperado: ${eh} : ${et})`,
    measured: (side) => `<strong>${side}.</strong> Al mirar, la moneda colapsó: añade más puertas o reinicia.`,
    played: (g, name) => `${g}: ${name}.`,
  },

  ch6: {
    title: '6 · Las matemáticas',
    intro: '<p>Cualquier estado de un qubit es α|0⟩ + β|1⟩, con dos números complejos α y β —las amplitudes— y |α|² + |β|² = 1. Al medir sale cara (|0⟩) con probabilidad |α|² y cruz (|1⟩) con probabilidad |β|².</p><p>Una puerta queda definida por lo que hace con |0⟩ y |1⟩; sobre una superposición actúa en cada parte por separado:</p><p class="math">X: |0⟩ → |1⟩ y |1⟩ → |0⟩<br>H: |0⟩ → (|0⟩ + |1⟩)/√2 y |1⟩ → (|0⟩ − |1⟩)/√2</p>',
    caseLeave: '<p>Si dejas la moneda (I), las dos H del ordenador dan</p><p class="math">H(H|0⟩) = H((|0⟩ + |1⟩)/√2)<br>= (H|0⟩ + H|1⟩)/√2<br>= ½(|0⟩ + |1⟩) + ½(|0⟩ − |1⟩)<br>= |0⟩</p><p>Las dos partes con |1⟩ se cancelan —[interferencia](#interference) destructiva— y las dos con |0⟩ se suman.</p>',
    caseFlip: '<p>Si le das la vuelta (X), no cambia nada: X intercambia las dos partes de (|0⟩ + |1⟩)/√2, que son iguales.</p><p class="math">X((|0⟩ + |1⟩)/√2) = (|1⟩ + |0⟩)/√2 = H|0⟩<br>así que H(X(H|0⟩)) = H(H|0⟩) = |0⟩</p>',
    conclusion: '<p>En ambos casos la moneda termina en cara con certeza: el ordenador cuántico gana todas las rondas.</p>',
    leave: 'Caso 1: la dejas (I)',
    flip: 'Caso 2: le das la vuelta (X)',
    pick: 'Elige un caso: mira la moneda y sigue las cuentas.',
    done: 'La moneda termina en cara, con certeza.',
  },

  glossary: {
    qubit: {
      title: 'Qubit: la moneda cuántica',
      body: 'Un qubit es la versión cuántica de un bit; en este juego, la moneda. Un bit es 0 o 1; un qubit también puede estar en una [superposición](#superposition) de ambos. Su estado es una flecha en la [esfera de Bloch](#bloch): aquí, la dirección hacia la que apunta la cara de la moneda.',
    },
    superposition: {
      title: 'Superposición',
      body: 'Una moneda de canto no es ni cara ni cruz: es las dos cosas a la vez, en una mezcla bien definida. (|0⟩ + |1⟩)/√2 significa cara y cruz con el mismo peso. No es que no sepamos qué lado está oculto: las dos posibilidades todavía pueden [interferir](#interference). Solo una [medición](#measurement) obliga a dar una única respuesta.',
    },
    measurement: {
      title: 'Medición: mirar la moneda',
      body: 'Mirar es una medición, y siempre da cara o cruz, nunca “de canto”. Una moneda plana muestra su lado con seguridad; una moneda de canto cae en cara o cruz al azar, con las probabilidades que indican las barras. Después, la moneda es de verdad cara o cruz: la superposición ha desaparecido (“colapso”).',
    },
    bloch: {
      title: 'Esfera de Bloch',
      body: 'Cada estado de un qubit es un punto de una esfera: cara [|0⟩](#ket) en el polo norte, cruz |1⟩ en el polo sur y las superposiciones alrededor del ecuador (|+⟩, |−⟩ y los estados ±i). La altura de la flecha da las probabilidades: norte = siempre cara, ecuador = 50:50. Cada [puerta](#gate) es una rotación de la esfera, y aquí la cara de la moneda apunta exactamente en la dirección de la flecha.',
    },
    ket: {
      title: 'La notación |0⟩',
      body: '|0⟩ y |1⟩ (“ket cero”, “ket uno”) son los dos estados básicos: cara y cruz. (|0⟩ + |1⟩)/√2 = |+⟩ y (|0⟩ − |1⟩)/√2 = |−⟩ son superposiciones. Los números de delante son amplitudes; el cuadrado de su módulo, |a|², es la probabilidad (aquí, ½ cada una). El signo entre ellas es la [fase](#phase).',
    },
    gate: {
      title: 'Puertas: jugadas con la moneda',
      body: 'Una puerta es una jugada sobre el qubit. Toda puerta de un qubit es una rotación de la [esfera de Bloch](#bloch): fíjate en el eje discontinuo mientras se aplica una puerta. Las jugadas clásicas con la moneda son [I](#igate) (dejarla) y [X](#xgate) (darle la vuelta); las cuánticas, aquí, son [H](#hadamard), [Z](#zgate) y [S](#sgate). Las puertas siempre se pueden deshacer: H después de H te devuelve lo que tenías.',
    },
    hadamard: {
      title: 'H: la puerta de Hadamard',
      body: 'H es la jugada secreta del ordenador cuántico: media vuelta (180°) alrededor de la diagonal entre x y z. Pone de canto una moneda que está en cara (|0⟩ → |+⟩) y vuelve a tumbar |+⟩ en cara. Así que H·H no hace nada, y entre medias, darle la vuelta a la moneda de canto tampoco cambia nada. Por eso H, dar la vuelta o no, H siempre acaba en cara.',
    },
    xgate: {
      title: 'X: dar la vuelta',
      body: 'X es el volteo clásico: cara ↔ cruz. En la esfera es media vuelta (180°) alrededor del eje x. Una moneda de canto (|+⟩) está justo sobre ese eje, así que X solo la hace girar sobre sí misma: nada de lo que puedas medir cambia.',
    },
    zgate: {
      title: 'Z: cambio de fase',
      body: 'Z es media vuelta (180°) alrededor del eje z. Cara y cruz están sobre ese eje y no se mueven, pero una moneda de canto gira: |+⟩ ↔ |−⟩. Una medición no puede notar la diferencia; una H después, sí: convierte |+⟩ en cara, pero |−⟩ en cruz. Esa diferencia oculta es la [fase](#phase).',
    },
    sgate: {
      title: 'S: cuarto de fase',
      body: 'S es un cuarto de vuelta (90°) alrededor del eje z: media Z. Lleva |+⟩ a |+i⟩, un punto del ecuador entre |+⟩ y |−⟩. Al medir sigue dando 50:50; toda la diferencia está en la [fase](#phase).',
    },
    igate: {
      title: 'I: dejarla',
      body: 'I, la identidad, no hace nada: la moneda se queda como está. Es el “déjala” clásico; en un circuito muestra que un jugador tuvo su turno sin cambiar nada.',
    },
    interference: {
      title: 'Interferencia',
      body: 'Las amplitudes se suman o se anulan, como las ondas. Tras H · H, los dos caminos que acaban en cruz tienen signos opuestos y se anulan, mientras que los dos caminos hacia cara se suman: así, cara pasa a ser segura. Los algoritmos cuánticos usan exactamente esto para inclinar las probabilidades hacia la respuesta correcta; mira [para qué sirve](#algorithms).',
    },
    phase: {
      title: 'Fase',
      body: 'El signo entre las partes de una superposición: |+⟩ = (|0⟩ + |1⟩)/√2 frente a |−⟩ = (|0⟩ − |1⟩)/√2. Si se miden directamente, las dos dan 50:50: la fase es invisible. Se nota a través de la [interferencia](#interference): H convierte |+⟩ en cara, pero |−⟩ en cruz. En la [esfera de Bloch](#bloch), la fase es la dirección alrededor del ecuador.',
    },
    circuit: {
      title: 'Circuito cuántico',
      body: 'Un circuito cuántico es el programa: una línea por qubit (aquí solo la moneda), las puertas en el orden en que se juegan de izquierda a derecha y un medidor al final para la [medición](#measurement). El juego es el circuito H · (dar la vuelta o dejarla) · H.',
    },
    algorithms: {
      title: '¿Para qué sirve?',
      body: 'El juego de la moneda es una versión diminuta de lo que hacen los ordenadores cuánticos: con la [superposición](#superposition), un cálculo explora varias posibilidades a la vez, y con la [interferencia](#interference), las respuestas incorrectas se anulan mientras la correcta se refuerza. El algoritmo de búsqueda de Grover y el de factorización de Shor se basan en esta idea, con muchos qubits en lugar de una sola moneda.',
    },
    math: {
      title: 'Las matemáticas del juego',
      body: 'El estado de un qubit es α|0⟩ + β|1⟩ con |α|² + |β|² = 1. H convierte cara |0⟩ en (|0⟩ + |1⟩)/√2, y una segunda H lo devuelve a |0⟩: ½(|0⟩ + |1⟩) + ½(|0⟩ − |1⟩) = |0⟩; las partes con |1⟩ se cancelan. X intercambia |0⟩ y |1⟩, así que deja (|0⟩ + |1⟩)/√2 igual: H, X, H también termina en cara. Todos los pasos están en el capítulo 6, «Las matemáticas».',
    },
  },
};

export default es;
