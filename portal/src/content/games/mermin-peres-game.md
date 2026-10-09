---
title: Mermin–Peres Magic Square
tagline: A 3×3 square game that no classical team wins every round — quantum teamwork always does.
concept: Quantum contextuality
shows: "entanglement beats every classical team"
icon: "🎩"
order: 4
duration: ~25 min
audience: puzzle lovers, students
level: Intermediate
prerequisites: "Entanglement (the GHZ or CHSH Game) helps"
goals:
  - "Prove that no 3×3 square of 0s and 1s meets all six parity rules, so a classical team wins at most 8 of 9 questions"
  - "See how two shared Bell pairs and a square of Pauli measurements win every round"
  - "Explain why the proof fails for quantum measurements: they don't commute (contextuality)"
# RISE slideshow with ipywidgets, like the Coin and GHZ games → the classic-RISE image.
binderUrl: https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Mermin-Peres-Game.ipynb&ui=rise-classic
notebook: Mermin-Peres-Game.ipynb
---

Two separated players fill in a 3×3 grid with 0s and 1s — one player a row, the other a column.
The parity rules are chosen so that no pre-agreed table of answers can satisfy them all: a short
proof shows that the best classical team wins 8 of the 9 possible questions. With two shared
pairs of entangled qubits, the quantum team **always** wins.

The magic square is a clean demonstration of **contextuality**: measurement outcomes in
quantum mechanics cannot be explained by a table of values written down in advance, independent of
which other measurements are made alongside — the measurement's context. The notebook lets you
try classical strategies first, then hands you the quantum one. An appendix plays the game on
simulated copies of six IBM quantum computers, where noise costs the quantum team some rounds, and,
with a free IBM Quantum account, on a real one.
