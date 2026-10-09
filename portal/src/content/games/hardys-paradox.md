---
title: Hardy's Paradox
tagline: Three facts that hold every time rule out one outcome — which happens anyway.
concept: Nonlocality without inequalities
shows: "three certain facts, one impossible outcome — that happens anyway"
icon: "🌀"
order: 5
duration: ~20 min
audience: puzzle lovers
# QuBins classic-RISE launch (2.1-xl-rise = nbclassic + classic RISE);
# jupyterlab-rise doesn't render ipywidgets>=8 (jupyterlab-contrib/rise#119).
# Once fixed upstream, switch to image=2.1-xl&...&ui=rise (Lab presenter).
binderUrl: https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Hardys-Paradox.ipynb&ui=rise-classic
notebook: Hardys-Paradox.ipynb
---

Two cars leave a factory; far apart, two inspectors each check a car's color or its engine. Three
facts hold every single time, and by simple logic they rule out two diesel cars. Any classical
spec sheets — even random ones — obey that logic: two diesels **0%** of the time.

Quantum cars, two entangled qubits, keep all three facts. Yet when both inspectors check the
engine, both cars are diesel 1 time in 12 — and up to **(5√5 − 11)/2 ≈ 9%** with the best
measurement angle, the most quantum mechanics allows. The notebook lets you try every spec sheet, builds the quantum factory in Qiskit, shows the
faulty step in the logic ("unperformed experiments have no results") and finds the 9% maximum.
