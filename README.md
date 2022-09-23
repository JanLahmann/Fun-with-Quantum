# Fun with Quantum

"Fun with Quantum" is a colletion of Jupyter notebooks that highlight specific aspects of Quantum Computing that are interesting and/or fun.

 1. Quantum Coin Game  
 2. Simple Quantum Implementation for Boolean satisfiability problems 
 3. Even Simpler Quantum Implementation for Boolean satisfiability problems (under development) 
 4. GHZ Game 
 5. GHZ Game on real devices 
 6. Hardy's Paradox (under development)
 7. Mermin-Peres Magic Square (under development)
 
---
### How to execute the Examples in the IBM Quantum Lab
You can run the jupyter notebooks with the different Serious Games in the IBM Quantum Lab without the need for a local software install.
1. Open the Quantum Lab in your browser: https://quantum-computing.ibm.com/
1. If you already have an ID sign in to IBM Quantum.<br/> 
Otherwise, please create an IBMid by clicking `Create an IBM account`, or use one of the other ID options.
1. Launch the Quantum Lab.
1. Create a new file by clicking on the blue button `New file +`.
1. Delete the code from the first cell and enter
```python
!git clone https://github.com/JanLahmann/Fun-with-Quantum
```
6. Execute the cell with `Shift + Enter`. The Fun-with-Quantum Repository will now be cloned in your IBM Quantum Lab.<br/>
To see the new folder `Fun-with-Quantum` in the directory-tree on the left side, close and open the Lab files side menu.
1. Click `Fun-with-Quantum` to enter the new directory.
1. Open the `Readme.ipynb`-file and follow the links to the different examples.

---
### RasQberry: Exploring Quantum Computing and Qiskit with a Raspberry Pi and a 3D Printer

Please have a look at the RasQberry project at https://github.com/JanLahmann/RasQberry.

RasQberry integrates Qiskit, a Raspberry Pi (the full range from Pi 4 down to a Pi Zero) and a 3D printed model of IBM Q System One to explore various state of the art technologies and create a tool that can be used in meetings, meetups, demo booths, etc. A spectrum of Quantum Computing demos and Serious Games for Quantum Computing (that illustrate superposition, interference and entanglement) will being made available on this device for an engaging introduction to Quantum Computing.

---
### 1. Quantum Coin Game 
A quantum coin game that illustrates the power of quantum superposition and interference  - implemented by Jan-R. Lahmann using [Qiskit](https://qiskit.org), [binder](https://mybinder.org) and [RISE](https://rise.readthedocs.io/en/stable/).

Inspired by the TED talk of Shohini Ghose ["Quantum computing explained in 10 minutes"](https://www.ted.com/talks/shohini_ghose_quantum_computing_explained_in_10_minutes) 

View - and play the game online, without any install - in Binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Quantum-Coin-Game.ipynb)

A slightly more current version of this Quantum Coin Game is now part of the official Qiskit Community Tutorials and can be played at http://ibm.biz/QiskitCoinGame

----
### 2. Simple Quantum Implementation for Boolean satisfiability problems

A simple implementation to solve Boolean satisfiability problems ("3SAT) using Qiskit and Grover's Quantum Search Algorithm. The aim is to show how easy such a problem can be solved on a Quantum Computer using Qiskit. To keep it as simple as possible, the theory is not explained in this notebook.

Walk through this demo (and change it if you like) in Binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=3sat.ipynb)

---
### 3. Even Simpler Quantum Implementation for Boolean satisfiability problems (under development)

An even simpler implementation to solve Boolean satisfiability problems ("3SAT) using Qiskit and Grover's Quantum Search Algorithm.

Walk through this demo (and change it if you like) in Binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=3sat-v2.ipynb)

---
### 4. GHZ Game

A quantum game that illustrates the power of quantum entanglement  - implemented by Isabell Heider using [Qiskit](https://qiskit.org) and [binder](https://mybinder.org). 

For an introductions to the GHZ Game, please take a look at the following [presentation](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/GHZGame/GHZ%20Game.pdf) by Jana Foehlisch.

View - and play the game online, without any install - in Binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-Game.ipynb)

---
### 5. GHZ Game on real devices

Analyzing different techniques how to improve the results of playing the GHZ game on real quantum devices - implemented by Lennart Schulze using [Qiskit](https://qiskit.org) and [binder](https://mybinder.org). 

This notebook compares several IBM Quantum devices, explains how to (manually) optimize a circuit for a specific device, how to use the Qiskit transpiler and its optimizations, and discusses Measurement Error Mitigation.

View - and play the game online on real quantum devices, without any install - in Binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-on-Real-Devices.ipynb)

---
### 6. Hardy's Paradox (under development)
A tutorial that discusses a specific version of the Einstein-Podolsky-Rosen (EPR) Paradox  - implemented by Jan-R. Lahmann using [Qiskit](https://qiskit.org), [binder](https://mybinder.org) and [RISE](https://rise.readthedocs.io/en/stable/), based on an idea in a former version of the [Qiskit Textbook](https://qiskit.org/textbook)

View - and play the game online, without any install - in Binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Hardys-Paradox.ipynb) 

---
### 7. Mermin-Peres Magic Square (under development)
A base version of the Mermin-Peres magic square game demonstrating the computational power of quantum computers, which can be further extended to outperform classical machines - extended by Jan-R. Lahmann & David Drexlin with [Qiskit](https://qiskit.org). Based on the Medium article [This Proof Demonstrates a Quantum Advantage, Even for Noisy Quantum Computers](https://medium.com/qiskit/this-proof-demonstrates-a-quantum-advantage-even-for-noisy-quantum-computers-b44a738801ad). 

View - and play the game online, without any install - in Binder: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Mermin–Peres-Game.ipynb)

---
## Usage instructions for the RISE Slideshow Extension
Some of the binder images in this repository automatically launch RISE, a Jupyter/IPython Slideshow Extension.  
Navigation is easy:

1. "Ctrl -" and "Ctrl +" (or "command -", "command +") adjust the zoom level to fit the text to the browser window
* Use "Space" and "Shift Space" to navigate through the slides (right & left arrow keys also work, but might skip some slides)
* "Shift + Enter" executes the interactive cells (might need to click the cell, first)
* Execute the interactive cells on each slide ("In [1]:", etc)
* In case a cell is not formatted correctly, try to double-click and then "Shift Enter" to re-execute
* Interactive cells can be modified, if needed
* "X" at the top left exits the slideshow and enters the jupyter notebook interface

---
### THINK 2021 Lab - Explore Quantum Computing with Serious Games

In this lab, we will give an overview of serious games for quantum computing and use several Quantum Games that make the fundamental concepts of Superposition, Interference and Entanglement tangible and understandable for beginners. In addition, we will use real quantum computers and explore how to mitigate noise and errors.


As a first introduction look at [these slides](https://github.com/JanLahmann/Fun-with-Quantum/blob/master/SeriousGames-for-QuantumComputing.pdf) which provide an Overview about the topic of Serious Games in the area of Quantum Computing.
Then you can go through some of the Serious Games to experience the differences and possibilities that Quantum Computing provides and get a first understanding on how to program todays Quantum Computers and Quantum Simulators:


1. **Quantum Coin Game:** this Game provides an introduction to the concepts of Superposition and Interference. Go ahead and try it out for yourself: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Quantum-Coin-Game.ipynb) (opens as interactive slide show)
2. **GHZ-Game:** in this game you will learn the basics about the concept of Entanglement and experience the effect that it can have based on a simple riddle: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-Game.ipynb) (opens as Jupyter Notebook)
3. **GHZ on real devices:** to go one step further you can now try the GHZ-Game on a real quantum computer device. In this notebook you can experience the influence noise has on todays Quantum Computers and learn the fundamentals about error mitigation: [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-on-Real-Devices.ipynb) (opens as Jupyter Notebook)


---
### IEEE QCE20 Tutorial on "Serious Games for Quantum Computing"

For the [tutorial "Serious Games for Quantum Computing"](https://qce.quantum.ieee.org/tutorials/#tut-lahmann-heider) as part of the IEEE QCE20 conference, please use the following URLs to launch the tutorial notebooks:

Part 2 "Quantum Coin Game": [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=Quantum-Coin-Game.ipynb)

Part 3.1 "GHZ Game": [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-Game.ipynb)  

Part 3.2 "GHZ Game on real devices": [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/JanLahmann/Fun-with-Quantum/master?filepath=GHZ-on-Real-Devices.ipynb)

A recording of the three 1h tutorial sessions ["Serious Games for Quantum Computing"](https://qce.quantum.ieee.org/tutorials/#tut-lahmann-heider) from the [IEEE International Conference on Quantum Computing and Engineering (QCE20)](https://qce.quantum.ieee.org/) are available here: [part 1](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-1), [part 2](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-2), [part 3](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-3). The agenda for the three parts is [here](https://ibm.box.com/v/IEEE-QCE20-QSeriousGames-0).

---
Jan-R. Lahmann, http://twitter.com/JanLahmann

