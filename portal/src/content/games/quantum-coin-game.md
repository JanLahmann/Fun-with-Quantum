---
title: Quantum Coin Game
tagline: Beat a quantum computer at coin flipping — and find out why you never had a chance.
concept: Superposition & interference
icon: "🪙"
order: 1
duration: ~5 min
audience: everyone — no prerequisites
# Own-repo Binder env (notebook<7 + classic RISE): the only combo where the
# slideshow AND the ipywidgets dropdowns (the actual gameplay) both work.
# jupyterlab-rise doesn't render ipywidgets>=8 (jupyterlab-contrib/rise#119),
# so the QuBins ui=rise launch shows widgets as text. Switch back to
# https://qubins.org/launch/?image=2.1-xl&...&ui=rise once that's fixed.
binderUrl: https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Quantum-Coin-Game.ipynb
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
