---
title: 3-SAT with Grover's Algorithm
tagline: Watch a quantum computer find the needle in the haystack — quadratically faster.
concept: Grover's search algorithm
icon: "🧩"
order: 4
duration: ~15 min
audience: developers, students
# QuBins prebuilt image; ui=rise lands in the jupyterlab-rise standalone
# presenter — whole tab is the slideshow.
binderUrl: https://qubins.org/launch/?image=2.1-xl&repo=https%3A%2F%2Fgithub.com%2FJanLahmann%2FFun-with-Quantum&branch=master&path=3sat-v2.ipynb&ui=rise
notebook: 3sat-v2.ipynb
---

Satisfiability — finding an assignment of true/false values that makes a logical formula true —
is the archetypal hard search problem. This notebook takes a small **3-SAT** instance and solves
it with **Grover's algorithm**, the quantum search routine that finds a marked item among N
possibilities in roughly √N steps instead of N.

You'll see the problem encoded as a phase oracle, watch amplitude amplification concentrate
probability on the solutions, and read the answer off a histogram. It's the clearest small
example of a quantum algorithm doing something measurably better than brute force.
