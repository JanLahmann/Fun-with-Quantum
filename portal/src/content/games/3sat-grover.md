---
title: 3-SAT with Grover's Algorithm
tagline: Watch Grover's search find the needle in the haystack — in about √N steps instead of N.
concept: Grover's search algorithm
shows: "Grover search, Boolean satisfiability (3-SAT)"
icon: "🧩"
order: 7
duration: ~15 min
audience: developers, students
# QuBins classic-RISE launch (2.1-xl-rise = nbclassic + classic RISE);
# jupyterlab-rise doesn't render ipywidgets>=8 (jupyterlab-contrib/rise#119).
# Once fixed upstream, switch to image=2.1-xl&...&ui=rise (Lab presenter).
binderUrl: https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=3sat.ipynb&ui=rise-classic
notebook: 3sat.ipynb
---

Satisfiability — finding an assignment of true/false values that makes a logical formula true —
is the classic example of a problem that is easy to check but hard to solve. This notebook takes
a party guest-list puzzle and a small **3-SAT** problem and solves them with **Grover's algorithm**, the quantum search routine that finds a marked item among N
possibilities in roughly √N steps instead of N.

You'll see the problem encoded as a phase oracle, watch amplitude amplification concentrate
probability on the solutions, and read the answer off a histogram. A small, clear
example of a quantum algorithm that needs fewer oracle calls than trying every assignment — though
real SAT solvers are much smarter than brute force.
