---
title: Quantum Coin Game
tagline: Beat a quantum computer at coin flipping — and find out why you never had a chance.
concept: Superposition & interference
icon: "🪙"
order: 1
duration: ~5 min
audience: everyone — no prerequisites
# QuBins classic-RISE launch (2.1-xl-rise = nbclassic + classic RISE): the
# only env where the slideshow AND the ipywidgets dropdowns (the actual
# gameplay) both work — jupyterlab-rise doesn't render ipywidgets>=8
# (jupyterlab-contrib/rise#119). Once that's fixed upstream, switch to the
# Lab presenter (image=2.1-xl&...&ui=rise) and retire the rise-classic flavor.
binderUrl: https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Quantum-Coin-Game.ipynb&ui=rise-classic
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
