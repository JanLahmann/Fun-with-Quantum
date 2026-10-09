# Fun with Quantum

Quantum computing taught through games: Jupyter notebooks, written with [Qiskit](https://www.ibm.com/quantum/qiskit), in which superposition, interference and entanglement are the tricks that win the game. Play first, then open the curtain and see the circuit.

More games, and the family of projects around them: **[fun-with-quantum.org](https://fun-with-quantum.org)**.

## Play

| Game | What it shows | Launch |
|---|---|---|
| 1. [Quantum Coin Game](#1-quantum-coin-game) | superposition, interference | [▶ Open](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Quantum-Coin-Game.ipynb&ui=rise-classic) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Quantum-Coin-Game.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Quantum-Coin-Game.ipynb) |
| 2. [GHZ Game](#2-ghz-game) | entanglement | [▶ Open](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=GHZ-Game.ipynb&ui=rise-classic) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-Game.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/GHZ-Game.ipynb) |
| 3. [CHSH Game](#3-chsh-game) | the Bell test: 85% with entanglement, 75% without | [▶ Open](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=CHSH-Game.ipynb&ui=rise-classic) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=CHSH-Game.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/CHSH-Game.ipynb) |
| 4. [Mermin–Peres Magic Square](#4-merminperes-magic-square) | entanglement beats every classical team | [▶ Open](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Mermin-Peres-Game.ipynb&ui=rise-classic) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Mermin-Peres-Game.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Mermin-Peres-Game.ipynb) |
| 5. [Hardy's Paradox](#5-hardys-paradox) | three certain facts, one impossible outcome — that happens anyway | [▶ Open](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Hardys-Paradox.ipynb&ui=rise-classic) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Hardys-Paradox.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Hardys-Paradox.ipynb) |
| 6. [Quantum Prisoner's Dilemma](#6-quantum-prisoners-dilemma) | quantum game theory — and its catch | [▶ Open](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Prisoners-Dilemma.ipynb&ui=rise-classic) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Prisoners-Dilemma.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Prisoners-Dilemma.ipynb) |
| 7. [Logic puzzles with Grover's search](#7-logic-puzzles-with-grovers-search) | Grover search, Boolean satisfiability (3-SAT) | [▶ Open](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=3sat.ipynb&ui=rise-classic) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=3sat.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/3sat.ipynb) |
| 8. [GHZ Game on noisy quantum computers](#8-ghz-game-on-noisy-quantum-computers) | noise, transpiler, readout error mitigation | [▶ Open](https://qubins.org/launch/?image=2.1-xl&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=GHZ-on-Real-Devices.ipynb) · [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-on-Real-Devices.ipynb) · [View](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/GHZ-on-Real-Devices.ipynb) |

**▶ Open** starts a free Jupyter session on [mybinder.org](https://mybinder.org) through [QuBins](https://qubins.org), with Qiskit preinstalled — no install, no account. Starting it can take a few minutes. Games 1–7 open as slideshows ([how to use them](#slideshow-controls)); game 8 opens as a regular notebook. **Binder** builds this repository's own environment instead, which can take longer. **View** shows the notebook on GitHub without running it.

---
### 1. Quantum Coin Game
A quantum coin game that illustrates the power of quantum superposition and interference — two players take turns turning a hidden coin or leaving it as it is, and the player who may also use a Hadamard gate can win every time. Implemented by Jan-R. Lahmann using Qiskit, binder and [RISE](https://rise.readthedocs.io/).

Inspired by the TED talk of Shohini Ghose ["Quantum computing explained in 10 minutes"](https://www.ted.com/talks/shohini_ghose_quantum_computing_explained_in_10_minutes). The math behind the game: [these charts](QuantumTheory-for-QuantumCoinGame.pdf).

Play it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Quantum-Coin-Game.ipynb&ui=rise-classic) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Quantum-Coin-Game.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Quantum-Coin-Game.ipynb)

---
### 2. GHZ Game
A quantum game that illustrates the power of quantum entanglement: three players answer questions about colors and shapes without talking. No classical team wins every round; sharing three entangled qubits in a GHZ state, they always do. Implemented by Isabell Heider using Qiskit.

For an introduction to the GHZ Game, take a look at this [presentation](GHZGame/GHZ%20Game.pdf) by Jana Foehlisch.

Play it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=GHZ-Game.ipynb&ui=rise-classic) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-Game.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/GHZ-Game.ipynb)

---
### 3. CHSH Game
The best-known nonlocal game and the Bell test behind the 2022 Nobel Prize in Physics. Alice and Bob each get a random bit and answer with a bit, without talking; they win if their answers differ exactly when both bits are 1. No classical strategy wins more than 75% of the rounds; sharing one entangled qubit pair and measuring along well-chosen angles, they win cos²(22.5°) ≈ 85.4% — the most quantum mechanics allows (Tsirelson's bound). The notebook tries all 16 classical tables, plays the quantum strategy in Qiskit, lets you turn the measurement angles yourself, and shows why 75% and 85.4% are the limits. Based on Clauser, Horne, Shimony and Holt (1969); see also IBM Quantum Learning's [CHSH game lesson](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game). Notebook by Jan-R. Lahmann (2026), generated by `tools/build_chsh.py`.

Play it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=CHSH-Game.ipynb&ui=rise-classic) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=CHSH-Game.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/CHSH-Game.ipynb)

---
### 4. Mermin–Peres Magic Square
Alice and Bob, in separate rooms, each fill in one row or column of a 3×3 square of 0s and 1s under parity rules that no square of numbers can satisfy — the best classical team wins 8 of 9 questions. Sharing two entangled qubit pairs, they win every round. The notebook lets you hunt for a magic square yourself, brute-forces every classical strategy, then builds and runs the quantum circuits for all nine questions. Original version by David Drexlin & Jan-R. Lahmann (2021), rebuilt in 2026 with Qiskit (generated by `tools/build_mermin_peres.py`); inspired by the Qiskit blog post [This Proof Demonstrates a Quantum Advantage, Even for Noisy Quantum Computers](https://medium.com/qiskit/this-proof-demonstrates-a-quantum-advantage-even-for-noisy-quantum-computers-b44a738801ad).

Play it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Mermin-Peres-Game.ipynb&ui=rise-classic) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Mermin-Peres-Game.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Mermin-Peres-Game.ipynb)

---
### 5. Hardy's Paradox
Two cars leave a factory; far apart, two inspectors each check a car's color or its engine. Three facts hold every single time — and by simple logic they rule out two diesel cars. Classical cars (any spec sheets, even random ones) obey that logic; quantum cars — two entangled qubits — still come out both diesel 1 time in 12, and up to (5√5 − 11)/2 ≈ 9% with the best measurement angle. The notebook tries all classical spec sheets, builds the quantum factory in Qiskit, shows where the logic fails ("unperformed experiments have no results") and finds the 9% maximum. Based on Lucien Hardy (1992, 1993) and a former chapter of the Qiskit Textbook. Original version by Jan-R. Lahmann (2020) and Bengt Wegner (2022), rebuilt in 2026 (generated by `tools/build_hardy.py`).

Play it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Hardys-Paradox.ipynb&ui=rise-classic) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Hardys-Paradox.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Hardys-Paradox.ipynb)

---
### 6. Quantum Prisoner's Dilemma
The classic dilemma of game theory: defecting pays more whatever the other player does, so rational players end at 1 point each instead of 3. In the quantum version of Eisert, Wilkens and Lewenstein (1999), a referee entangles the players' qubits and a new quantum move Q makes (Q, Q) an equilibrium worth 3 each — the dilemma disappears. The notebook builds the game in Qiskit, maps the payoffs and searches for equilibria — and then shows the catch found by Benjamin and Hayden (2001): with every one-qubit move allowed, each move has a counter, so equilibria exist only with random (mixed) strategies — for example both players choosing completely at random, worth 2.25 points each. Notebook by Jan-R. Lahmann (2026), generated by `tools/build_pd.py`.

Play it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Prisoners-Dilemma.ipynb&ui=rise-classic) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Prisoners-Dilemma.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/Prisoners-Dilemma.ipynb)

---
### 7. Logic puzzles with Grover's search
Starts with the whole quantum program — the formula plus seven lines of Qiskit — then builds Grover's quantum search algorithm step by step from Qiskit 2 building blocks and uses it on two puzzles: a party guest list that keeps everybody happy, and a classic 3-SAT formula given in DIMACS format. Explains oracle, diffuser and the √N speed-up, checks the answers classically, and lets you enter your own puzzle. (Rebuilt in 2026 from two Qiskit Aqua–era notebooks, which it replaces; generated by `tools/build_3sat.py`.)

Try it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl-rise&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=3sat.ipynb&ui=rise-classic) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=3sat.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/3sat.ipynb)

---
### 8. GHZ Game on noisy quantum computers
How noise costs the quantum team rounds of the GHZ game, and how to win them back. The notebook plays the game on simulated copies of six IBM quantum computers (fake backends with noise from a calibration snapshot of each device), chooses good qubits by hand and with the Qiskit transpiler, and corrects readout errors with a calibration matrix. An appendix runs the same experiment on a real IBM quantum computer (free IBM Quantum Platform account). Implemented by Lennart Schulze and Jan-R. Lahmann (2020), rebuilt for Qiskit 2.x in 2026 (generated by `tools/build_ghz_real.py`).

Run it: [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=GHZ-on-Real-Devices.ipynb) · fallback: [Binder](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-on-Real-Devices.ipynb) · [view the notebook](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/GHZ-on-Real-Devices.ipynb)

---
## More notebooks

* [QuantumVolume.ipynb](QuantumVolume.ipynb) — run Quantum Volume experiments with Qiskit Experiments, on a simulator or a noisy copy of a real device. [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=QuantumVolume.ipynb)
* [Codebeispiele-Linux-Magazin.ipynb](Codebeispiele-Linux-Magazin.ipynb) — **came here from Linux-Magazin?** These are the code examples of the article (German), updated for Qiskit 2.x. [▶ Open on QuBins](https://qubins.org/launch/?image=2.1-xl&repo=https://github.com/JanLahmann/Fun-with-Quantum&branch=master&path=Codebeispiele-Linux-Magazin.ipynb)
* [Readme.ipynb](Readme.ipynb) — an index of the notebooks, to open inside Jupyter.

## Run it on your own computer

```bash
git clone https://github.com/JanLahmann/Fun-with-Quantum
cd Fun-with-Quantum
conda env create -f environment.yml   # Python 3.11, Qiskit 2.x, classic Notebook + RISE
conda activate Qiskitenv
jupyter notebook
```

## Slideshow controls

The games open as [RISE](https://rise.readthedocs.io/) slideshows:
* "Space" and "Shift Space" move through the slides (the arrow keys also work, but might skip some slides)
* "Shift Enter" runs an interactive cell (you might need to click the cell first); run the cells on each slide in order
* "Ctrl -" and "Ctrl +" (or "Cmd -", "Cmd +") adjust the zoom to fit the slides to the window
* If a cell is not formatted correctly, double-click it and press "Shift Enter" again
* "X" at the top left leaves the slideshow and shows the plain notebook

## RasQberry

A sister project: RasQberry, a Raspberry Pi–based model of a quantum computer for meetups, classrooms and demo booths — see [RasQberry Two](https://rasqberry.org) and the original [RasQberry](https://github.com/JanLahmann/RasQberry).

---
## Past events

### THINK 2021 Lab — Explore Quantum Computing with Serious Games
An overview of serious games for quantum computing, using several quantum games that make superposition, interference and entanglement tangible for beginners, and a first look at noise and error mitigation on real quantum computers. Start with [these slides](SeriousGames-for-QuantumComputing.pdf), then play the [Quantum Coin Game](#1-quantum-coin-game), the [GHZ Game](#2-ghz-game) and the [GHZ Game on noisy quantum computers](#8-ghz-game-on-noisy-quantum-computers).

### IEEE QCE20 Tutorial "Serious Games for Quantum Computing"
The [tutorial](https://qce.quantum.ieee.org/tutorials/#tut-lahmann-heider) at the IEEE International Conference on Quantum Computing and Engineering (QCE20) used the [Quantum Coin Game](#1-quantum-coin-game) (part 2), the [GHZ Game](#2-ghz-game) (part 3.1) and the [GHZ Game on noisy quantum computers](#8-ghz-game-on-noisy-quantum-computers) (part 3.2). Recordings of the three one-hour sessions: [part 1](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-1), [part 2](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-2), [part 3](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-3); the [agenda](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-0).

---
Jan-R. Lahmann, https://www.linkedin.com/in/JanLahmann


<!-- FWQ-FAMILY:START format=list — generated from family.json in JanLahmann/Fun-with-Quantum, do not edit by hand -->
## Part of the Fun with Quantum family

These games are the home of [**Fun with Quantum**](https://fun-with-quantum.org), a family of open-source quantum outreach projects: [RasQberry Two](https://rasqberry.org) · [RasQberry One](https://rasqberry.one) · [Quantego](https://quantego.org) · [Qutie](https://qutie.org) · [Qoffee-Maker](https://qoffee-maker.org) · [Entangible](https://entangible.org) · [CertiQ](https://certiq.dev) · [QuBins](https://qubins.org) · [doQumentation](https://doqumentation.org) · [QAMPoser](https://qamposer.org).

*God does play dice. Come play, build, learn.*
<!-- FWQ-FAMILY:END -->
