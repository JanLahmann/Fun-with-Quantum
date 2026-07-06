---
title: GHZ Game
tagline: Win a game as a team that no classical strategy can win — using entanglement.
concept: Entanglement (GHZ states)
icon: "🔗"
order: 2
duration: ~10 min
audience: curious minds, workshop groups
# Own-repo Binder env (notebook<7 + classic RISE): the only combo where the
# slideshow AND the ipywidgets dropdowns (the actual gameplay) both work.
# jupyterlab-rise doesn't render ipywidgets>=8 (jupyterlab-contrib/rise#119),
# so the QuBins ui=rise launch shows widgets as text. Switch back to
# https://qubins.org/launch/?image=2.1-xl&...&ui=rise once that's fixed.
binderUrl: https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-Game.ipynb
notebook: GHZ-Game.ipynb
---

Three players — Alice, Bob, and you — each receive a question and must answer without
communicating. The rules are set up so that the best classical team strategy wins at most 75%
of the rounds. Sharing three **entangled qubits** in a GHZ state, your team wins **every single
round**.

This is not a trick and not statistics: it's a game-shaped version of the experiments that ruled
out "hidden variables" as an explanation of quantum mechanics. The notebook walks you through
playing the game, building the GHZ state with a few gates, and checking that the quantum
strategy really is unbeatable.
