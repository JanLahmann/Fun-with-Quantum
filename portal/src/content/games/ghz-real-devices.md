---
title: GHZ on Real Quantum Devices
tagline: Take the GHZ Game from the simulator to real IBM Quantum hardware.
concept: Error mitigation, transpiler optimization
icon: "📡"
order: 6
duration: ~20 min
audience: developers
binderUrl: https://qubins.org/launch/?image=latest-xl&repo=https%3A%2F%2Fgithub.com%2FJanLahmann%2FFun-with-Quantum&branch=master&path=GHZ-on-Real-Devices.ipynb
notebook: GHZ-on-Real-Devices.ipynb
---

Simulators are perfect; real quantum computers are not. This notebook re-runs the GHZ Game on
actual IBM Quantum hardware and confronts the noise head-on: readout errors, decoherence, and
what the **transpiler** does to your circuit before it ever reaches the chip.

You'll compare raw hardware results against the ideal distribution, then apply **error
mitigation** to recover most of the quantum advantage. It's a realistic first encounter with the
craft of making today's noisy devices useful.
