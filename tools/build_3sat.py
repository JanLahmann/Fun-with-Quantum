# Generates 3sat.ipynb (outputs empty, slide metadata). Edit here, then run:
#   python tools/build_3sat.py   (needs nbformat)
# Replaces the two older notebooks 3sat.ipynb / 3sat-v2.ipynb (Qiskit Aqua era).
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


md("""# Solving logic puzzles with a quantum computer

### Grover's search and Boolean satisfiability (3-SAT)

Some puzzles are easy to *check* but hard to *solve*: is there a way to fill in the variables so that every rule is satisfied? This notebook builds **Grover's search algorithm** from scratch with [Qiskit](https://www.ibm.com/quantum/qiskit) and uses it to solve two such puzzles — a party guest list and a classic 3-SAT formula.

Part of [Fun with Quantum](https://fun-with-quantum.org). First versions by Jan-R. Lahmann (with Qiskit Aqua, 2019–2022), rebuilt in 2026 for Qiskit 2.""")

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

As a Boolean formula (with & for AND, | for OR, ~ for NOT):

$$((A \wedge B) \vee (C \wedge D)) \wedge \neg(A \wedge D)$$

Which guest lists work? With 4 friends there are 2⁴ = 16 possible lists.""")

md("""First we load the tools: Qiskit for the circuits, a simulator to run them, and a few helper functions. Click into the cell and press "Shift Enter".""", slide='fragment')
code(r'''import math, re
from itertools import product
from IPython.display import HTML, display
from qiskit import QuantumCircuit, transpile
from qiskit.circuit.library import PhaseOracleGate, grover_operator
from qiskit.visualization import plot_histogram
from qiskit_aer import AerSimulator

simulator = AerSimulator()

def variables(expr):
    """The variables of a formula, sorted — we put them on qubits 0, 1, 2, … in this order."""
    return sorted(set(re.findall(r'[A-Za-z_]\w*', expr)))

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
    """About π/4·√(N/M) rounds for M solutions among N = 2^n assignments."""
    theta = math.asin(math.sqrt(n_solutions / 2 ** n_vars))
    return max(1, math.floor(math.pi / (4 * theta)))

def run(qc, shots=2000):
    return simulator.run(transpile(qc, simulator), shots=shots).result().get_counts()

print("Ready.")''')

md(r"""## How Grover's search works

1. **Superposition:** a Hadamard gate on every qubit puts all 2ⁿ guest lists into the register at once, each with the same amplitude.
2. **Oracle:** a circuit built from the formula flips the *sign* of every assignment that satisfies it. Nothing measurable changes yet — the solutions are only marked.
3. **Diffuser:** reflects every amplitude about the average. The marked (negative) amplitudes grow, all others shrink. This is **interference**.
4. **Repeat** oracle + diffuser about $\frac{\pi}{4}\sqrt{N/M}$ times (N assignments, M solutions), then **measure**: a solution comes out with high probability.

A classical search needs about N/M checks; Grover needs only about $\sqrt{N/M}$ — a quadratic speed-up.""")

md("""Qiskit turns the formula into the oracle for us:""", slide='fragment')
code("""party = '((A & B) | (C & D)) & ~(A & D)'
oracle = oracle_for(party)
print("Variables on qubits 0, 1, 2, 3:", variables(party))
grover_circuit(oracle, 1).draw(output='mpl')""")

md("""## Run it

Here we cheat a little: to choose the number of rounds we count the solutions classically first (16 checks are quick). For real problems the count is unknown — you can estimate it with *quantum counting*, or try increasing numbers of rounds.""")
code("""vs = variables(party)
n_solutions = sum(holds(party, dict(zip(vs, bits))) for bits in product((False, True), repeat=len(vs)))
k = best_iterations(len(vs), n_solutions)
print(f"{n_solutions} solutions among {2 ** len(vs)} guest lists → {k} Grover round(s)")

counts = run(grover_circuit(oracle, k))
plot_histogram(counts, title='Guest lists (bits read D C B A)')""")

md("""Every bit string is a guest list, read **right to left** as A, B, C, D (Qiskit puts qubit 0 on the right): `0011` means *Alice and Bob*, `1100` *Carol and David*.

With 4 solutions among 16 lists, a single Grover round finds a solution **every time** — only the four valid lists appear. Let's double-check them classically:""")
code("""rows = []
for bits, n in sorted(counts.items(), key=lambda x: -x[1]):
    guests = {v: b == '1' for v, b in zip(vs, reversed(bits))}
    names = ', '.join(name for v, name in zip('ABCD', ['Alice', 'Bob', 'Carol', 'David']) if guests[v]) or 'nobody'
    rows.append(f"<tr><td><code>{bits}</code></td><td>{n}</td><td>{names}</td><td>{'✅' if holds(party, guests) else '❌'}</td></tr>")
display(HTML('<table><tr><th>D C B A</th><th>count</th><th>guests</th><th>formula true?</th></tr>' + ''.join(rows) + '</table>'))""")

md("""## Now it's your turn

Write your own puzzle as a formula — any variable names, with &, | and ~ — and let Grover search for solutions. Try more friends and more rules!""")
code("""my_puzzle = '((A & C) | (B & D)) & ~(A & D)'   # change me

vs = variables(my_puzzle)
n_solutions = sum(holds(my_puzzle, dict(zip(vs, bits))) for bits in product((False, True), repeat=len(vs)))
if n_solutions == 0:
    print("This puzzle has no solution at all — Grover can't find what isn't there.")
else:
    k = best_iterations(len(vs), n_solutions)
    print(f"Variables (right to left in the bit strings): {vs} — {n_solutions} solutions, {k} round(s)")
    display(plot_histogram(run(grover_circuit(oracle_for(my_puzzle), k))))""")

md(r"""# A classic 3-SAT problem

Three variables $x_1, x_2, x_3$ and five clauses with three literals each:

$$f(x_1, x_2, x_3) = (\neg x_1 \vee \neg x_2 \vee \neg x_3) \wedge (x_1 \vee \neg x_2 \vee x_3) \wedge (x_1 \vee x_2 \vee \neg x_3) \wedge (x_1 \vee \neg x_2 \vee \neg x_3) \wedge (\neg x_1 \vee x_2 \vee x_3)$$

SAT problems are usually exchanged in the **DIMACS CNF** text format: a line `p cnf <variables> <clauses>`, then one clause per line, with `k` for $x_k$, `-k` for $\neg x_k$, and `0` to end the clause. We translate it into a formula ourselves — that also shows what the format means.""")
code("""dimacs = '''c example DIMACS-CNF 3-SAT
p cnf 3 5
-1 -2 -3 0
1 -2 3 0
1 2 -3 0
1 -2 -3 0
-1 2 3 0
'''
# translate DIMACS into a formula: one (… | … | …) per clause, joined with &
clauses = [[int(x) for x in line.split()[:-1]] for line in dimacs.splitlines() if line and line[0] not in 'cp']
formula = ' & '.join('(' + ' | '.join(('~' if l < 0 else '') + f'x{abs(l)}' for l in clause) + ')' for clause in clauses)
print(formula)

counts = run(grover_circuit(oracle_for(formula), 1))
plot_histogram(counts, title='Assignments (bits read x3 x2 x1)')""")

md(r"""Three assignments stand out: reading the bit strings right to left as $x_1 x_2 x_3$ they are **000, 101 and 110**. With 3 solutions among 8, one Grover round finds a solution about 85% of the time — the rest is the small leftover chance of a wrong answer, which is why you always **check** the answer classically (easy for SAT!).""")

md("""## Classically: try them all

For three variables a classical computer simply tries all 2³ = 8 assignments:""")
code("""rows = []
for x in product((0, 1), repeat=3):
    ok = all(any((x[abs(l) - 1] == 1) if l > 0 else (x[abs(l) - 1] == 0) for l in clause) for clause in clauses)
    rows.append(f"<tr><td>{x[0]}</td><td>{x[1]}</td><td>{x[2]}</td><td>{'✅ solution' if ok else ''}</td></tr>")
display(HTML('<table><tr><th>x1</th><th>x2</th><th>x3</th><th>f</th></tr>' + ''.join(rows) + '</table>'))""")

md(r"""Trying everything doubles in effort with every extra variable — 2ⁿ checks. Grover needs about $\sqrt{2^n}$ rounds: still exponential, but far fewer. (Real SAT solvers are much smarter than brute force and handle formulas with millions of clauses; Grover's quadratic speed-up applies to the unstructured search at their core.)

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
}
nbf.write(nb, pathlib.Path(__file__).resolve().parent.parent / '3sat.ipynb')
print('written', len(cells), 'cells')
