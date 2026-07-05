const talks = [
  {
    year: '2021',
    title: 'IBM THINK 2021 Lab — "Explore Quantum Computing with Serious Games"',
    text: 'Hands-on lab using the Quantum Coin Game, GHZ Game, and GHZ on real devices to make superposition, interference, and entanglement tangible.',
    links: [
      {
        href: 'https://github.com/JanLahmann/Fun-with-Quantum/blob/master/SeriousGames-for-QuantumComputing.pdf',
        label: 'Slides (PDF)',
      },
    ],
  },
  {
    year: '2020',
    title: 'IEEE QCE20 Tutorial — "Serious Games for Quantum Computing"',
    text: 'Three one-hour tutorial sessions at the IEEE International Conference on Quantum Computing and Engineering.',
    links: [
      { href: 'https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-0', label: 'Agenda' },
      { href: 'https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-1', label: 'Recording 1' },
      { href: 'https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-2', label: 'Recording 2' },
      { href: 'https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-3', label: 'Recording 3' },
    ],
  },
  {
    year: '2020',
    title: 'Linux Magazine article — Quantum Coin Game',
    text: 'The Quantum Coin Game as a hands-on introduction to Qiskit, with all code examples as an interactive notebook.',
    links: [
      {
        href: 'https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Codebeispiele-Linux-Magazin.ipynb',
        label: 'Code examples on Binder',
      },
    ],
  },
];
      <h2 class="talks-title">Talks &amp; press archive</h2>
      <div class="talks">
        {talks.map((t) => (
          <div class="talk card">
            <span class="meta">{t.year}</span>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
            <div class="talk-links">
              {t.links.map((l) => <a href={l.href}>{l.label} ↗</a>)}
            </div>
          </div>
        ))}
      </div>


<!-- Parked 2026-07-05 (Jan: 'talks & press is not that impressive; I'd skip that for now. But keep the idea.')
     Planned upgrades before re-adding: photo of Angela Merkel holding a RasQberry,
     photo with Ginni Rometty. Restore the talks array + section into about.astro. -->
