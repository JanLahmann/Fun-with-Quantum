---
title: Quantum Coin Game
tagline: Beat a quantum computer at coin flipping — and find out why you never had a chance.
concept: Superposition & interference
icon: "🪙"
order: 1
duration: ~5 min
audience: everyone — no prerequisites
# QuBins prebuilt image (no mybinder rebuilds, warm cache), landing in the
# jupyterlab-rise standalone presenter (/rise/<nb> — whole tab is the slideshow,
# no Lab chrome). Direct mybinder URL because qubins.org/launch/ only emits
# lab/tree paths today; switch to a qubins.org link once launch.js gains ui=rise.
binderUrl: https://mybinder.org/v2/gh/QuBins/qiskit-images/2.1-xl?urlpath=git-pull%3Frepo%3Dhttps%253A%252F%252Fgithub.com%252FJanLahmann%252FFun-with-Quantum%26branch%3Dmaster%26urlpath%3Drise%252FFun-with-Quantum%252FQuantum-Coin-Game.ipynb
notebook: Quantum-Coin-Game.ipynb
featured: true
---

You and a quantum computer take turns flipping a coin — without looking at it. If it shows heads
at the end, the quantum computer wins. Play a few rounds and you'll notice something unsettling:
you lose. Almost every time.

The trick is that the quantum computer doesn't flip the coin, it puts it into **superposition** —
a state that is neither heads nor tails. Whatever you do on your turn, its second move uses
**interference** to steer the coin back to heads with certainty. The game is the friendliest
possible introduction to the two effects that make quantum computers tick.

The notebook lets you play interactively, then lifts the curtain: you see the quantum circuit
behind each move, run it on a simulator, and can modify the strategy to convince yourself there
is no way to win.
