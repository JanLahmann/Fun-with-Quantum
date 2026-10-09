---
title: Quantum Coin Game
tagline: Beat a quantum computer at coin flipping — and find out why you never had a chance.
concept: Superposition & interference
shows: "superposition, interference"
icon: "🪙"
order: 1
duration: ~20 min
audience: everyone — no prerequisites
# QuBins classic-RISE launch (2.1-xl-rise = nbclassic + classic RISE): the
# only env where the slideshow AND the ipywidgets dropdowns (the actual
# gameplay) both work — jupyterlab-rise doesn't render ipywidgets>=8
# (jupyterlab-contrib/rise#119). Once that's fixed upstream, switch to the
# Lab presenter (image=2.1-xl&...&ui=rise) and retire the rise-classic flavor.
binderUrl: https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Quantum-Coin-Game.ipynb&ui=rise-classic
notebook: Quantum-Coin-Game.ipynb
featured: true
webGame: true
---

You and a quantum computer take turns flipping a coin — without looking at it. If it shows heads
at the end, the quantum computer wins. Play a few rounds and you'll notice something unsettling:
you lose. Every time.

The trick is that the quantum computer doesn't flip the coin, it puts it into **superposition** —
heads and tails at once. Whatever you do on your turn, its second move uses
**interference** to steer the coin back to heads with certainty. The game is a gentle
introduction to superposition and interference, two effects that quantum algorithms rely on.

In the notebook, two players make the moves: first with ordinary coin moves only, then player A
gets the quantum H move. You see the circuit for the moves, run it on a simulator, try your own
gate sequences, and follow the short calculation that shows why A wins every time
with two H moves.
