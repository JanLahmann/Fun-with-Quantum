---
title: 3-SAT with Grover's Algorithm
tagline: Watch a quantum computer find the needle in the haystack — quadratically faster.
concept: Grover's search algorithm
icon: "🧩"
order: 4
duration: ~15 min
audience: developers, students
# QuBins prebuilt image, landing in the jupyterlab-rise standalone presenter
# (/rise/<nb>). Direct mybinder URL because qubins.org/launch/ only emits
# lab/tree paths today; switch to a qubins.org link once launch.js gains ui=rise.
binderUrl: https://mybinder.org/v2/gh/QuBins/qiskit-images/2.1-xl?urlpath=git-pull%3Frepo%3Dhttps%253A%252F%252Fgithub.com%252FJanLahmann%252FFun-with-Quantum%26branch%3Dmaster%26urlpath%3Drise%252FFun-with-Quantum%252F3sat-v2.ipynb
notebook: 3sat-v2.ipynb
---

Satisfiability — finding an assignment of true/false values that makes a logical formula true —
is the archetypal hard search problem. This notebook takes a small **3-SAT** instance and solves
it with **Grover's algorithm**, the quantum search routine that finds a marked item among N
possibilities in roughly √N steps instead of N.

You'll see the problem encoded as a phase oracle, watch amplitude amplification concentrate
probability on the solutions, and read the answer off a histogram. It's the clearest small
example of a quantum algorithm doing something measurably better than brute force.
