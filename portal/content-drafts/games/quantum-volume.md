---
title: Quantum Volume
tagline: Measure how powerful a quantum computer really is.
concept: Benchmarking quantum hardware
icon: "📊"
order: 7
duration: ~20 min
audience: developers
# Plain notebook (no RISE) — QuBins prebuilt image is fine.
binderUrl: https://qubins.org/launch/?image=2.1-xl&repo=https%3A%2F%2Fgithub.com%2FJanLahmann%2FFun-with-Quantum&branch=master&path=QuantumVolume.ipynb
notebook: QuantumVolume.ipynb
---

Qubit count alone says little about a quantum computer — connectivity, gate fidelity, and
crosstalk matter just as much. **Quantum Volume** is IBM's single-number benchmark that captures
all of them at once: the largest random circuit of equal width and depth a device can run
successfully.

This notebook generates quantum volume circuits, runs them, and evaluates the heavy-output
statistics that decide whether a device passes. You'll come away knowing exactly what a
"Quantum Volume of 128" claim does — and doesn't — mean.
