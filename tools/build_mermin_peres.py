# Generates Mermin-Peres-Game.ipynb (outputs empty, RISE slide metadata). Edit here, then run:
#   python tools/build_mermin_peres.py   (needs nbformat)

import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []
def md(src, slide='slide'):
    c = nbf.v4.new_markdown_cell(src, id=f'cell-{len(cells)}'); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)  # stable ids: rebuilds diff cleanly
def code(src, slide='fragment'):
    c = nbf.v4.new_code_cell(src, id=f'cell-{len(cells)}'); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)

md("""# Mermin–Peres Magic Square

### Win a game that no classical team can win every time

A two-player quiz in which Alice and Bob — kept apart, no phones — fill in a 3×3 square of 0s and 1s.
With ordinary strategies the very best they can do is win 8 out of 9 questions.
Sharing **entangled qubits**, they win **every single round**.

Based on the "magic square" of N. David Mermin and Asher Peres (1990).
Original notebook by David Drexlin & Jan-R. Lahmann (2021), rebuilt in 2026 with [Qiskit](https://www.ibm.com/quantum/qiskit).
Part of [Fun with Quantum](https://fun-with-quantum.org).

(hit space or right arrow to move to the next slide)""")

md("""## Usage instructions for the user interface

* "Space" and "Shift Space" move through the slides; "Ctrl −" and "Ctrl +" (on a Mac "⌘ −" and "⌘ +") fit the text to the window
* "Shift Enter" runs an interactive cell (you may need to click the cell first)
* Run the code cells in order, from the top — the first ones load everything the game needs
* Seeing a `NameError`? A cell was skipped or the kernel restarted: run the code cells from the top again, or use "Kernel → Restart & Run All"
* "X" at the top left leaves the slideshow and shows the plain notebook""")

md("""First we load a few tools. You don't need to understand them — just click into the cell and press "Shift Enter".""")
code("""# tools for the game: Qiskit for the quantum circuits, ipywidgets for the buttons
from itertools import product
import random
from IPython.display import HTML, display
import ipywidgets as widgets
from qiskit import QuantumCircuit
from qiskit.quantum_info import Pauli, Statevector
from qiskit_aer import AerSimulator

simulator = AerSimulator()

def show_square(cells, row=None, col=None, verdict=None):
    \"\"\"Draw a 3x3 square. cells[r][c] is 0, 1 or None (empty).\"\"\"
    rows_html = []
    for r in range(3):
        tds = []
        for c in range(3):
            v = cells[r][c]
            bg = '#ffffff'
            if row is not None and r == row - 1 and col is not None and c == col - 1:
                bg = '#c8f0d0' if verdict else '#f7c6c6' if verdict is not None else '#efe3f7'
            elif row is not None and r == row - 1:
                bg = '#d6eef5'
            elif col is not None and c == col - 1:
                bg = '#f6dbe8'
            tds.append(f'<td style="width:52px;height:52px;text-align:center;font:600 24px monospace;'
                       f'border:2px solid #555;background:{bg};color:#1c1d27">{"" if v is None else v}</td>')
        rows_html.append('<tr>' + ''.join(tds) + '</tr>')
    display(HTML('<table style="border-collapse:collapse;margin:8px 0">' + ''.join(rows_html) + '</table>'))

def magic_square_puzzle():
    # a clickable 3x3 square that checks the row and column rules as you go
    buttons = [[widgets.ToggleButton(value=False, description='0', layout=widgets.Layout(width='52px', height='52px'),
                                     style={'font_size': '20px', 'font_weight': 'bold'})
                for _ in range(3)] for _ in range(3)]
    status = widgets.HTML()
    def update(_=None):
        cells = [[int(buttons[r][c].value) for c in range(3)] for r in range(3)]
        for r in range(3):
            for c in range(3):
                buttons[r][c].description = str(cells[r][c])
        rows_ok = [sum(cells[r]) % 2 == 0 for r in range(3)]
        cols_ok = [sum(cells[r][c] for r in range(3)) % 2 == 1 for c in range(3)]
        tick = lambda ok: '✅' if ok else '❌'
        status.value = ('<b>Columns</b> (odd number of 1s): ' + ' '.join(tick(x) for x in cols_ok) +
                        ' &nbsp; <b>Rows</b> (even number of 1s): ' + ' '.join(tick(x) for x in rows_ok) +
                        (' &nbsp; 🎉 a magic square!' if all(rows_ok + cols_ok) else ''))
    for row in buttons:
        for b in row:
            b.observe(update, 'value')
    update()
    display(widgets.VBox([status] + [widgets.HBox(row) for row in buttons]))  # status first: stays on the slide
    return buttons, status

def play_widget():
    # pick Alice's column and Bob's row, then play one round on the quantum computer (simulator)
    widgets.interact_manual(round_on_screen,
                            col=[('column 1', 1), ('column 2', 2), ('column 3', 3)],
                            row=[('row 1', 1), ('row 2', 2), ('row 3', 3)])

print("Ready.")""")

md("""# The game""")
md("""Alice and Bob are contestants on a quiz show. Before the show they may talk and agree on a strategy — then they are put into **separate rooms** and cannot communicate any more.

The quiz master draws a 3×3 square:

* **Alice** is told a **column** (1, 2 or 3). She fills the three squares of that column with 0s and 1s — with an **odd** number of 1s.
* **Bob** is told a **row** (1, 2 or 3). He fills the three squares of that row with 0s and 1s — with an **even** number of 1s.
* They **win** if they put the **same number** into the one square where Alice's column and Bob's row cross.

Neither knows which row or column the other one got.""", slide='fragment')

md("""## Can you find a magic square?

The easiest strategy: agree beforehand on one complete square in which every column has an odd number of 1s and every row an even number. Then Alice and Bob simply read off their column and row — and always agree.

Click the squares below to toggle between 0 and 1 and try to find one.""")
code("""magic_square_puzzle();""")

md("""## There is no magic square

Count all the 1s in the square in two ways:

* **Column by column:** each column has an odd number of 1s, and odd + odd + odd is **odd**.
* **Row by row:** each row has an even number of 1s, and even + even + even is **even**.

The same number cannot be odd and even at once — so no square fits all six rules. Whatever square Alice and Bob agree on, at least one column or row breaks a rule, and some question will make them lose.""")

md("""## The best classical strategy: 8 out of 9

Alice and Bob can still prepare well: choose answers so that only **one** of the nine column–row questions goes wrong. Let's ask the computer to try **every** possible classical strategy:""")
code("""# every way Alice can answer each column (odd number of 1s) and Bob each row (even number of 1s)
col_answers = [a for a in product((0, 1), repeat=3) if sum(a) % 2 == 1]
row_answers = [b for b in product((0, 1), repeat=3) if sum(b) % 2 == 0]

best, best_strategy = 0, None
for alice in product(col_answers, repeat=3):        # Alice's answer for column 1, 2, 3
    for bob in product(row_answers, repeat=3):      # Bob's answer for row 1, 2, 3
        wins = sum(alice[c][r] == bob[r][c] for c in range(3) for r in range(3))
        if wins > best:
            best, best_strategy = wins, (alice, bob)

print(f"Strategies tried: {len(col_answers) ** 3 * len(row_answers) ** 3}")
print(f"The best one wins {best} of the 9 questions: {best / 9:.1%}")""")
code("""# play 1000 rounds with that best classical strategy
alice, bob = best_strategy
rounds, won = 1000, 0
for _ in range(rounds):
    c, r = random.randrange(3), random.randrange(3)
    won += alice[c][r] == bob[r][c]
print(f"Classical team: {won} of {rounds} rounds won ({won / rounds:.1%})")""")

md("""# The quantum trick""")
md("""Before the show, Alice and Bob create **two entangled pairs of qubits** (Bell pairs). Alice takes one qubit of each pair, Bob the other two. Then they walk into their separate rooms.

Instead of a square of numbers, they agree on a square of **measurements** — things they can measure on their two qubits. Each measurement gives +1 or −1; we write +1 as **0** and −1 as **1**.

| | column 1 | column 2 | column 3 |
|---|---|---|---|
| **row 1** | X ⊗ I | I ⊗ X | X ⊗ X |
| **row 2** | I ⊗ Z | Z ⊗ I | Z ⊗ Z |
| **row 3** | −X ⊗ Z | −Z ⊗ X | Y ⊗ Y |

(X, Y, Z are the basic qubit measurements; "X ⊗ Z" means X on the first qubit and Z on the second.)""")
md("""Why this square is "magic":

* The three measurements in **each column** fit together: they can all be made at once, and their results multiply to **−1** → Alice's column always has an **odd** number of 1s.
* The three measurements in **each row** fit together too, and multiply to **+1** → Bob's row always has an **even** number of 1s.
* Alice and Bob measure the **same** observable on the square where they cross — on **entangled** qubits, so they always get the **same** result.

But we just proved that no such square exists! The next three slides show why the proof does not apply, why Alice and Bob always agree, and how to measure X ⊗ Z on a quantum computer.""", slide='fragment')

md("""## Why doesn't our proof stop the quantum team?

Write the answers as numbers +1 and −1 (0 → +1, 1 → −1). An odd number of 1s means the column multiplies to −1, an even number means the row multiplies to +1. Our proof multiplied all nine numbers twice — column by column (−1) and row by row (+1).

That silently assumes the **order** of multiplication doesn't matter: a·b = b·a. For numbers that's true — they *commute*. For quantum measurements it is not:

* X·Z = −iY, but Z·X = +iY — so **X·Z = −Z·X**.
* Column 3: (X⊗X)·(Z⊗Z)·(Y⊗Y) = (X·Z·Y) ⊗ (X·Z·Y) = (−i·I) ⊗ (−i·I) = **−I⊗I**
* Row 3: (−X⊗Z)·(−Z⊗X)·(Y⊗Y) = (X·Z·Y) ⊗ (Z·X·Y) = (−i·I) ⊗ (+i·I) = **+I⊗I**

The measurements within each column (and within each row) commute, so each player can make their three together. But measurements from different columns and rows, e.g. X⊗I and Z⊗I, do not — so the nine results never exist all at once, and there is no complete square to count.""")
code("""# Qiskit writes Pauli labels right to left (qubit 0 last), so we build them with a helper
def pauli(first, second, sign=''):
    \"\"\"The two-qubit measurement first⊗second (first on qubit 0, second on qubit 1).\"\"\"
    return Pauli(sign + second + first)

def name(P):
    \"\"\"Write a Pauli the way the square does, e.g. −X⊗Z.\"\"\"
    label = P.to_label()                     # e.g. '-ZX' means −X⊗Z
    phase, letters = label[:-2], label[-2:]
    return f"{phase.replace('-', '−')}{letters[1]}⊗{letters[0]}"

SQUARE = [[pauli('X', 'I'), pauli('I', 'X'), pauli('X', 'X')],
          [pauli('I', 'Z'), pauli('Z', 'I'), pauli('Z', 'Z')],
          [pauli('X', 'Z', '-'), pauli('Z', 'X', '-'), pauli('Y', 'Y')]]

X, Z = Pauli('X'), Pauli('Z')
print(f"X·Z = {X.dot(Z).to_label().replace('-', '−')}    Z·X = {Z.dot(X).to_label()}\\n")
for c in range(3):
    col = [SQUARE[r][c] for r in range(3)]
    together = all(P.commutes(Q) for P in col for Q in col)
    print(f"column {c + 1}: {' · '.join(name(P) for P in col)} = {name(col[0].dot(col[1]).dot(col[2]))}"
          f"   (commute: {together})")
for r in range(3):
    row = SQUARE[r]
    together = all(P.commutes(Q) for P in row for Q in row)
    print(f"row {r + 1}:    {' · '.join(name(P) for P in row)} = {name(row[0].dot(row[1]).dot(row[2]))}"
          f"   (commute: {together})")""")

md("""## Why do Alice and Bob always agree?

Each Bell pair is (|00⟩ + |11⟩)/√2. Written in the X basis (|+⟩, |−⟩) and the Y basis (|+i⟩, |−i⟩) it looks just as simple:

(|00⟩ + |11⟩)/√2 = (|++⟩ + |−−⟩)/√2 = (|+i,−i⟩ + |−i,+i⟩)/√2

So when Alice and Bob measure their two qubits of a pair in the **Z** or the **X** basis, they always get the **same** result; in the **Y** basis, always **opposite** results. Perfect correlations in every basis — the pair is *maximally entangled*.

Every square is a product of one measurement on each pair. In −X⊗Z, X on pair 1 agrees, Z on pair 2 agrees, so the products agree (both carry the same minus sign). Y appears only in Y⊗Y: both pairs give opposite results, and the two sign flips cancel.""")
code("""ket = lambda label: Statevector.from_label(label)   # 'r' = |+i⟩, 'l' = |−i⟩
bell = (ket('00') + ket('11')) / 2 ** 0.5
print("(|00⟩ + |11⟩)/√2 = (|++⟩ + |−−⟩)/√2 :", bell == (ket('++') + ket('--')) / 2 ** 0.5)
print("(|00⟩ + |11⟩)/√2 = (|+i,−i⟩ + |−i,+i⟩)/√2 :", bell == (ket('rl') + ket('lr')) / 2 ** 0.5)
print()
for P in 'ZXY':
    product_of_results = bell.expectation_value(Pauli(P + P)).real   # +1: always equal, −1: always opposite
    print(f"{P} on both qubits of a pair: {'always the same' if product_of_results > 0 else 'always opposite'}")""")

md("""## How do you measure X ⊗ Z?

A quantum computer only measures **Z**: it reads each qubit as 0 or 1. To measure anything else, rotate first: applying gates U and then measuring Z is the same as measuring **U†·Z·U**.

* One qubit: H·Z·H = X — apply H, then measure, and you have measured X.
* Two qubits: with U = (H⊗I)·SWAP, U†·(Z⊗I)·U = SWAP·(X⊗I)·SWAP = **I⊗X**, and U†·(I⊗Z)·U = **Z⊗I**.

Each player measures the first two observables of their column or row this way; the third answer follows from the rule (in ±1 numbers: Alice x³ = −x¹·x², Bob y³ = y¹·y²).

| | gates | measures |
|---|---|---|
| Alice, column 1 | U = H⊗I | X⊗I, I⊗Z |
| Alice, column 2 | U = (H⊗I)·SWAP | I⊗X, Z⊗I |
| Alice, column 3 | U = (H⊗I)·CNOT | X⊗X, Z⊗Z |
| Bob, row 1 | V = H⊗H | X⊗I, I⊗X |
| Bob, row 2 | V = SWAP | I⊗Z, Z⊗I |
| Bob, row 3 | V = (H⊗H)·CZ·(Z⊗Z) | −X⊗Z, −Z⊗X |

(Products act right to left: (H⊗I)·SWAP means SWAP first, then H. In row 3 the two Z gates supply the minus signs.)""")

md("""## Building the circuits""")
code("""# the shared entanglement: two Bell pairs (Alice's qubit 0 with Bob's qubit 2, Alice's 1 with Bob's 3)
def shared_entanglement(qc):
    qc.h(0); qc.cx(0, 2)
    qc.h(1); qc.cx(1, 3)

# Alice gets a column: the gates U that turn its first two observables into Z measurements
def alice_gates(qc, col, a=0, b=1):
    if col == 1:   # U = H⊗I           → X⊗I, I⊗Z
        qc.h(a)
    elif col == 2: # U = (H⊗I)·SWAP    → I⊗X, Z⊗I
        qc.swap(a, b); qc.h(a)
    elif col == 3: # U = (H⊗I)·CNOT    → X⊗X, Z⊗Z
        qc.cx(a, b); qc.h(a)

# Bob gets a row: the gates V for his two qubits
def bob_gates(qc, row, a=2, b=3):
    if row == 1:   # V = H⊗H            → X⊗I, I⊗X
        qc.h(a); qc.h(b)
    elif row == 2: # V = SWAP           → I⊗Z, Z⊗I
        qc.swap(a, b)
    elif row == 3: # V = (H⊗H)·CZ·(Z⊗Z) → −X⊗Z, −Z⊗X
        qc.z(a); qc.z(b); qc.cz(a, b); qc.h(a); qc.h(b)

def game_circuit(col, row):
    qc = QuantumCircuit(4, 4)
    shared_entanglement(qc)
    qc.barrier()
    alice_gates(qc, col)
    bob_gates(qc, row)
    qc.measure(range(4), range(4))
    return qc

def answers(bits):
    \"\"\"Alice's column and Bob's row (3 bits each) from the 4 measured bits.\"\"\"
    a1, a2, b1, b2 = bits
    alice = [a1, a2, a1 ^ a2 ^ 1]            # odd number of 1s
    bob = [b1, b2, b1 ^ b2]                  # even number of 1s
    return alice, bob

def play_round(col, row):
    counts = simulator.run(game_circuit(col, row), shots=1).result().get_counts()
    key = next(iter(counts))                 # e.g. '0110' = bits c3 c2 c1 c0
    bits = [int(key[::-1][i]) for i in range(4)]
    alice, bob = answers(bits)
    return alice, bob, alice[row - 1] == bob[col - 1]

def round_on_screen(col=1, row=1):
    alice, bob, win = play_round(col, row)
    grid = [[None] * 3 for _ in range(3)]
    for r in range(3):
        grid[r][col - 1] = alice[r]
    for c in range(3):
        if c != col - 1:
            grid[row - 1][c] = bob[c]
    show_square(grid, row, col, win)
    ones = lambda n: f"{n} one" if n == 1 else f"{n} ones"
    print(f"Alice (column {col}): {alice}  → {ones(sum(alice))}, odd")
    print(f"Bob (row {row}): {bob}  → {ones(sum(bob))}, even")
    print("They agree on the shared square — WIN! 🎉" if win else "They disagree — lost.")""", slide='fragment')
md("""Do the gates really measure the square? Measuring Z after the gates U is measuring U†·Z·U before them — let Qiskit compute it:""", slide='fragment')
code("""for col in (1, 2, 3):
    qc = QuantumCircuit(2); alice_gates(qc, col, 0, 1)
    first, second = pauli('Z', 'I').evolve(qc), pauli('I', 'Z').evolve(qc)   # U†·(Z⊗I)·U, U†·(I⊗Z)·U
    print(f"Alice, column {col}: measures {name(first)}, {name(second)}"
          f"   (square: {name(SQUARE[0][col - 1])}, {name(SQUARE[1][col - 1])})")
for row in (1, 2, 3):
    qc = QuantumCircuit(2); bob_gates(qc, row, 0, 1)
    first, second = pauli('Z', 'I').evolve(qc), pauli('I', 'Z').evolve(qc)
    print(f"Bob, row {row}:       measures {name(first)}, {name(second)}"
          f"   (square: {name(SQUARE[row - 1][0])}, {name(SQUARE[row - 1][1])})")""")
md("""Here is the circuit for column 3 and row 3: the Bell pairs on the left, then Alice's gates on qubits 0–1 and Bob's on qubits 2–3, then the measurements.""", slide='fragment')
code("""game_circuit(3, 3).draw(output='mpl')""")

md("""# Let's play!

Choose the column the quiz master gives Alice and the row Bob gets — then run the round. The colored column is Alice's answer, the colored row is Bob's, and the square where they cross shows whether they agree.

Run it again: the answers change every time (they are random!) — but Alice and Bob always agree.""")
code("""play_widget()""")

md("""## All nine questions, many rounds

The real test: every combination of column and row, 1000 rounds each.""")
code("""results = {}
for col, row in product((1, 2, 3), repeat=2):
    counts = simulator.run(game_circuit(col, row), shots=1000).result().get_counts()
    won = 0
    for key, n in counts.items():
        bits = [int(key[::-1][i]) for i in range(4)]
        alice, bob = answers(bits)
        won += n * (alice[row - 1] == bob[col - 1] and sum(alice) % 2 == 1 and sum(bob) % 2 == 0)
    results[(col, row)] = won / 1000

for row in (1, 2, 3):
    print('   '.join(f"column {col} · row {row}: {results[(col, row)]:.0%}" for col in (1, 2, 3)))
print(f"\\nQuantum team: {sum(results.values()) / 9:.1%} — the best classical team: {8 / 9:.1%}")""")

md("""# What does it mean?

* **No communication** happens: Alice's answers on their own are completely random, and nothing Bob does changes what Alice sees. Still, the answers fit together perfectly — *quantum pseudo-telepathy*.
* **No hidden script** could explain it: a pre-agreed list of answers is exactly a classical strategy, and those top out at 8 of 9. Quantum measurement results are not fixed in advance (the Kochen–Specker theorem).
* On a **real quantum computer**, noise lowers the 100% — the game is a test of how good the hardware is. The [appendix](#appendix) plays it on simulated copies of six IBM quantum computers and, if you like, on a real one.""")
md("""## Learn more

* [The CHSH game](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game) — another nonlocal game, in IBM Quantum Learning's *Basics of quantum information*
* S. Bravyi, D. Gosset, R. König, M. Tomamichel: [Quantum advantage with noisy shallow circuits](https://doi.org/10.1038/s41567-020-0948-z), Nature Physics 16, 1040 (2020), [arXiv:1904.01502](https://arxiv.org/abs/1904.01502) — section II.A describes this game with the same square and circuits. We follow their convention: Alice gets a column, Bob a row. They number columns and rows 01, 10, 11 (two bits) where we write 1, 2, 3, and many other texts swap Alice's and Bob's roles.
* [Quantum pseudo-telepathy](https://en.wikipedia.org/wiki/Quantum_pseudo-telepathy) on Wikipedia — the magic square game and its relatives
* [This Proof Demonstrates a Quantum Advantage, Even for Noisy Quantum Computers](https://medium.com/qiskit/this-proof-demonstrates-a-quantum-advantage-even-for-noisy-quantum-computers-b44a738801ad) — the Qiskit blog post that inspired the first version
* More games: the [Quantum Coin Game](Quantum-Coin-Game.ipynb) and the [GHZ Game](GHZ-Game.ipynb)""", slide='fragment')

md("""# Appendix: the magic square on a real quantum computer<a name="appendix"></a>

On a perfect simulator the quantum team wins every round. Real quantum computers make errors — and the classical team's 8 of 9 (88.9%) is a high bar: the quantum team beats it only if noise costs it fewer than one round in nine.

This appendix plays the game on **fake backends** from `qiskit-ibm-runtime`: simulators that copy a real IBM quantum computer — its qubits, their connections and its gates — and add noise taken from a calibration snapshot of that device (the date is printed below). They imitate the device roughly as it was on that day, with a simplified noise model; you need no account. The last slide runs the same code on a real IBM quantum computer.

[GHZ on Real Devices](GHZ-on-Real-Devices.ipynb) tells the longer story of noise, qubit placement and error mitigation with the GHZ Game.""")
code("""# tools for the noisy experiments
from functools import reduce
import numpy as np
import pandas as pd
from qiskit.transpiler import generate_preset_pass_manager
from qiskit_ibm_runtime.fake_provider import FakeYorktownV2, FakeAthensV2, FakeBrisbane, FakeTorino, FakeFez, FakeMarrakesh

SHOTS = 4000   # rounds per question
SEED = 1990    # fixed seeds: running the notebook again gives the same numbers
QUESTIONS = list(product((1, 2, 3), repeat=2))   # (column, row) — all nine questions

def win_rate(col, row, counts):
    \"\"\"Share of the rounds won, from counts (or probabilities) of the 4 measured bits.\"\"\"
    won = 0
    for key, n in counts.items():
        alice, bob = answers([int(key[::-1][i]) for i in range(4)])
        won += n * (alice[row - 1] == bob[col - 1])
    return won / sum(counts.values())

_simulators = {}
def simulate(backend, circuits, shots=SHOTS):
    \"\"\"Run circuits on the fake backend's noisy simulator; returns one counts dict per circuit.\"\"\"
    if backend.name not in _simulators:
        _simulators[backend.name] = AerSimulator.from_backend(backend, seed_simulator=SEED)
    result = _simulators[backend.name].run(circuits, shots=shots).result()
    return [result.get_counts(i) for i in range(len(circuits))]

def transpile_game(backend, level=2):
    \"\"\"The nine game circuits, prepared by the transpiler for the backend.\"\"\"
    pm = generate_preset_pass_manager(optimization_level=level, backend=backend, seed_transpiler=SEED)
    return [pm.run(game_circuit(col, row)) for col, row in QUESTIONS]

def measured_qubits(circuit):
    \"\"\"The physical qubits that hold the 4 answer bits (Alice's 2, Bob's 2) when they are measured.\"\"\"
    return tuple(circuit.layout.final_index_layout())

def two_qubit_gates(circuit):
    return sum(1 for inst in circuit.data if inst.operation.num_qubits == 2 and inst.operation.name not in ('barrier', 'measure'))

# --- readout error mitigation, one qubit at a time ---------------------------------------------
def calibration_circuits(backend, qubits):
    \"\"\"Two circuits: all the given physical qubits in 0, then all in 1, and measure them.\"\"\"
    pm = generate_preset_pass_manager(optimization_level=0, backend=backend, initial_layout=list(qubits))
    circuits = []
    for value in (0, 1):
        qc = QuantumCircuit(len(qubits), len(qubits))
        if value:
            qc.x(range(len(qubits)))
        qc.measure(range(len(qubits)), range(len(qubits)))
        circuits.append(pm.run(qc))
    return circuits

def readout_matrices(counts_0, counts_1, qubits):
    \"\"\"For each qubit the 2×2 matrix M[m, k] = probability to read m when k was prepared.\"\"\"
    M = {}
    for i, q in enumerate(qubits):
        read_1 = lambda counts: sum(n for key, n in counts.items() if key[::-1][i] == '1') / sum(counts.values())
        M[q] = np.array([[1 - read_1(counts_0), 1 - read_1(counts_1)],
                         [read_1(counts_0), read_1(counts_1)]])
    return M

def mitigate(counts, qubits, M):
    \"\"\"Undo the readout errors of the 4 measured qubits: solve A · p = measured, A = M ⊗ M ⊗ M ⊗ M.\"\"\"
    A = reduce(np.kron, [M[q] for q in reversed(qubits)])   # bit 3 is the leftmost in '0110'
    measured = np.zeros(16)
    for key, n in counts.items():
        measured[int(key, 2)] = n / sum(counts.values())
    p = np.clip(np.linalg.solve(A, measured), 0, None)      # remove small negative values
    return {f'{k:04b}': x for k, x in enumerate(p / p.sum())}

# --- one complete experiment: all nine questions -------------------------------------------------
def play(backend, level=2, run=simulate, shots=SHOTS):
    \"\"\"Play all nine questions; returns the win rate, the mitigated one, and the two-qubit gates per question.\"\"\"
    circuits = transpile_game(backend, level)
    qubits = sorted({q for c in circuits for q in measured_qubits(c)})
    counts = run(backend, circuits + calibration_circuits(backend, qubits), shots=shots)
    M = readout_matrices(counts[9], counts[10], qubits)
    return {'win rate': np.mean([win_rate(col, row, c) for (col, row), c in zip(QUESTIONS, counts)]),
            'mitigated': np.mean([win_rate(col, row, mitigate(c, measured_qubits(circ), M))
                                  for (col, row), c, circ in zip(QUESTIONS, counts, circuits)]),
            'two-qubit gates': [two_qubit_gates(c) for c in circuits]}

def snapshot(backend):
    return backend.properties().last_update_date.strftime('%Y-%m-%d')

pct = lambda x: f"{x:.1%}"
print("Ready.")""")

md("""## Six noisy quantum computers

Two small 5-qubit devices from the early years of IBM's quantum cloud, and four large ones: ibm_brisbane with an Eagle processor, ibm_torino, ibm_fez and ibm_marrakesh with Heron processors. The transpiler prepares the circuits with optimization level 2 (more on that on the next slides). This takes a few minutes:""")
code("""backends = [FakeYorktownV2(), FakeAthensV2(), FakeBrisbane(), FakeTorino(), FakeFez(), FakeMarrakesh()]
results = {b.name: play(b) for b in backends}

pd.DataFrame([{'device': b.name, 'qubits': b.num_qubits, 'snapshot': snapshot(b),
               'win rate': pct(results[b.name]['win rate']),
               'beats 8 of 9?': 'yes' if results[b.name]['win rate'] > 8 / 9 else 'no'} for b in backends])""")
md("""Noise costs the quantum team rounds everywhere. Whether it still beats the best classical team depends on the device: roughly, the newer the processor, the clearer the lead.""", slide='fragment')

md("""## Four qubits in a square

The game needs two-qubit gates between four pairs of qubits: the two Bell pairs (Alice's qubit 0 with Bob's 2, Alice's 1 with Bob's 3), Alice's gate in column 3 (qubits 0, 1) and Bob's in row 3 (qubits 2, 3). These four connections form a **square** — and none of the six devices has four qubits connected in a square (IBM's large processors use a *heavy-hex* pattern). So for column 3 · row 3 the transpiler must add a SWAP: three more two-qubit gates.

The SWAPs in column 2 and row 2 are different: we wrote them into the circuit ourselves, and a SWAP only relabels the two qubits. Before choosing physical qubits, the transpiler drops them and keeps track of the relabeling — the H after Alice's SWAP simply acts on the other qubit, and the measured bits are sorted back at the end (the `ElidePermutations` pass, from optimization level 2 on). The SWAP for column 3 · row 3 is added later, when the circuit is fitted to the chip, and must stay.

Two-qubit gates per question on `fake_torino` — level 2 below, and all levels with their win rates:""")
code("""gates = results['fake_torino']['two-qubit gates']
print(pd.DataFrame([[gates[3 * (c - 1) + (r - 1)] for c in (1, 2, 3)] for r in (1, 2, 3)],
                   index=['row 1', 'row 2', 'row 3'], columns=['column 1', 'column 2', 'column 3']), '\\n')

torino = FakeTorino()
rows = []
for level in range(4):
    r = results['fake_torino'] if level == 2 else play(torino, level=level)
    rows.append({'level': level, 'two-qubit gates (all 9)': sum(r['two-qubit gates']), 'win rate': pct(r['win rate'])})
pd.DataFrame(rows)""")
md("""Level 0 puts the four circuit qubits on physical qubits 0–3, whatever their quality and connections. From level 1 on, the transpiler looks for connected qubits and uses the calibration data to choose good ones.""", slide='fragment')

md("""## Readout error mitigation

Much of the loss happens at the very end: the measurement sometimes reports 1 for a 0, or the other way round. **Readout error mitigation** measures how often that happens and corrects the results:

1. **Calibrate:** two extra circuits put all the qubits we use into 0, then all into 1, and measure them. For each qubit this gives a 2×2 matrix: how often it reads 0 or 1 when it was prepared in 0 or 1.
2. **Correct:** for the four qubits of a question, the 16×16 matrix A = M ⊗ M ⊗ M ⊗ M (one M per qubit) turns the probabilities before readout into the measured ones. Solving A · p = measured estimates the probabilities before readout.

Building A from one matrix per qubit assumes that each qubit's readout errors don't depend on the others — that keeps the calibration at two circuits, however many qubits we use. ([GHZ on Real Devices](GHZ-on-Real-Devices.ipynb) calibrates all 2ⁿ states instead.)

The calibration circuits already ran with the game, so here are the results:""")
code("""pd.DataFrame([{'device': b.name, 'win rate': pct(results[b.name]['win rate']),
               'with mitigation': pct(results[b.name]['mitigated']),
               'mitigated estimate beats 8 of 9?': 'yes' if results[b.name]['mitigated'] > 8 / 9 else 'no'} for b in backends])""")
md("""Mitigation wins back nearly all the rounds that readout errors cost, but not the others: errors in the gates (and, on real hardware, decoherence while the qubits wait) remain. And the result is a corrected *estimate* of the win rate, not a list of better rounds.

A strict test of quantum pseudo-telepathy counts only the rounds actually played — the raw win rate — and has to beat 88.9% by more than the statistical uncertainty of the experiment. The mitigated rate tells you how good the quantum computer is apart from its readout.""", slide='fragment')

md("""## Run it on a real quantum computer

The same experiment — nine game circuits and two calibration circuits — runs on a real IBM quantum computer with the **Sampler** from `qiskit-ibm-runtime`.

1. Create a free account on [IBM Quantum Platform](https://quantum.cloud.ibm.com) (Open Plan: up to 10 minutes of quantum computer time per 28 days) and copy your API key from the dashboard.
2. Set `RUN_ON_HARDWARE = True` below and run the cell. It asks for your API key; the key is used for this session only and not saved.
3. Your job waits in a queue with everyone else's; this can take minutes or longer. With 4000 shots for each of the 11 circuits, the experiment uses well under a minute of quantum computer time.

**Keep your API key private:** don't type it into a notebook you share, and don't save it on a shared machine such as a public Binder session.

With `RUN_ON_HARDWARE = False`, the cell runs the same code on `fake_fez`.""")
code("""RUN_ON_HARDWARE = False

try:
    from qiskit_ibm_runtime.executor_sampler import Sampler   # qiskit-ibm-runtime 0.50 and newer
except ImportError:
    from qiskit_ibm_runtime import SamplerV2 as Sampler       # older versions

def sampler_run(backend, circuits, shots):
    \"\"\"Run circuits with the Sampler from qiskit-ibm-runtime (on hardware, or locally on a fake backend).\"\"\"
    sampler = Sampler(mode=backend)
    if not RUN_ON_HARDWARE:
        sampler.options.simulator.seed_simulator = SEED   # the same numbers every time on fake_fez
    job = sampler.run(circuits, shots=shots)
    print(f"job {job.job_id()} sent to {backend.name}, waiting for the result …")
    return [getattr(r.data, c.cregs[0].name).get_counts() for c, r in zip(circuits, job.result())]

if RUN_ON_HARDWARE:
    from getpass import getpass
    from qiskit_ibm_runtime import QiskitRuntimeService
    service = QiskitRuntimeService(channel="ibm_quantum_platform", token=getpass("IBM Quantum API key: "))
    real_backend = service.least_busy(operational=True, simulator=False)
else:
    real_backend = FakeFez()

r = play(real_backend, run=sampler_run)
print(f"{real_backend.name}: win rate {pct(r['win rate'])} → mitigated {pct(r['mitigated'])}   (best classical team: {8 / 9:.1%})")""")
md("""On a real device the result changes from run to run and from day to day. Does your quantum computer beat 8 of 9?

*Thank you for playing!*""", slide='fragment')

nb.cells = cells
nb.metadata = {
    'kernelspec': {'display_name': 'Python 3 (ipykernel)', 'language': 'python', 'name': 'python3'},
    'language_info': {'name': 'python'},
    'rise': {'autolaunch': True, 'scroll': True},
}
import pathlib
nbf.write(nb, pathlib.Path(__file__).resolve().parent.parent / 'Mermin-Peres-Game.ipynb')
print('written', len(cells), 'cells')
