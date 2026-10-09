---
title: The Quantum Prisoner's Dilemma
tagline: Entanglement makes cooperation pay — for a restricted set of moves. Then comes the catch.
concept: Quantum game theory
icon: "🤝"
order: 6
duration: ~15 min
audience: students, game-theory fans
# RISE slideshow with ipywidgets, like the Coin and GHZ games → the classic-RISE image.
binderUrl: https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Prisoners-Dilemma.ipynb&ui=rise-classic
notebook: Prisoners-Dilemma.ipynb
---

Two players each choose to cooperate or defect. Defecting pays more whatever the other does, so
rational players both defect and get 1 point each — although cooperating would give both 3.

In the quantum version of Eisert, Wilkens and Lewenstein (1999), a referee entangles the players'
qubits, and a new quantum move Q turns (Q, Q) into an equilibrium worth 3 each: the dilemma
disappears. The notebook builds the game in Qiskit, maps the payoffs and searches for equilibria —
and then shows the catch found by Benjamin and Hayden (2001): with every one-qubit move allowed,
each move has a counter, so equilibria exist only with random (mixed) strategies — for example
both players choosing completely at random, worth 2.25 points each.
