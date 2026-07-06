---
title: GHZ Game
tagline: Win a game as a team that no classical strategy can win — using entanglement.
concept: Entanglement (GHZ states)
icon: "🔗"
order: 2
duration: ~10 min
audience: curious minds, workshop groups
# QuBins prebuilt image (no mybinder rebuilds, warm cache), landing in the
# jupyterlab-rise standalone presenter (/rise/<nb> — whole tab is the slideshow,
# no Lab chrome). Direct mybinder URL because qubins.org/launch/ only emits
# lab/tree paths today; switch to a qubins.org link once launch.js gains ui=rise.
binderUrl: https://mybinder.org/v2/gh/QuBins/qiskit-images/2.1-xl?urlpath=git-pull%3Frepo%3Dhttps%253A%252F%252Fgithub.com%252FJanLahmann%252FFun-with-Quantum%26branch%3Dmaster%26urlpath%3Drise%252FFun-with-Quantum%252FGHZ-Game.ipynb
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
