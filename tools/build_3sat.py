# Generates 3sat.ipynb (outputs empty, slide metadata). Edit here, then run:
#   python tools/build_3sat.py   (needs nbformat)
# Replaces the two older notebooks 3sat.ipynb / 3sat-v2.ipynb (Qiskit Aqua era; the old 3sat3-5.cnf is embedded).
import pathlib
import nbformat as nbf

cells = []


def md(src, slide='slide'):
    c = nbf.v4.new_markdown_cell(src, id=f'cell-{len(cells)}')  # stable ids: rebuilds diff cleanly
    c.metadata['slideshow'] = {'slide_type': slide}
    cells.append(c)


def code(src, slide='fragment'):
    c = nbf.v4.new_code_cell(src, id=f'cell-{len(cells)}')
    c.metadata['slideshow'] = {'slide_type': slide}
    cells.append(c)


md("""# 3-SAT with Grover's Algorithm

### Solving logic puzzles with a quantum computer

Some puzzles are easy to *check* but hard to *solve*: is there a way to fill in the variables so that every rule is satisfied? This notebook builds **Grover's search algorithm** step by step from [Qiskit](https://www.ibm.com/quantum/qiskit) building blocks and uses it to solve two such puzzles — a party guest list and a classic 3-SAT formula.

Part of [Fun with Quantum](https://fun-with-quantum.org). First versions by Jan-R. Lahmann (2019–2022), rebuilt in 2026 for Qiskit 2. The party puzzle comes from James Weaver's Qiskit workshop notebook "Grover search party"; the 3-SAT problem from the Qiskit tutorial "Using Grover search for 3-SAT problems" by Jay Gambetta and Richard Chen ([today in qiskit-community-tutorials](https://github.com/qiskit-community/qiskit-community-tutorials/blob/master/optimization/grover.ipynb)) and a hands-on workshop by David Mesterhazy.

(hit space or right arrow to move to the next slide)""")

md("""## Usage instructions for the user interface

* "Space" and "Shift Space" move through the slides; "Ctrl −" and "Ctrl +" (on a Mac "⌘ −" and "⌘ +") fit the text to the window
* "Shift Enter" runs an interactive cell (you may need to click the cell first)
* Run the code cells in order, from the top — the first ones load everything the game needs
* Seeing a `NameError`? A cell was skipped or the kernel restarted: run the code cells from the top again, or use "Kernel → Restart & Run All"
* "X" at the top left leaves the slideshow and shows the plain notebook""")

md(r"""## Boolean satisfiability (SAT)

The [Boolean satisfiability problem](https://en.wikipedia.org/wiki/Boolean_satisfiability_problem) asks: given a formula of Boolean variables (true/false) joined with AND (∧), OR (∨) and NOT (¬), is there an assignment of the variables that makes the whole formula true?

* A **literal** is a variable or its negation, like $x_1$ or $\neg x_2$.
* A **clause** is an OR of literals, like $(x_1 \vee \neg x_2 \vee x_3)$.
* A formula in **conjunctive normal form (CNF)** is an AND of clauses. If every clause has three literals, it is a **3-SAT** problem.

SAT was the first problem proven to be **NP-complete**: every problem whose solutions can be *checked* quickly can be translated into SAT. Checking a proposed answer is easy — finding one can take a very long time as the number of variables grows.""")

md(r"""# Throwing a party without the drama

You want to invite some of your friends — **A**lice, **B**ob, **C**arol and **D**avid — and keep everybody happy:

* Alice and Bob are a couple, so are Carol and David: invite at least **one complete couple**.
* Alice and David just broke up: never invite **both of them**.

As a Boolean formula:

$$((A \wedge B) \vee (C \wedge D)) \wedge \neg(A \wedge D)$$

In code we write & for AND, | for OR and ~ for NOT: `((A & B) | (C & D)) & ~(A & D)`. Which guest lists work? With 4 friends there are 2⁴ = 16 possible lists.""")

md("""## The whole quantum program

With Qiskit this takes the formula and **seven lines** of code. Qiskit builds the oracle from the formula; `grover_operator` adds the rest of Grover's search. For another puzzle only the formula and its variables change. Click into the cell and press "Shift Enter":""")
code("""from qiskit import QuantumCircuit
from qiskit.circuit.library import PhaseOracleGate, grover_operator
from qiskit.primitives import StatevectorSampler
from qiskit.visualization import plot_histogram

party = '((A & B) | (C & D)) & ~(A & D)'  # the problem

oracle = QuantumCircuit(4)  # the quantum program
oracle.append(PhaseOracleGate(party, var_order=['A', 'B', 'C', 'D']), range(4))
grover = QuantumCircuit(4)
grover.h(range(4))  # all 16 guest lists at once
grover.compose(grover_operator(oracle), inplace=True)  # one round
grover.measure_all()
counts = StatevectorSampler().run([grover], shots=1000).result()[0].data.meas.get_counts()

plot_histogram(counts, title='Guest lists (bits read D C B A)')""")
md("""Only the four valid guest lists come out, each about a quarter of the time — together 100%. Read the bit strings right to left as A, B, C, D (Qiskit puts qubit 0 on the right): `0011` is Alice and Bob, `1100` Carol and David.

That is all it takes. The rest of this notebook looks inside: how Grover's search works, why one round is enough here, and how to check the answers.""", slide='fragment')

md(r"""## How Grover's search works

1. **Superposition:** a Hadamard gate on every qubit puts all 2ⁿ guest lists into the register at once, each with the same amplitude.
2. **Oracle:** a circuit built from the formula flips the *sign* of every assignment that satisfies it. Nothing measurable changes yet — the solutions are only marked.
3. **Diffuser:** reflects every amplitude about the average. The marked (negative) amplitudes grow, all others shrink. This is **interference**.
4. **Repeat** oracle + diffuser $k$ times, then **measure**: a solution comes out with high probability.

With M solutions among N assignments and $\sin^2\theta = M/N$, the chance after $k$ rounds is $\sin^2((2k+1)\theta)$. It peaks first at $k = \lfloor \pi/(4\theta) \rfloor$ — about $\frac{\pi}{4}\sqrt{N/M}$ when solutions are rare. One round too many spoils it: for the party puzzle 1 round gives 100%, 2 rounds only 25%. (If half or more of all assignments are solutions, don't search — just measure.)

A classical search needs about N/M checks; Grover needs only about $\sqrt{N/M}$ rounds — a quadratic speed-up.""")

md("""To look inside — draw the circuit, choose the number of rounds, check the answers, try your own puzzles — we load a few helper functions. Click into the cell and press "Shift Enter".""")
code(r'''import math, re
from itertools import product
from IPython.display import HTML, display
from qiskit import QuantumCircuit, transpile
from qiskit.circuit.library import PhaseOracleGate, grover_operator
from qiskit.visualization import plot_histogram
from qiskit_aer import AerSimulator

simulator = AerSimulator()

def variables(expr):
    """The variables of a formula in natural order (x2 before x10) — we put them on qubits 0, 1, 2, … in this order."""
    bad = set(re.sub(r'[A-Za-z0-9_\s&|~()]', '', expr))
    if bad:
        raise ValueError(f"use letters a-z/A-Z, digits, _ and & | ~ ( ) only, not: {' '.join(sorted(bad))}")
    names = set(re.findall(r'[A-Za-z_]\w*', expr))
    return sorted(names, key=lambda v: [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', v)])

def oracle_for(expr):
    """The phase oracle of a formula, with the qubit order fixed to variables(expr)."""
    return PhaseOracleGate(expr, var_order=variables(expr))

def holds(expr, assignment):
    """Check a formula classically for one assignment, e.g. {'A': True, 'B': False, …}."""
    py = expr.replace('~', ' not ').replace('&', ' and ').replace('|', ' or ')
    return bool(eval(py, {'__builtins__': {}}, assignment))

def grover_circuit(oracle_gate, iterations):
    """Grover's search: superposition, then `iterations` × (oracle + diffuser), then measure."""
    n = oracle_gate.num_qubits
    oracle = QuantumCircuit(n, name='oracle')
    oracle.append(oracle_gate, range(n))
    step = grover_operator(oracle)          # oracle followed by the diffuser
    qc = QuantumCircuit(n)
    qc.h(range(n))                          # all 2^n assignments at once
    for _ in range(iterations):
        qc.compose(step, inplace=True)
    qc.measure_all()
    return qc

def best_iterations(n_vars, n_solutions):
    """Rounds k that reach the first peak of the chance sin²((2k+1)θ) of a solution, with sin²θ = M/N
    (M solutions among N = 2^n). About π/4·√(N/M) when solutions are rare; 0 when half or more of
    all assignments are solutions — then no round raises the chance."""
    if n_solutions == 0:
        raise ValueError("no solutions: nothing to search for")
    if 2 * n_solutions >= 2 ** n_vars:
        return 0
    theta = math.asin(math.sqrt(n_solutions / 2 ** n_vars))
    return math.floor(math.pi / (4 * theta))

def run(qc, shots=2000):
    return simulator.run(transpile(qc, simulator), shots=shots).result().get_counts()

print("Ready.")''')

md("""Qiskit turns the formula into the oracle for us. (A "global phase" printed above the circuit is an overall sign that no measurement can see.)""", slide='fragment')
code("""party = '((A & B) | (C & D)) & ~(A & D)'
oracle = oracle_for(party)
print("Variables on qubits 0, 1, 2, 3:", variables(party))
grover_circuit(oracle, 1).draw(output='mpl')""")

md("""## How many rounds?

Here we cheat a little: to choose the number of rounds we count the solutions classically first (16 checks are quick). For real problems the count is unknown — you can estimate it with *quantum counting*, or try increasing numbers of rounds.""")
code("""party_vars = variables(party)
n_solutions = sum(holds(party, dict(zip(party_vars, bits))) for bits in product((False, True), repeat=len(party_vars)))
k = best_iterations(len(party_vars), n_solutions)
print(f"{n_solutions} solutions among {2 ** len(party_vars)} guest lists → {k} Grover round(s)")

party_counts = run(grover_circuit(oracle, k))
plot_histogram(party_counts, title='Guest lists (bits read D C B A)')""")

md("""With 4 solutions among 16 lists, one round reaches exactly 100%: only the four valid lists appear, each about 25% of the time (θ = 30°: after one round the state stands at 3θ = 90° — exactly on the solutions). Let's double-check them classically:""")
code("""rows = []
for bits, n in sorted(party_counts.items(), key=lambda x: -x[1]):
    guests = {v: b == '1' for v, b in zip(party_vars, reversed(bits))}
    names = ', '.join(name for v, name in zip('ABCD', ['Alice', 'Bob', 'Carol', 'David']) if guests[v]) or 'nobody'
    rows.append(f"<tr><td><code>{bits}</code></td><td>{n}</td><td>{names}</td><td>{'✅' if holds(party, guests) else '❌'}</td></tr>")
display(HTML('<table><tr><th>D C B A</th><th>count</th><th>guests</th><th>formula true?</th></tr>' + ''.join(rows) + '</table>'))""")

md("""## Now it's your turn

Write your own puzzle as a formula with &, | and ~ (variable names of letters, digits and _) and let Grover search for solutions. Try more friends and more rules!""")
code("""my_puzzle = '((A & C) | (B & D)) & ~(A & D)'   # change me

my_vars = variables(my_puzzle)
n_solutions = sum(holds(my_puzzle, dict(zip(my_vars, bits))) for bits in product((False, True), repeat=len(my_vars)))
print(f"Variables (right to left in the bit strings): {my_vars} — {n_solutions} of {2 ** len(my_vars)} assignments are solutions")
if n_solutions == 0:
    print("No solution at all — Grover can't find what isn't there.")
elif n_solutions == 2 ** len(my_vars):
    print("Every assignment is a solution — nothing to search for.")
else:
    k = best_iterations(len(my_vars), n_solutions)
    if k == 0:
        print("Half or more of all assignments are solutions: a Grover round can't raise the chance, so we just measure.")
    else:
        print(f"{k} Grover round(s)")
    display(plot_histogram(run(grover_circuit(oracle_for(my_puzzle), k)), title='Your puzzle'))""")

md(r"""# A classic 3-SAT problem

Three variables $x_1, x_2, x_3$ and five clauses with three literals each:

$$\begin{aligned} f(x_1, x_2, x_3) = {} & (\neg x_1 \vee \neg x_2 \vee \neg x_3) \wedge (x_1 \vee \neg x_2 \vee x_3) \wedge (x_1 \vee x_2 \vee \neg x_3) \\ & \wedge (x_1 \vee \neg x_2 \vee \neg x_3) \wedge (\neg x_1 \vee x_2 \vee x_3) \end{aligned}$$

SAT problems are usually exchanged in the **DIMACS CNF** text format: lines starting with `c` are comments, a line `p cnf <variables> <clauses>` gives the size, and then come the clauses as numbers — `k` for $x_k$, `-k` for $\neg x_k$, and `0` to end a clause. We translate it into a formula ourselves — that also shows what the format means. The quantum part stays the same few lines; only the formula changes (`grover_circuit` is exactly those lines).""")
code("""dimacs = '''c example DIMACS-CNF 3-SAT
p cnf 3 5
-1 -2 -3 0
1 -2 3 0
1 2 -3 0
1 -2 -3 0
-1 2 3 0
'''
# translate DIMACS into a formula: skip comment (c) and problem (p) lines, end a clause at every 0
numbers = [int(x) for line in dimacs.splitlines() if line.strip() and line.strip()[0] not in 'cp%' for x in line.split()]
clauses, clause = [], []
for x in numbers:
    if x != 0:
        clause.append(x)
    elif clause:
        clauses.append(clause)
        clause = []
formula = ' & '.join('(' + ' | '.join(('~' if l < 0 else '') + f'x{abs(l)}' for l in clause) + ')' for clause in clauses)
print(formula)

sat_counts = run(grover_circuit(oracle_for(formula), 1))
plot_histogram(sat_counts, title='Assignments (bits read x3 x2 x1)')""")

md(r"""Three bars stand out: **000, 011 and 101**. Read right to left as $x_1 x_2 x_3$, these are the assignments **000, 110 and 101** (careful: the small bar labelled `110` is *not* a solution — it means $x_1 = 0, x_2 = 1, x_3 = 1$). With 3 solutions among 8, one Grover round finds a solution 27 times in 32, about 84% — the other 16% are wrong answers, which is why you always **check** the answer classically (easy for SAT!). Three rounds would even give 99%, but cost three times the work.""")

md("""## Classically: try them all

For three variables a classical computer simply tries all 2³ = 8 assignments:""")
code("""rows = []
for x in product((0, 1), repeat=3):
    ok = all(any((x[abs(l) - 1] == 1) if l > 0 else (x[abs(l) - 1] == 0) for l in clause) for clause in clauses)
    rows.append(f"<tr><td>{x[0]}</td><td>{x[1]}</td><td>{x[2]}</td><td>{'✅ solution' if ok else ''}</td></tr>")
display(HTML('<table><tr><th>x1</th><th>x2</th><th>x3</th><th>f</th></tr>' + ''.join(rows) + '</table>'))""")

md(r"""Trying everything doubles in effort with every extra variable — 2ⁿ checks. Grover needs about $\sqrt{2^n}$ rounds: still exponential, but far fewer. (Real SAT solvers are much smarter than brute force and handle many practical formulas with millions of clauses. Grover's quadratic speed-up is over brute-force search; whether quantum computers can beat the best classical SAT solvers is an open research question.)

## Learn more

* [Grover's algorithm](https://quantum.cloud.ibm.com/learning/en/courses/fundamentals-of-quantum-algorithms/grover-algorithm/introduction) in IBM Quantum Learning's *Fundamentals of quantum algorithms*
* [Grover's algorithm tutorial](https://quantum.cloud.ibm.com/docs/en/tutorials/grovers-algorithm) on IBM Quantum — also [executable in your browser on doQumentation](https://doqumentation.org/tutorials/grovers-algorithm)
* [Grover's algorithm](https://en.wikipedia.org/wiki/Grover%27s_algorithm) and [SAT](https://en.wikipedia.org/wiki/Boolean_satisfiability_problem) on Wikipedia""")
code("""import qiskit
print(f"Qiskit version: {qiskit.__version__}")""", slide='-')

nb = nbf.v4.new_notebook()
nb.cells = cells
nb.metadata = {
    'kernelspec': {'display_name': 'Python 3 (ipykernel)', 'language': 'python', 'name': 'python3'},
    'language_info': {'name': 'python'},
    'rise': {'autolaunch': True, 'scroll': True},
}
nbf.write(nb, pathlib.Path(__file__).resolve().parent.parent / '3sat.ipynb')
print('written', len(cells), 'cells')
