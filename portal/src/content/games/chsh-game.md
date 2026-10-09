---
title: The CHSH Game
tagline: The Bell test behind the 2022 Nobel Prize — 75% for any classical team, 85.4% with entanglement.
concept: Bell test, entanglement
icon: "🔔"
order: 3
webGame: true
duration: ~25 min
audience: students, curious minds
# RISE slideshow with ipywidgets, like the Coin and GHZ games → the classic-RISE image.
binderUrl: https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=CHSH-Game.ipynb&ui=rise-classic
notebook: CHSH-Game.ipynb
---

Alice and Bob each get a random bit and answer with a bit, without talking. They win if their
answers are the same — unless both got a 1, then they must differ. No classical strategy wins
more than **75%** of the rounds: a short parity argument shows that every table of answers
loses at least one question.

Sharing one pair of entangled qubits and measuring along well-chosen angles, they win
**85.4%** — cos²(22.5°), the most quantum mechanics allows (Tsirelson's bound). Unlike the GHZ
game and the magic square, the quantum team still loses some rounds: the advantage shows in the
statistics, exactly as in the real Bell tests honored by the 2022 Nobel Prize. The notebook lets
you try all 16 classical tables, turn the measurement angles yourself, and see why 75% and 85.4%
are the limits.
