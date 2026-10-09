# Generates CHSH-Game.ipynb (outputs empty, RISE slide metadata). Edit here, then run:
#   python tools/build_chsh.py   (needs nbformat)

import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []
def md(src, slide='slide'):
    c = nbf.v4.new_markdown_cell(src, id=f'cell-{len(cells)}'); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)  # stable ids: rebuilds diff cleanly
def code(src, slide='fragment'):
    c = nbf.v4.new_code_cell(src, id=f'cell-{len(cells)}'); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)

md("""# The CHSH Game

### The Bell test behind the 2022 Nobel Prize — as a game

Alice and Bob — kept apart, no phones — each get a random bit and answer with a bit.
No classical strategy wins more than **75%** of the rounds.
Sharing one pair of **entangled qubits**, they win **85.4%** — and nothing in quantum mechanics does better.

Based on Clauser, Horne, Shimony and Holt (1969); studied as a nonlocal game by Cleve, Høyer, Toner and Watrous (2004).
Notebook by Jan-R. Lahmann (2026), built with [Qiskit](https://www.ibm.com/quantum/qiskit).
Part of [Fun with Quantum](https://fun-with-quantum.org).

(hit space or right arrow to move to the next slide)""")

md("""## Usage instructions for the user interface

* "Space" and "Shift Space" move through the slides; "Ctrl −" and "Ctrl +" (on a Mac "⌘ −" and "⌘ +") fit the text to the window
* "Shift Enter" runs an interactive cell (you may need to click the cell first)
* Run the code cells in order, from the top — the first ones load everything the game needs
* Seeing a `NameError`? A cell was skipped or the kernel restarted: run the code cells from the top again, or use "Kernel → Restart & Run All"
* "X" at the top left leaves the slideshow and shows the plain notebook""")

md("""First we load a few tools. You don't need to understand them — just click into the cell and press "Shift Enter".""")
code("""# tools for the game: Qiskit for the quantum circuits, ipywidgets for the buttons, matplotlib for pictures
from itertools import product
from collections import Counter
import random
import numpy as np
import matplotlib.pyplot as plt
from IPython.display import HTML, display
import ipywidgets as widgets
from qiskit import QuantumCircuit
from qiskit.quantum_info import SparsePauliOp, Statevector
from qiskit_aer import AerSimulator

simulator = AerSimulator()
QUESTIONS = [(0, 0), (0, 1), (1, 0), (1, 1)]

def wins(x, y, a, b):
    \"\"\"The rule of the game: a XOR b must equal x AND y.\"\"\"
    return (a ^ b) == (x & y)

def need(x, y):
    return 'different answers' if x & y else 'same answer'

def table_widget():
    # four buttons: Alice's answer to x = 0 and x = 1, Bob's to y = 0 and y = 1
    labels = ['Alice, if x = 0', 'Alice, if x = 1', 'Bob, if y = 0', 'Bob, if y = 1']
    buttons = [widgets.ToggleButton(value=False, description=f'{l}: answer 0', layout=widgets.Layout(width='200px'))
               for l in labels]
    status = widgets.HTML()
    def update(_=None):
        a = [int(buttons[0].value), int(buttons[1].value)]
        b = [int(buttons[2].value), int(buttons[3].value)]
        for btn, l, v in zip(buttons, labels, a + b):
            btn.description = f'{l}: answer {v}'
        rows = ''.join(f'<tr><td>x = {x}, y = {y}</td><td>{need(x, y)}</td><td>a = {a[x]}, b = {b[y]}</td>'
                       f'<td>{"✅" if wins(x, y, a[x], b[y]) else "❌"}</td></tr>' for x, y in QUESTIONS)
        won = sum(wins(x, y, a[x], b[y]) for x, y in QUESTIONS)
        status.value = (f'<table style="font-family:monospace">{rows}</table>'
                        f'<b>Your table wins {won} of 4 questions ({won * 25}%).</b>')
    for btn in buttons:
        btn.observe(update, 'value')
    update()
    display(widgets.VBox([status, widgets.HBox(buttons[:2]), widgets.HBox(buttons[2:])]))

def draw_circle(alice, bob):
    \"\"\"The Bloch circle (x–z plane) with Alice's two arrows (blue) and Bob's two (magenta).\"\"\"
    fig, ax = plt.subplots(figsize=(4.2, 4.2))
    ax.add_patch(plt.Circle((0, 0), 1, fill=False, color='grey'))
    ax.axhline(0, color='lightgrey', lw=0.8, ls='--'); ax.axvline(0, color='lightgrey', lw=0.8, ls='--')
    for text, (x, y) in {'|0⟩': (-0.3, 1.05), '|1⟩': (0.06, -1.16), '|+⟩': (1.06, -0.26), '|−⟩': (-1.25, -0.12)}.items():
        ax.text(x, y, text, color='grey', fontsize=11)
    for who, angles, color, r in (('A', alice, '#1192e8', 1.18), ('B', bob, '#d02670', 1.36)):
        for q, deg in enumerate(angles):
            t = np.radians(deg)
            ax.annotate('', xy=(np.sin(t), np.cos(t)), xytext=(0, 0), arrowprops=dict(arrowstyle='-|>', color=color, lw=2.5))
            ax.text(r * np.sin(t), r * np.cos(t), f'{who}{q}', color=color, ha='center', va='center', fontweight='bold')
    ax.set_xlim(-1.55, 1.55); ax.set_ylim(-1.55, 1.55); ax.set_aspect('equal'); ax.axis('off')
    plt.show()

print("Ready.")""")

md("""# The game""")
md("""Alice and Bob are contestants on a quiz show. Before the show they may talk and agree on a strategy — then they are put into **separate rooms** and cannot communicate any more.

* The quiz master gives **Alice** a random bit **x** and **Bob** a random bit **y**.
* Each answers with a bit: Alice **a**, Bob **b**.
* They **win** if **a ⊕ b = x · y** (⊕ is XOR: 1 if the bits differ).

In words: they must give the **same answer** — unless both got a 1; then they must give **different answers**.

| question | x = 0, y = 0 | x = 0, y = 1 | x = 1, y = 0 | x = 1, y = 1 |
|---|---|---|---|---|
| they need | same | same | same | **different** |

Neither knows the other's question.""", slide='fragment')

md("""## Play classically

A classical strategy is a table: what Alice answers to x = 0 and to x = 1, what Bob answers to y = 0 and to y = 1. Click the buttons to build a table — can you find one that wins all four questions?""")
code("""table_widget()""")

md("""## Try all 16 tables

There are only 2 × 2 × 2 × 2 = 16 tables. Let the computer try them all:""")
code("""score = {}
for a0, a1, b0, b1 in product((0, 1), repeat=4):
    alice, bob = (a0, a1), (b0, b1)
    score[(alice, bob)] = sum(wins(x, y, alice[x], bob[y]) for x, y in QUESTIONS)

for won, how_many in sorted(Counter(score.values()).items(), reverse=True):
    print(f"{how_many} tables win {won} of the 4 questions ({won * 25}%)")""")

md("""## Why no table wins all four

Write a₀ for Alice's answer to x = 0, a₁ to x = 1, and b₀, b₁ for Bob's. Winning every question needs

a₀ ⊕ b₀ = 0, &nbsp; a₀ ⊕ b₁ = 0, &nbsp; a₁ ⊕ b₀ = 0, &nbsp; a₁ ⊕ b₁ = 1

Combine all four left sides with ⊕: each of a₀, a₁, b₀, b₁ appears twice, and anything ⊕ itself is 0 — so they give **0**. The right sides give 0 ⊕ 0 ⊕ 0 ⊕ 1 = **1**. Since 0 ≠ 1, an odd number of the four equations must fail: every table loses 1 or 3 questions. The best tables win 3 of 4: **75%**.

Rolling dice doesn't help: a random strategy is a random choice among the tables, and none of them beats 75%.""")
code("""# play 1000 rounds with the simplest best table: both always answer 0
won = 0
for _ in range(1000):
    x, y = random.randint(0, 1), random.randint(0, 1)
    won += wins(x, y, 0, 0)
print(f"Classical team: {won} of 1000 rounds won ({won / 1000:.1%})")""")

md("""# The quantum team""")
md("""Before the show, Alice and Bob create a **Bell pair** — two entangled qubits in the state (|00⟩ + |11⟩)/√2. Alice takes one qubit, Bob the other.

In their rooms, each **measures** their qubit along an arrow that depends on their question. The arrows lie on the **Bloch circle**: |0⟩ at the top, |1⟩ at the bottom, |+⟩ at 90°, |−⟩ at −90°.

* Alice: x = 0 → arrow A0 at **0°**, x = 1 → arrow A1 at **90°**
* Bob: y = 0 → arrow B0 at **45°**, y = 1 → arrow B1 at **−45°**

The result is the answer: **0** means "along the arrow", **1** "the opposite way".""")
code("""ALICE = (0, 90)    # Alice's arrows for x = 0, 1 (degrees from the top of the Bloch circle)
BOB = (45, -45)    # Bob's arrows for y = 0, 1
draw_circle(ALICE, BOB)""")

md("""## How do you measure along an arrow?

A quantum computer only measures along Z, the vertical axis: 0 at the top, 1 at the bottom. To measure along an arrow at angle φ, first **turn the qubit back by φ** with the gate Ry(−φ): the arrow's direction lands on |0⟩, the opposite direction on |1⟩. Then measure.

(The state at angle φ is cos(φ/2)|0⟩ + sin(φ/2)|1⟩ = Ry(φ)|0⟩. IBM Quantum Learning's CHSH lesson writes the half angle θ = φ/2: 0 and π/4 for Alice, ±π/8 for Bob.)""")
code("""def chsh_circuit(x, y, alice=ALICE, bob=BOB, measure=True):
    qc = QuantumCircuit(2, 2)
    qc.h(0); qc.cx(0, 1)                     # the Bell pair: qubit 0 is Alice's, qubit 1 is Bob's
    qc.barrier()
    qc.ry(np.radians(-alice[x]), 0)          # Alice turns back by her angle ...
    qc.ry(np.radians(-bob[y]), 1)            # ... and Bob by his
    if measure:
        qc.measure([0, 1], [0, 1])           # a = bit 0, b = bit 1
    return qc

chsh_circuit(1, 1).draw(output='mpl')""")

md("""## Let's play!

Choose the questions x and y — then run the round. Run it again and again: the answers are random, and sometimes Alice and Bob **lose**.""")
code("""def play_round(x, y, alice=ALICE, bob=BOB):
    key = next(iter(simulator.run(chsh_circuit(x, y, alice, bob), shots=1).result().get_counts()))
    a, b = int(key[1]), int(key[0])          # Qiskit prints bit 1 first
    return a, b, wins(x, y, a, b)

def round_on_screen(x=0, y=0):
    a, b, win = play_round(x, y)
    print(f"x = {x}, y = {y}: they need {need(x, y)}")
    print(f"Alice measures along {ALICE[x]}°: a = {a}    Bob measures along {BOB[y]}°: b = {b}")
    print("WIN! 🎉" if win else "Lost.")

widgets.interact_manual(round_on_screen, x=[0, 1], y=[0, 1]);""")

md("""## Many rounds

One round tells us little. The quantum advantage shows in the statistics — 1000 rounds of each question:""")
code("""total = 0
for x, y in QUESTIONS:
    counts = simulator.run(chsh_circuit(x, y), shots=1000).result().get_counts()
    won = sum(n for key, n in counts.items() if wins(x, y, int(key[1]), int(key[0])))
    total += won
    print(f"x = {x}, y = {y} ({need(x, y)}): {won} of 1000 won ({won / 1000:.1%})")
print(f"\\nQuantum team: {total / 4000:.1%} — the best classical team: 75%")""")
md("""And exactly, from the state vector (no sampling noise):""", slide='fragment')
code("""def win_probability(x, y, alice=ALICE, bob=BOB):
    p = Statevector(chsh_circuit(x, y, alice, bob, measure=False)).probabilities()   # index = a + 2·b
    same = p[0] + p[3]
    return 1 - same if x & y else same

for x, y in QUESTIONS:
    print(f"x = {x}, y = {y}: {win_probability(x, y):.4f}")
print(f"\\ncos²(22.5°) = {np.cos(np.radians(22.5)) ** 2:.4f}")""")

md("""# Turn the angles yourself""")
md("""For the Bell pair, Alice and Bob answer the **same** with probability

**P(same) = cos²(Δ/2)**, where Δ is the angle between their two arrows.

With the arrows above, three questions have Δ = 45°: the same answer with cos²(22.5°) ≈ 85.4%. For x = y = 1, Δ = 135°: the same answer with only cos²(67.5°) ≈ 14.6% — so different answers, as needed, with 85.4%.

Check the formula against Qiskit for random angles:""")
code("""rng = np.random.default_rng(1)
worst = 0
for _ in range(500):
    alpha, beta = rng.uniform(-360, 360, size=2)
    qc = chsh_circuit(0, 0, (alpha, 0), (beta, 0), measure=False)
    p = Statevector(qc).probabilities()
    worst = max(worst, abs(p[0] + p[3] - np.cos(np.radians(alpha - beta) / 2) ** 2))
print(f"largest difference between Qiskit and cos²(Δ/2) over 500 random angle pairs: {worst:.1e}")""")
md("""Now move the arrows yourself. Can you beat 85.4%?""")
code("""def try_angles(A0=0, A1=90, B0=45, B1=-45):
    alice, bob = (A0, A1), (B0, B1)
    draw_circle(alice, bob)
    for x, y in QUESTIONS:
        print(f"x = {x}, y = {y} ({need(x, y)}): win {win_probability(x, y, alice, bob):.1%}")
    print(f"Win rate: {sum(win_probability(x, y, alice, bob) for x, y in QUESTIONS) / 4:.1%}")

slider = lambda v: widgets.IntSlider(value=v, min=-180, max=180, step=5, continuous_update=False)
widgets.interact(try_angles, A0=slider(0), A1=slider(90), B0=slider(45), B1=slider(-45));""")

md("""## The win rate as a function of the angle

Keep Alice at 0° and 90°, and let Bob use +β and −β. The win rate is 1/2 + (cos β + sin β)/4: 75% at β = 0 (Bob measures only along Z — no better than classical) and again at β = 90°, the best at β = 45°.""")
code("""betas = np.arange(-180, 181, 5)
rates = [sum(win_probability(x, y, ALICE, (b, -b)) for x, y in QUESTIONS) / 4 for b in betas]
plt.figure(figsize=(7, 3.5))
plt.plot(betas, rates, label='quantum team')
plt.axhline(0.75, color='grey', ls='--', label='best classical team: 75%')
best = int(np.argmax(rates))
plt.plot(betas[best], rates[best], 'o', color='#d02670')
plt.annotate(f'β = {betas[best]}°: {rates[best]:.1%}', (betas[best], rates[best]), xytext=(10, -18), textcoords='offset points')
plt.xlabel("Bob's angle β (degrees)"); plt.ylabel('win rate'); plt.legend(loc='lower right'); plt.grid(alpha=0.3)
plt.show()""")

md("""# Why 85% is the limit""")
md("""## The classical limit: S ≤ 2

Score each question by its **correlation** E = P(same) − P(different), from −1 to +1. When x · y = 0 Alice and Bob win with P(same) = (1 + E)/2; when x = y = 1, with P(different) = (1 − E)/2. Averaged over the four questions:

**win rate = 1/2 + S/8**, &nbsp; with &nbsp; **S = E₀₀ + E₀₁ + E₁₀ − E₁₁**

A classical table has every E = +1 or −1 and loses at least one question, so S = (questions won) − (questions lost) ≤ 3 − 1 = 2. Mixing tables at random averages S, so it stays at most 2. That is the **CHSH inequality**, S ≤ 2 — a win rate of at most 1/2 + 2/8 = **75%**.""")
md("""## The quantum limit: S ≤ 2√2

For the Bell pair, E = cos²(Δ/2) − sin²(Δ/2) = cos Δ — the dot product of the two arrows as vectors of length 1. So

S = A0·B0 + A0·B1 + A1·B0 − A1·B1 = A0·(B0 + B1) + A1·(B0 − B1) ≤ |B0 + B1| + |B0 − B1| ≤ 2√2

First step: the dot product of an arrow of length 1 with any vector is at most that vector's length. Second step: |B0 + B1|² + |B0 − B1|² = 4, and two lengths whose squares add up to 4 add up to at most 2√2 — reached when both are √2: B0 and B1 at right angles, A0 along B0 + B1 and A1 along B0 − B1. Exactly our arrows.

So, for the Bell pair, S ≤ 2√2 ≈ 2.83 and the win rate is at most 1/2 + √2/4 = cos²(22.5°) ≈ **85.4%**. Boris Tsirelson proved in 1980 that this holds for **every** quantum strategy — any entangled state, any measurements: **Tsirelson's bound**.""")
md("""Let Qiskit check it. Measuring along an arrow at angle φ is the observable cos φ·Z + sin φ·X. With our arrows the CHSH observable is S = √2·(Z⊗Z + X⊗X) — its largest eigenvalue is 2√2, and the Bell pair reaches it:""", slide='fragment')
code("""def observable(deg):                       # measuring along the arrow at angle deg, as an observable
    t = np.radians(deg)
    return SparsePauliOp(['Z', 'X'], [np.cos(t), np.sin(t)])

def chsh_operator(alice, bob):              # Bob's qubit 1 goes on the left in Qiskit's labels
    A = [observable(d) for d in alice]; B = [observable(d) for d in bob]
    return (B[0].tensor(A[0]) + B[1].tensor(A[0]) + B[0].tensor(A[1]) - B[1].tensor(A[1])).simplify()

S = chsh_operator(ALICE, BOB)
bell = Statevector(chsh_circuit(0, 0, (0, 0), (0, 0), measure=False))
print("S =", S)
print(f"largest eigenvalue: {max(np.linalg.eigvalsh(S.to_matrix())):.4f}    2√2 = {2 * np.sqrt(2):.4f}")
print(f"Bell pair: S = {bell.expectation_value(S).real:.4f}  →  win rate 1/2 + S/8 = {0.5 + bell.expectation_value(S).real / 8:.4f}")""")
md("""Is there a better strategy somewhere? Try 2000 random measurement directions anywhere on the Bloch sphere — and for each, the best possible two-qubit state (the largest eigenvalue):""", slide='fragment')
code("""def direction_observable(v):                # measuring along a unit vector v on the Bloch sphere
    return SparsePauliOp(['X', 'Y', 'Z'], v)

rng = np.random.default_rng(2)
best = 0
for _ in range(2000):
    v = rng.normal(size=(4, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)
    A0, A1, B0, B1 = (direction_observable(u) for u in v)
    S = B0.tensor(A0) + B1.tensor(A0) + B0.tensor(A1) - B1.tensor(A1)
    best = max(best, max(np.linalg.eigvalsh(S.to_matrix())))
print(f"best S found: {best:.4f}  →  win rate {0.5 + best / 8:.1%}   (the limit: 2√2 = {2 * np.sqrt(2):.4f} → {0.5 + np.sqrt(2) / 4:.1%})")""")

md("""# What does it mean?

* **Not every round.** Unlike in the GHZ game and the magic square, the quantum team loses some rounds. The advantage shows in the statistics — as in real Bell tests: play many rounds, then compare with 75%.
* **No signaling.** Alice's answers alone are 50:50, whatever Bob measures (next cell) — she cannot learn y from them, and no message travels. The correlation appears only when the two lists are compared.
* **No hidden script.** Answers fixed in advance — "hidden variables" carried by the qubits — are a classical table and win at most 75%. John Bell found in 1964 that quantum mechanics predicts more; Clauser, Horne, Shimony and Holt turned it into this test. Experiments by John Clauser, Alain Aspect, Anton Zeilinger and others confirmed quantum mechanics — the 2022 Nobel Prize in Physics. In 2015 three experiments closed the main loopholes at once.
* **Why not 100%?** An imagined "PR box" (Popescu and Rohrlich, 1994) would win every round and still send no message. Quantum mechanics stops at 85.4%. On real quantum computers noise lowers the win rate (answers at random would win 50%) — staying clearly above 75% is a test of the hardware.""")
code("""for y in (0, 1):
    for x in (0, 1):
        p = Statevector(chsh_circuit(x, y, measure=False)).probabilities()
        print(f"Bob measures along {BOB[y]:>3}°, Alice along {ALICE[x]:>2}°: Alice answers 0 with probability {p[0] + p[2]:.2f}")""")

md("""## Learn more

* [The CHSH game](https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/entanglement-in-action/chsh-game) — IBM Quantum Learning, *Basics of quantum information*, with the same strategy (angles written as θ = φ/2)
* [Bell's inequality with Qiskit](https://quantum.cloud.ibm.com/learning/en/modules/quantum-mechanics/bells-inequality-with-qiskit) — IBM Quantum Learning: run a Bell test on real hardware
* J. F. Clauser, M. A. Horne, A. Shimony, R. A. Holt: [Proposed Experiment to Test Local Hidden-Variable Theories](https://doi.org/10.1103/PhysRevLett.23.880), Phys. Rev. Lett. 23, 880 (1969)
* R. Cleve, P. Høyer, B. Toner, J. Watrous: [Consequences and Limits of Nonlocal Strategies](https://arxiv.org/abs/quant-ph/0404076) (2004) — CHSH and other nonlocal games
* B. S. Cirel'son (Tsirelson): [Quantum generalizations of Bell's inequality](https://doi.org/10.1007/BF00417500), Lett. Math. Phys. 4, 93 (1980)
* S. Popescu, D. Rohrlich: [Quantum nonlocality as an axiom](https://doi.org/10.1007/BF02058098), Found. Phys. 24, 379 (1994)
* More games: the [GHZ Game](GHZ-Game.ipynb) and the [Mermin–Peres Magic Square](Mermin-Peres-Game.ipynb) — nonlocal games the quantum team wins every round""", slide='fragment')

nb.cells = cells
nb.metadata = {
    'kernelspec': {'display_name': 'Python 3 (ipykernel)', 'language': 'python', 'name': 'python3'},
    'language_info': {'name': 'python'},
    'rise': {'autolaunch': True, 'scroll': True},
}
import pathlib
nbf.write(nb, pathlib.Path(__file__).resolve().parent.parent / 'CHSH-Game.ipynb')
print('written', len(cells), 'cells')
