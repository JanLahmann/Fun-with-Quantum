---
title: GHZ Game
tagline: Win a game as a team that no classical strategy can win — using entanglement.
concept: Entanglement (GHZ states)
icon: "🔗"
order: 2
duration: ~10 min
audience: curious minds, workshop groups
# RISE slideshow — must launch in this repo's own Binder env (notebook<7 + rise);
# the QuBins images don't ship RISE yet. Switch back to a QuBins launch link once
# jupyterlab-rise lands in the xl images.
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
