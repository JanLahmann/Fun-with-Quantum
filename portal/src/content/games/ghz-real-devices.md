---
title: GHZ on Real Quantum Devices
tagline: Play the GHZ Game on noisy copies of IBM quantum computers — and win back most of the rounds the noise costs you.
concept: Error mitigation, transpiler optimization
shows: "noise, transpiler, readout error mitigation"
icon: "📡"
order: 8
duration: ~25 min
audience: developers
level: Advanced
prerequisites: "The GHZ Game; Python and Qiskit"
goals:
  - "See how noise on simulated IBM quantum computers costs the quantum team rounds"
  - "Choose good qubits, by hand and with the transpiler"
  - "Correct readout errors with readout error mitigation, and know its limits"
binderUrl: https://qubins.org/launch/?image=2.1-xl&repo=https%3A%2F%2Fgithub.com%2FJanLahmann%2FFun-with-Quantum&branch=master&path=GHZ-on-Real-Devices.ipynb
notebook: GHZ-on-Real-Devices.ipynb
---

Simulators are perfect; real quantum computers are not. This notebook plays the GHZ Game on
simulated copies of six IBM quantum computers — fake backends that add the noise measured in a
calibration snapshot of each device — and confronts the noise head-on: gate errors, readout
errors, and what the **transpiler** does to your circuit before it reaches the chip.

On bad qubits the quantum team barely beats a classical one — or falls to guessing. You'll pick better qubits by hand
and with the transpiler, then correct the readout errors with **readout error mitigation** to win
back most of the lost rounds. An appendix runs the same experiment on a real IBM quantum computer
(free IBM Quantum Platform account). A realistic first encounter with the craft of making today's
noisy devices useful.
