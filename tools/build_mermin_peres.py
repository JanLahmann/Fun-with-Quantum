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
        status.value = ('<b>Rows</b> (even number of 1s): ' + ' '.join(tick(x) for x in rows_ok) +
                        ' &nbsp; <b>Columns</b> (odd number of 1s): ' + ' '.join(tick(x) for x in cols_ok) +
                        (' &nbsp; 🎉 a magic square!' if all(rows_ok + cols_ok) else ''))
    for row in buttons:
        for b in row:
            b.observe(update, 'value')
    update()
    display(widgets.VBox([status] + [widgets.HBox(row) for row in buttons]))  # status first: stays on the slide
    return buttons, status

def play_widget():
    # pick Alice's row and Bob's column, then play one round on the quantum computer (simulator)
    widgets.interact_manual(round_on_screen,
                            row=[('row 1', 1), ('row 2', 2), ('row 3', 3)],
                            col=[('column 1', 1), ('column 2', 2), ('column 3', 3)])

print("Ready.")""")

md("""# The game""")
md("""Alice and Bob are contestants on a quiz show. Before the show they may talk and agree on a strategy — then they are put into **separate rooms** and cannot communicate any more.

The quiz master draws a 3×3 square:

* **Alice** is told a **row** (1, 2 or 3). She fills her three squares of that row with 0s and 1s — with an **even** number of 1s.
* **Bob** is told a **column** (1, 2 or 3). He fills his three squares of that column with 0s and 1s — with an **odd** number of 1s.
* They **win** if they put the **same number** into the one square where Alice's row and Bob's column cross.

Neither knows which column or row the other one got.""", slide='fragment')

md("""## Can you find a magic square?

The easiest strategy: agree beforehand on one complete square in which every row has an even number of 1s and every column an odd number. Then Alice and Bob simply read off their row and column — and always agree.

Click the squares below to toggle between 0 and 1 and try to find one.""")
code("""magic_square_puzzle();""")

md("""## There is no magic square

Count all the 1s in the square in two ways:

* **Row by row:** each row has an even number of 1s, and even + even + even is **even**.
* **Column by column:** each column has an odd number of 1s, and odd + odd + odd is **odd**.

The same number cannot be even and odd at once — so no square fits all six rules. Whatever square Alice and Bob agree on, at least one row or column breaks a rule, and some question will make them lose.""")

md("""## The best classical strategy: 8 out of 9

Alice and Bob can still prepare well: choose answers so that only **one** of the nine row–column questions goes wrong. Let's ask the computer to try **every** possible classical strategy:""")
code("""# every way Alice can answer each row (even number of 1s) and Bob each column (odd number of 1s)
row_answers = [a for a in product((0, 1), repeat=3) if sum(a) % 2 == 0]
col_answers = [b for b in product((0, 1), repeat=3) if sum(b) % 2 == 1]

best, best_strategy = 0, None
for alice in product(row_answers, repeat=3):        # Alice's answer for row 1, 2, 3
    for bob in product(col_answers, repeat=3):      # Bob's answer for column 1, 2, 3
        wins = sum(alice[r][c] == bob[c][r] for r in range(3) for c in range(3))
        if wins > best:
            best, best_strategy = wins, (alice, bob)

print(f"Strategies tried: {len(row_answers) ** 3 * len(col_answers) ** 3}")
print(f"The best one wins {best} of the 9 questions: {best / 9:.1%}")""")
code("""# play 1000 rounds with that best classical strategy
alice, bob = best_strategy
rounds, won = 1000, 0
for _ in range(rounds):
    r, c = random.randrange(3), random.randrange(3)
    won += alice[r][c] == bob[c][r]
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

* The three measurements in **each row** fit together: they can all be made at once, and their results multiply to **+1** → Alice's row always has an **even** number of 1s.
* The three measurements in **each column** fit together too, and multiply to **−1** → Bob's column always has an **odd** number of 1s.
* Alice and Bob measure the **same** observable on the square where they cross — on **entangled** qubits, so they always get the **same** result.

For numbers this is impossible (we just proved it). For quantum measurements it works, because the order of measurements matters: X and Z do not commute.""", slide='fragment')

md("""## Building the circuits

Each player turns their row or column into a circuit: a few gates that rotate the qubits so the first two measurements of that row or column become ordinary Z measurements. The third answer follows from the parity rule.""")
code("""# the shared entanglement: Bell pairs (Alice's qubit 0 with Bob's qubit 2, Alice's 1 with Bob's 3)
def shared_entanglement(qc):
    qc.h(0); qc.cx(0, 2)
    qc.h(1); qc.cx(1, 3)

# Alice gets a row: measure its first two observables (the third is fixed by the parity)
def alice_measures(qc, row):
    if row == 1:   # X⊗I, I⊗X
        qc.h(0); qc.h(1)
    elif row == 2: # I⊗Z, Z⊗I
        qc.swap(0, 1)
    elif row == 3: # −X⊗Z, −Z⊗X
        qc.cz(0, 1); qc.h(0); qc.h(1)
    qc.measure(0, 0); qc.measure(1, 1)

# Bob gets a column: same idea on his two qubits
def bob_measures(qc, col):
    if col == 1:   # X⊗I, I⊗Z
        qc.h(2)
    elif col == 2: # I⊗X, Z⊗I
        qc.swap(2, 3); qc.h(2)
    elif col == 3: # X⊗X, Z⊗Z
        qc.cx(2, 3); qc.h(2)
    qc.measure(2, 2); qc.measure(3, 3)

def game_circuit(row, col):
    qc = QuantumCircuit(4, 4)
    shared_entanglement(qc)
    qc.barrier()
    alice_measures(qc, row)
    bob_measures(qc, col)
    return qc

SIGN = [[+1, +1, +1], [+1, +1, +1], [-1, -1, +1]]  # the minus signs in row 3

def answers(bits, row, col):
    \"\"\"Alice's row and Bob's column (3 bits each) from the 4 measured bits.\"\"\"
    a0, a1, b0, b1 = bits
    alice = [a0 ^ (SIGN[row - 1][0] < 0), a1 ^ (SIGN[row - 1][1] < 0)]
    alice.append(alice[0] ^ alice[1])        # even number of 1s
    bob = [b0 ^ (SIGN[0][col - 1] < 0), b1 ^ (SIGN[1][col - 1] < 0)]
    bob.append(bob[0] ^ bob[1] ^ 1)          # odd number of 1s
    return [int(x) for x in alice], [int(x) for x in bob]

def play_round(row, col):
    counts = simulator.run(game_circuit(row, col), shots=1).result().get_counts()
    key = next(iter(counts))                 # e.g. '0110' = bits c3 c2 c1 c0
    bits = [int(key[::-1][i]) for i in range(4)]
    alice, bob = answers(bits, row, col)
    return alice, bob, alice[col - 1] == bob[row - 1]

def round_on_screen(row=1, col=1):
    alice, bob, win = play_round(row, col)
    grid = [[None] * 3 for _ in range(3)]
    for c in range(3):
        grid[row - 1][c] = alice[c]
    for r in range(3):
        if r != row - 1:
            grid[r][col - 1] = bob[r]
    show_square(grid, row, col, win)
    ones = lambda n: f"{n} one" if n == 1 else f"{n} ones"
    print(f"Alice (row {row}): {alice}  → {ones(sum(alice))}, even")
    print(f"Bob (column {col}): {bob}  → {ones(sum(bob))}, odd")
    print("They agree on the shared square — WIN! 🎉" if win else "They disagree — lost.")""")
md("""Here is the circuit for row 3 and column 3: the Bell pairs on the left, then Alice's gates on qubits 0–1 and Bob's on qubits 2–3, then the measurements.""", slide='fragment')
code("""game_circuit(3, 3).draw(output='mpl')""")

md("""# Let's play!

Choose the row the quiz master gives Alice and the column Bob gets — then run the round. The coloured row is Alice's answer, the coloured column is Bob's, and the square where they cross shows whether they agree.

Run it again: the answers change every time (they are random!) — but Alice and Bob always agree.""")
code("""play_widget()""")

md("""## All nine questions, many rounds

The real test: every combination of row and column, 1000 rounds each.""")
code("""results = {}
for row, col in product((1, 2, 3), repeat=2):
    counts = simulator.run(game_circuit(row, col), shots=1000).result().get_counts()
    won = 0
    for key, n in counts.items():
        bits = [int(key[::-1][i]) for i in range(4)]
        alice, bob = answers(bits, row, col)
        won += n * (alice[col - 1] == bob[row - 1] and sum(alice) % 2 == 0 and sum(bob) % 2 == 1)
    results[(row, col)] = won / 1000

for row in (1, 2, 3):
    print('   '.join(f"row {row} · col {col}: {results[(row, col)]:.0%}" for col in (1, 2, 3)))
print(f"\\nQuantum team: {sum(results.values()) / 9:.1%} — the best classical team: {8 / 9:.1%}")""")

md("""# What does it mean?

* **No communication** happens: Alice's answers on their own are completely random, and nothing Bob does changes what Alice sees. Still, the answers fit together perfectly — *quantum pseudo-telepathy*.
* **No hidden script** could explain it: a pre-agreed list of answers is exactly a classical strategy, and those top out at 8 of 9. Quantum measurement results are not fixed in advance (the Kochen–Specker theorem).
* On a **real quantum computer**, noise lowers the 100% somewhat — the game is a test of how good the hardware is. Our [GHZ Game on real devices](GHZ-on-Real-Devices.ipynb) shows how to run such a game on IBM Quantum hardware.""")
md("""## Learn more

* [The CHSH game](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game) — another nonlocal game, in IBM Quantum Learning's *Basics of quantum information*
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
