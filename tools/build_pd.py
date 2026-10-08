# Generates Prisoners-Dilemma.ipynb (outputs empty, RISE slide metadata). Edit here, then run:
#   python tools/build_pd.py   (needs nbformat)

import nbformat as nbf

nb = nbf.v4.new_notebook()
cells = []
def md(src, slide='slide'):
    c = nbf.v4.new_markdown_cell(src, id=f'cell-{len(cells)}'); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)  # stable ids: rebuilds diff cleanly
def code(src, slide='fragment'):
    c = nbf.v4.new_code_cell(src, id=f'cell-{len(cells)}'); c.metadata['slideshow'] = {'slide_type': slide}; cells.append(c)

md("""# The Quantum Prisoner's Dilemma

### The classic dilemma of game theory, played with entangled qubits

Two players, two choices — and the rational choice leaves both worse off. With entangled qubits and a new quantum move, cooperation pays. Then comes the catch.

Based on J. Eisert, M. Wilkens and M. Lewenstein (1999) and the comment by S. C. Benjamin and P. M. Hayden (2001).
Notebook by Jan-R. Lahmann (2026), built with [Qiskit](https://www.ibm.com/quantum/qiskit).
Part of [Fun with Quantum](https://fun-with-quantum.org).

(hit space or right arrow to move to the next slide)""")

md("""## Usage instructions for the user interface

* "Space" and "Shift Space" move through the slides
* "Shift Enter" runs an interactive cell (you may need to click the cell first)
* Run the cells on each slide in order — the first code cell loads everything else
* "X" at the top left leaves the slideshow and shows the plain notebook""")

md("""First we load a few tools. You don't need to understand them — just click into the cell and press "Shift Enter".""")
code("""# tools: Qiskit for the quantum circuits, ipywidgets for the buttons, matplotlib for the payoff map
import random
import numpy as np
import matplotlib.pyplot as plt
import ipywidgets as widgets
from scipy.optimize import minimize
from qiskit import QuantumCircuit
from qiskit.quantum_info import Operator, Statevector
from qiskit_aer import AerSimulator

simulator = AerSimulator()
# points (Alice, Bob) for the outcomes C·C, D·C, C·D, D·D — Qiskit's order: index = Alice + 2·Bob, 0 = C, 1 = D
ALICE_POINTS = np.array([3, 5, 0, 1])
BOB_POINTS = np.array([3, 0, 5, 1])
MOVE = {0: 'C', 1: 'D'}

def U(theta, phi=0, alpha=0):
    \"\"\"A move as a matrix (angles in degrees), as in Eisert, Wilkens and Lewenstein; alpha = 0 in their set.\"\"\"
    t, p, a = np.radians([theta, phi, alpha])
    return np.array([[np.exp(1j * p) * np.cos(t / 2), np.exp(1j * a) * np.sin(t / 2)],
                     [-np.exp(-1j * a) * np.sin(t / 2), np.exp(-1j * p) * np.cos(t / 2)]])

def play_move(qc, move, qubit):
    \"\"\"The same move as gates: Rz(−φ+α), then Ry(−θ), then Rz(−φ−α).\"\"\"
    theta, phi, alpha = (list(move) + [0, 0])[:3]
    qc.rz(np.radians(-phi + alpha), qubit)
    qc.ry(np.radians(-theta), qubit)
    qc.rz(np.radians(-phi - alpha), qubit)

def game(alice, bob, measure=True):
    \"\"\"The referee's J, Alice's move on qubit 0, Bob's on qubit 1, J†, measurement.\"\"\"
    qc = QuantumCircuit(2, 2)
    qc.ryy(np.pi / 2, 0, 1)      # J
    qc.barrier()
    play_move(qc, alice, 0)
    play_move(qc, bob, 1)
    qc.barrier()
    qc.ryy(-np.pi / 2, 0, 1)     # J†
    if measure:
        qc.measure([0, 1], [0, 1])
    return qc

def points(alice, bob):
    \"\"\"Expected points (Alice, Bob), exactly, from the state vector.\"\"\"
    p = Statevector(game(alice, bob, measure=False)).probabilities()
    return float(ALICE_POINTS @ p), float(BOB_POINTS @ p)

C, D, Q = (0, 0), (180, 0), (0, 90)
names = {'C': C, 'D': D, 'Q': Q}
iX = (180, 0, 90)                                                   # iσx, used in "The catch"
J = (np.eye(4) + 1j * np.kron(U(180), U(180))) / np.sqrt(2)          # exp(i·π/4·D⊗D), since (D⊗D)² = 1

def fast_points(alice, bob):
    \"\"\"The same expected points from the matrices (fast; checked against the circuits below).\"\"\"
    state = J.conj().T @ np.kron(U(*bob), U(*alice)) @ J @ np.array([1, 0, 0, 0])   # Qiskit order: Bob ⊗ Alice
    p = abs(state) ** 2
    return float(ALICE_POINTS @ p), float(BOB_POINTS @ p)

print("Ready.")""")

md("""# The dilemma""")
md("""Alice and Bob each choose, without knowing the other's choice: **cooperate** (C) or **defect** (D).

| | Bob cooperates | Bob defects |
|---|---|---|
| **Alice cooperates** | 3, 3 | 0, 5 |
| **Alice defects** | 5, 0 | 1, 1 |

(points for Alice, Bob)

You are Alice. Bob can't see your choice, so for now he picks at random. Play a few rounds:""", slide='fragment')
code("""def classical_round(you='C'):
    bob = random.choice('CD')
    i = (you == 'D') + 2 * (bob == 'D')
    print(f"You: {you}   Bob: {bob}   →   you {ALICE_POINTS[i]}, Bob {BOB_POINTS[i]} points")

widgets.interact_manual(classical_round, you=['C', 'D']);""")
md("""## Why defect?

Whatever Bob does, defecting pays Alice more: if he cooperates, 5 instead of 3; if he defects, 1 instead of 0. Defecting is **dominant** — and Bob reasons the same way.

So both defect and get **1** each, although both cooperating would give **3** each. That is the dilemma. (D, D) is the only **Nash equilibrium**: neither player gains by changing alone.""")
code("""table = {(a, b): (ALICE_POINTS[a + 2 * b], BOB_POINTS[a + 2 * b]) for a in (0, 1) for b in (0, 1)}
for b in (0, 1):
    print(f"Bob plays {MOVE[b]}: Alice gets {table[(0, b)][0]} with C, {table[(1, b)][0]} with D")
equilibria = [(MOVE[a], MOVE[b]) for (a, b), (pa, pb) in table.items()
              if pa >= table[(1 - a, b)][0] and pb >= table[(a, 1 - b)][1]]
print("Nash equilibria:", equilibria)""")

md("""# Quantum moves""")
md("""Now a referee prepares two qubits in |00⟩ (0 = C, 1 = D) and **entangles** them with the gate J. Each player gets one qubit and turns it with a **move** U(θ, φ). The referee undoes J (applies J†) and measures. The points are paid as before.

* U(0°, 0°) does nothing: **C**. U(180°, 0°) flips the qubit: **D**. With these two, J and J† cancel and the old game comes back.
* A new move: **Q** = U(0°, 90°).

Eisert, Wilkens and Lewenstein write J = exp(i·π/4·D⊗D). In Qiskit that is the gate RYY(π/2) — let's check, together with our gates for U:""")
code("""qc = QuantumCircuit(2); qc.ryy(np.pi / 2, 0, 1)        # J was defined from the matrices in the first cell
print("J = RYY(π/2):", np.allclose(Operator(qc).data, J))
for move in [(0, 0), (180, 0), (0, 90), (70, 30), (120, 200, 45)]:
    qc = QuantumCircuit(1); play_move(qc, move, 0)
    print(f"U{move} as gates:", np.allclose(Operator(qc).data, U(*move)))
print("matrices = circuits:", all(np.allclose(fast_points(a, b), points(a, b)) for a in [(10, 20), Q, D, iX] for b in [(100, 70), Q, C]))""")
code("""game(Q, D).draw(output='mpl')""")
md("""## The points with C, D and Q""")
code("""print("Alice ↓  Bob →    " + "      ".join(names))
for a, ma in names.items():
    print(f"   {a}           " + "  ".join(f"{pa:.0f}, {pb:.0f}" for pa, pb in (points(ma, mb) for mb in names.values())))""")
md("""* C and D give exactly the classical table.
* **Q against D: 5 to 0.** Defecting is no longer safe.
* Q against Q: 3 each.

Check with 1000 rounds on the simulator — Q against D:""", slide='fragment')
code("""counts = simulator.run(game(Q, D), shots=1000).result().get_counts()
alice_total = sum(n * ALICE_POINTS[int(key[1]) + 2 * int(key[0])] for key, n in counts.items())   # key = Bob, Alice
print({f"Alice {MOVE[int(k[1])]}, Bob {MOVE[int(k[0])]}": n for k, n in counts.items()})
print(f"Alice: {alice_total / 1000:.2f} points a round (exactly {points(Q, D)[0]:.2f})")""")
md("""Try your own move against C, D or Q:""", slide='fragment')
code("""def try_move(theta=0, phi=90, bob='Q'):
    p = Statevector(game((theta, phi), names[bob], measure=False)).probabilities()
    for i, label in enumerate(['C·C', 'D·C', 'C·D', 'D·D']):
        print(f"you·Bob {label}: {p[i]:.1%}")
    pa, pb = points((theta, phi), names[bob])
    print(f"expected points: you {pa:.2f}, Bob {pb:.2f}")

widgets.interact(try_move, theta=widgets.IntSlider(0, 0, 180, 5, continuous_update=False),
                 phi=widgets.IntSlider(90, 0, 90, 5, continuous_update=False), bob=['C', 'D', 'Q']);""")

md("""# Why Q wins""")
md("""Map your expected points for every move U(θ, φ) — against D and against Q:""")
code("""thetas, phis = np.arange(0, 181, 5), np.arange(0, 91, 5)
fig, axes = plt.subplots(1, 2, figsize=(10, 3.8))
for ax, bob in zip(axes, ['D', 'Q']):
    grid = np.array([[fast_points((t, p), names[bob])[0] for t in thetas] for p in phis])
    im = ax.imshow(grid, origin='lower', extent=[0, 180, 0, 90], aspect='auto', vmin=0, vmax=5, cmap='viridis')
    j, i = np.unravel_index(np.argmax(grid), grid.shape)
    ax.plot(thetas[i], phis[j], 'o', color='#d02670')
    ax.set_title(f"against {bob}: best {grid.max():.2f} at θ {thetas[i]}°, φ {phis[j]}°")
    ax.set_xlabel('θ (degrees)'); ax.set_ylabel('φ (degrees)')
fig.colorbar(im, ax=axes, label='your points')
plt.show()""")
md("""* Against **D**, Q earns 5.
* Against **Q**, no move earns more than 3 — Q itself earns 3.

So when both play Q, neither gains by changing alone: **(Q, Q) is a Nash equilibrium**, paying 3 each — like cooperating. Search all pairs of moves on a grid for equilibria:""", slide='fragment')
code("""grid = [(t, p) for t in range(0, 181, 10) for p in range(0, 91, 5)]
Us = np.array([U(*m) for m in grid])
start = J @ np.array([1, 0, 0, 0])
# every pair at once: state[a, b] = J† (U_b ⊗ U_a) J |00⟩   (Qiskit order: Bob ⊗ Alice)
pairs = np.einsum('bij,akl->abikjl', Us, Us).reshape(len(grid), len(grid), 4, 4)
p = abs((pairs @ start) @ J.conj()) ** 2
A, B = p @ ALICE_POINTS, p @ BOB_POINTS            # A[a, b]: Alice's points when she plays a and Bob plays b
best_A, best_B = A.max(axis=0), B.max(axis=1)      # best reply of Alice to each b, of Bob to each a
equilibria = [(grid[a], grid[b], A[a, b], B[a, b]) for a in range(len(grid)) for b in range(len(grid))
              if A[a, b] >= best_A[b] - 1e-9 and B[a, b] >= best_B[a] - 1e-9]
for a, b, pa, pb in equilibria:
    print(f"equilibrium: Alice U{a}, Bob U{b} → {pa:.0f}, {pb:.0f}")""")

md("""# The catch""")
md("""Why should the players be limited to U(θ, φ)? A qubit can be turned in any direction: a third angle α gives **every** one-qubit move. Simon Benjamin and Patrick Hayden pointed out (2001) that then Q has a counter: **iσx** = U(180°, 0°, α = 90°).""")
code("""print("U(180°, 0°, 90°) = iσx:", np.allclose(U(*iX), 1j * np.array([[0, 1], [1, 0]])))
print("iσx against Q: you {:.2f}, Bob {:.2f}".format(*points(iX, Q)))""")
md("""It gets worse: against **every** move of Bob there is a reply worth 5 points — and every reply has a counter of its own. On the shared entangled state, a player can undo the other's move. So with all quantum moves there is no equilibrium in fixed moves at all.

Let the computer search for your counter against random moves of Bob (in fact there is a formula: against U(θ, φ, α) play U(180° − θ, α + 90°, φ + 180°)):""", slide='fragment')
code("""rng = np.random.default_rng(7)
for _ in range(5):
    bob = (rng.uniform(0, 180), rng.uniform(0, 360), rng.uniform(0, 360))
    best = min((minimize(lambda m: -fast_points(m, bob)[0], rng.uniform(0, 360, 3), method='Nelder-Mead')
                for _ in range(4)), key=lambda r: r.fun)
    formula = (180 - bob[0], bob[2] + 90, bob[1] + 180)
    print(f"Bob U({bob[0]:.0f}°, {bob[1]:.0f}°, {bob[2]:.0f}°): search finds {-best.fun:.2f} points, the formula {fast_points(formula, bob)[0]:.2f}")""")
md("""## Random moves

Equilibria come back with **random** choices. If Bob picks one of four moves — I (= C), iσx, iσy (= D), iσz (= Q) — at random, every reply of Alice earns on average exactly **2.25** points, and the same holds the other way round. Both doing this is an equilibrium: 2.25 each — better than 1, worse than 3. (2.25 is the average of 3, 0, 5 and 1: all four outcomes equally likely. Benjamin and Hayden let each player pick a completely random move; picking one of these four at random gives the same averages.) It is not the only one: Eisert and Wilkens (2000) found another random equilibrium worth 2.5 each.""")
code("""rng = np.random.default_rng(3)
quaternions = [(0, 0, 0), iX, (180, 0, 0), (0, 90, 0)]          # I, iσx, iσy = D, iσz = Q
for _ in range(5):
    mine = (rng.uniform(0, 180), rng.uniform(0, 360), rng.uniform(0, 360))
    avg = np.mean([points(mine, q)[0] for q in quaternions])
    print(f"your move U({mine[0]:.0f}°, {mine[1]:.0f}°, {mine[2]:.0f}°): {avg:.4f} points on average")""")

md("""# What does it mean?

* The quantum prisoner's dilemma is a **different game**: a referee entangles the players' qubits. Eisert, Wilkens and Lewenstein (1999) showed that with the moves U(θ, φ) the dilemma disappears: (Q, Q) pays 3 each.
* Benjamin and Hayden (2001) showed that this depends on the **restricted set of moves**. With every one-qubit move, each move has a counter, and equilibria exist only with random choices — for example 2.25 each. Entanglement still changes the game, but it does not simply remove the dilemma.
* In 1999, the same year as Eisert, Wilkens and Lewenstein, David Meyer played a quantum coin flip: in his game a quantum player can always beat a classical one — our [Quantum Coin Game](Quantum-Coin-Game.ipynb). When both players have every quantum move, neither has that edge.""")

md("""## Learn more

* J. Eisert, M. Wilkens, M. Lewenstein: [Quantum Games and Quantum Strategies](https://doi.org/10.1103/PhysRevLett.83.3077), Phys. Rev. Lett. 83, 3077 (1999)
* S. C. Benjamin, P. M. Hayden: [Comment on "Quantum Games and Quantum Strategies"](https://doi.org/10.1103/PhysRevLett.87.069801), Phys. Rev. Lett. 87, 069801 (2001)
* J. Eisert, M. Wilkens: [Quantum games](https://doi.org/10.1080/09500340008232180), J. Mod. Opt. 47, 2543 (2000) — the 2.5 equilibrium and more
* D. A. Meyer: [Quantum Strategies](https://doi.org/10.1103/PhysRevLett.82.1052), Phys. Rev. Lett. 82, 1052 (1999)
* More games: the [Quantum Coin Game](Quantum-Coin-Game.ipynb), the [CHSH Game](CHSH-Game.ipynb) and the [GHZ Game](GHZ-Game.ipynb)""", slide='fragment')

nb.cells = cells
nb.metadata = {
    'kernelspec': {'display_name': 'Python 3 (ipykernel)', 'language': 'python', 'name': 'python3'},
    'language_info': {'name': 'python'},
    'rise': {'autolaunch': True, 'scroll': True},
}
import pathlib
nbf.write(nb, pathlib.Path(__file__).resolve().parent.parent / 'Prisoners-Dilemma.ipynb')
print('written', len(cells), 'cells')
