# Generates Mermin-Peres-Game.ipynb (outputs empty, RISE slide metadata). Edit here, then run:
#   python tools/build_mermin_peres.py   (needs nbformat)

import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []
def md(src, slide='slide'):
    c = nbf.v4.new_markdown_cell(src); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)
def code(src, slide='fragment'):
    c = nbf.v4.new_code_cell(src); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)

md("""# The Mermin–Peres Magic Square

### Win a game that no classical team can win every time

A two-player quiz in which Alice and Bob — kept apart, no phones — fill in a 3×3 square of 0s and 1s.
With ordinary strategies the very best they can do is win 8 out of 9 questions.
Sharing **entangled qubits**, they win **every single round**.

Based on the "magic square" of N. David Mermin and Asher Peres (1990).
Original notebook by David Drexlin & Jan-R. Lahmann (2021), rebuilt in 2026 with [Qiskit](https://www.ibm.com/quantum/qiskit).
Part of [Fun with Quantum](https://fun-with-quantum.org).

(hit space or right arrow to move to the next slide)""")

md("""## Usage instructions for the user interface

* "Space" and "Shift Space" move through the slides
* "Shift Enter" runs an interactive cell (you may need to click the cell first)
* Run the cells on each slide in order — the first code cell loads everything else
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

Choose the column the quiz master gives Alice and the row Bob gets — then run the round. The coloured column is Alice's answer, the coloured row is Bob's, and the square where they cross shows whether they agree.

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
* On a **real quantum computer**, noise lowers the 100% somewhat — the game is a test of how good the hardware is. Our [GHZ Game on real devices](GHZ-on-Real-Devices.ipynb) shows how to run such a game on IBM Quantum hardware.""")
md("""## Learn more

* [The CHSH game](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game) — another nonlocal game, in IBM Quantum Learning's *Basics of quantum information*
* S. Bravyi, D. Gosset, R. König, M. Tomamichel: [Quantum advantage with noisy shallow circuits](https://arxiv.org/abs/1904.01502), Nature Physics (2020) — section II.A describes this game with the same square and circuits. We follow their convention: Alice gets a column, Bob a row. They number columns and rows 01, 10, 11 (two bits) where we write 1, 2, 3, and many other texts swap Alice's and Bob's roles.
* [Quantum pseudo-telepathy](https://en.wikipedia.org/wiki/Quantum_pseudo-telepathy) on Wikipedia — the magic square game and its relatives
* [This Proof Demonstrates a Quantum Advantage, Even for Noisy Quantum Computers](https://medium.com/qiskit/this-proof-demonstrates-a-quantum-advantage-even-for-noisy-quantum-computers-b44a738801ad) — the Qiskit blog post that inspired the first version
* More games: the [Quantum Coin Game](Quantum-Coin-Game.ipynb) and the [GHZ Game](GHZ-Game.ipynb)""", slide='fragment')

nb.cells = cells
nb.metadata = {
    'kernelspec': {'display_name': 'Python 3 (ipykernel)', 'language': 'python', 'name': 'python3'},
    'language_info': {'name': 'python'},
    'rise': {'autolaunch': True, 'scroll': True},
}
import pathlib
nbf.write(nb, pathlib.Path(__file__).resolve().parent.parent / 'Mermin-Peres-Game.ipynb')
print('written', len(cells), 'cells')
