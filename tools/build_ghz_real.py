# Generates GHZ-on-Real-Devices.ipynb (outputs empty, plain notebook, no slideshow). Edit here, then run:
#   python tools/build_ghz_real.py   (needs nbformat)

import nbformat as nbf

from games import glance   # the "At a glance" box, from portal/src/content/games

nb = nbf.v4.new_notebook()
cells = []
def md(src):
    cells.append(nbf.v4.new_markdown_cell(src, id=f'cell-{len(cells)}'))  # stable ids: rebuilds diff cleanly
def code(src):
    cells.append(nbf.v4.new_code_cell(src, id=f'cell-{len(cells)}'))

md("""# GHZ on Real Quantum Devices<a name="top"></a>

### Winning the GHZ Game on a noisy quantum computer

In the [GHZ Game](GHZ-Game.ipynb), a team that shares three entangled qubits wins every round — on a perfect simulator. Real quantum computers make errors. In this notebook you play the game on simulated copies of IBM quantum computers, watch noise cost you rounds, and win them back: by choosing good qubits, with the transpiler, and with readout error mitigation. At the end you can run the same code on a real IBM quantum computer.

Lennart Schulze and Jan-R. Lahmann (2020); rebuilt for Qiskit 2.x in 2026. Part of [Fun with Quantum](https://fun-with-quantum.org).""")
md(glance('GHZ-on-Real-Devices.ipynb'))


md("""### Real or simulated?

Everything before Appendix B runs on your own computer, on **fake backends** from `qiskit-ibm-runtime`: simulators that copy a real IBM quantum computer — its qubits, their connections and its gates — and add noise taken from a calibration snapshot of that device. They imitate the device roughly as it was on the day of the snapshot (printed below), with a simplified noise model; the real device may have improved, changed or been retired since. You need no account.

[Appendix B](#appendix-b) runs the same code on a real IBM quantum computer. That needs a free IBM Quantum Platform account.""")

md("""### Contents

1. [The game on a perfect computer](#perfect)
2. [The game on noisy computers](#noisy)
3. [Choosing qubits: you and the transpiler](#qubits)
4. [Readout error mitigation](#mitigation)
5. [Putting it all together](#together)

Appendix A: [solution of the exercise](#appendix-a) · Appendix B: [run it on a real quantum computer](#appendix-b)""")

md("""## Setup

The first cell defines everything the notebook uses. Run it first (click into it and press Shift+Enter); you can read the details later.""")
code("""import numpy as np
import pandas as pd
from qiskit import QuantumCircuit
from qiskit.transpiler import generate_preset_pass_manager
from qiskit_aer import AerSimulator
from qiskit_ibm_runtime.fake_provider import FakeYorktownV2, FakeVigoV2, FakeBrisbane, FakeTorino, FakeFez, FakeMarrakesh

SHOTS = 10_000   # how often each circuit runs; the win rate is the share of winning shots
SEED = 2020      # fixed seeds: running the notebook again gives the same numbers
QUESTIONS = ['CCC', 'CSS', 'SCS', 'SSC']   # what Alice, Bob and you are asked: C = color, S = shape

def ghz_game_circuit(question):
    \"\"\"The quantum team's circuit for one question: qubit 0 = Alice, 1 = Bob, 2 = you.\"\"\"
    qc = QuantumCircuit(3, name=question)
    qc.h(0)
    qc.cx(0, 1)
    qc.cx(0, 2)                   # the GHZ state (|000⟩ + |111⟩)/√2
    qc.barrier()
    for qubit, asked in enumerate(question):
        if asked == 'S':
            qc.sdg(qubit)         # shape: measure Y (S†, then H)
        qc.h(qubit)               # color: measure X (H)
    qc.measure_all()              # result 1 = red / star
    return qc

def wins(question, counts):
    \"\"\"Share of winning shots: an even number of 1s for CCC, an odd number for the other questions.\"\"\"
    want = 0 if question == 'CCC' else 1
    return sum(n for bits, n in counts.items() if bits.count('1') % 2 == want) / sum(counts.values())

# --- running circuits ------------------------------------------------------------------------
_simulators = {}
def simulate(backend, circuits, shots=SHOTS):
    \"\"\"Run circuits on the fake backend's noisy simulator; returns one counts dict per circuit.\"\"\"
    if backend.name not in _simulators:
        _simulators[backend.name] = AerSimulator.from_backend(backend, seed_simulator=SEED)
    result = _simulators[backend.name].run(circuits, shots=shots).result()
    return [result.get_counts(i) for i in range(len(circuits))]

def transpile_game(backend, level=2, layout=None):
    \"\"\"The four game circuits, transpiled for the backend (layout = physical qubits for Alice, Bob, you).\"\"\"
    pm = generate_preset_pass_manager(optimization_level=level, backend=backend, initial_layout=layout, seed_transpiler=SEED)
    first = pm.run(ghz_game_circuit(QUESTIONS[0]))
    if layout is None:   # put the other three questions on the same qubits as the first
        layout = first.layout.initial_index_layout(filter_ancillas=True)
        pm = generate_preset_pass_manager(optimization_level=level, backend=backend, initial_layout=layout, seed_transpiler=SEED)
    return [first] + [pm.run(ghz_game_circuit(q)) for q in QUESTIONS[1:]]

def measured_qubits(circuit):
    \"\"\"The physical qubits that hold Alice's, Bob's and your answer when they are measured.\"\"\"
    return tuple(circuit.layout.final_index_layout())

def two_qubit_gates(circuit):
    return sum(1 for inst in circuit.data if inst.operation.num_qubits == 2 and inst.operation.name not in ('barrier', 'measure'))

# --- readout error mitigation ----------------------------------------------------------------
def calibration_circuits(backend, qubits):
    \"\"\"Prepare each of the 8 basis states 000 … 111 on the given physical qubits and measure them.\"\"\"
    pm = generate_preset_pass_manager(optimization_level=0, backend=backend, initial_layout=list(qubits))
    circuits = []
    for k in range(8):
        qc = QuantumCircuit(3, name=f'prepare {k:03b}')
        for i in range(3):
            if k >> i & 1:
                qc.x(i)
        qc.measure_all()
        circuits.append(pm.run(qc))
    return circuits

def readout_matrix(calibration_counts):
    \"\"\"A[m, k] = probability to read m when k was prepared (from the 8 calibration runs).\"\"\"
    A = np.zeros((8, 8))
    for k, counts in enumerate(calibration_counts):
        for bits, n in counts.items():
            A[int(bits, 2), k] += n / sum(counts.values())
    return A

def mitigate(counts, A):
    \"\"\"Undo the readout errors: solve A · p = measured for p, then remove small negative values.\"\"\"
    measured = np.zeros(8)
    for bits, n in counts.items():
        measured[int(bits, 2)] = n / sum(counts.values())
    p = np.clip(np.linalg.solve(A, measured), 0, None)
    return {f'{k:03b}': x for k, x in enumerate(p / p.sum())}

# --- one complete experiment -----------------------------------------------------------------
def play(backend, level=2, layout=None, mitigation=False, run=simulate, shots=SHOTS):
    \"\"\"Play all four questions on the backend and return the win rate (and the mitigated one).\"\"\"
    circuits = transpile_game(backend, level, layout)
    groups = sorted({measured_qubits(c) for c in circuits})
    jobs = circuits + [c for g in groups for c in calibration_circuits(backend, g)] if mitigation else circuits
    counts = run(backend, jobs, shots=shots)
    result = {'qubits': list(measured_qubits(circuits[0])),
              'two-qubit gates': two_qubit_gates(circuits[0]),
              'win rate': np.mean([wins(q, c) for q, c in zip(QUESTIONS, counts)])}
    if mitigation:
        A = {g: readout_matrix(counts[4 + 8 * i: 12 + 8 * i]) for i, g in enumerate(groups)}
        result['mitigated'] = np.mean([wins(q, mitigate(c, A[measured_qubits(circ)]))
                                       for q, c, circ in zip(QUESTIONS, counts, circuits)])
    return result

# --- error rates from the backend's calibration ------------------------------------------------
def two_qubit_gate(backend):
    return next(g for g in ('cz', 'ecr', 'cx') if g in backend.target.operation_names)

def readout_error(backend, q):
    return backend.target['measure'][(q,)].error

def pair_error(backend, a, b):
    gate = backend.target[two_qubit_gate(backend)]
    return (gate[(a, b)] if (a, b) in gate else gate[(b, a)]).error

def star_layouts(backend):
    \"\"\"Every placement without SWAPs: Alice's qubit in the middle, connected to Bob's and yours.\"\"\"
    neighbors = {}
    for a, b in backend.target[two_qubit_gate(backend)]:
        neighbors.setdefault(a, set()).add(b)
        neighbors.setdefault(b, set()).add(a)
    return [[center, a, c] for center, nbs in neighbors.items() for a in nbs for c in nbs if a < c]   # Bob ↔ you swapped is the same

def error_score(backend, layout):
    \"\"\"Chance that none of the 3 readouts and none of the 2 two-qubit gates fails (other errors left out).\"\"\"
    alice, bob, you = layout
    errors = [readout_error(backend, q) for q in layout] + [pair_error(backend, alice, bob), pair_error(backend, alice, you)]
    return np.prod([1 - e for e in errors])

def report(backend, layout):
    alice, bob, you = layout
    for who, q in zip(['Alice', 'Bob', 'you'], layout):
        print(f"{who:5} on qubit {q:3}: readout error {readout_error(backend, q):.2%}")
    for who, q in [('Bob', bob), ('you', you)]:
        try:
            print(f"{two_qubit_gate(backend)} between qubits {alice} and {q} (Alice–{who}): error {pair_error(backend, alice, q):.2%}")
        except KeyError:
            print(f"qubits {alice} and {q} (Alice–{who}) are not connected: the transpiler has to add SWAPs")

def snapshot(backend):
    return backend.properties().last_update_date.strftime('%Y-%m-%d')

pct = lambda x: f"{x:.1%}"
print("Ready.")""")

md("""## 1. The game on a perfect computer<a name="perfect"></a>
[[Top](#top)]

A quick reminder of the rules (the [GHZ Game](GHZ-Game.ipynb) has the full story). Alice, Bob and you are each asked about an object's **color** (C) or its **shape** (S) and answer without talking to each other. The referee asks one of four questions: everyone about the color (CCC), or one player about the color and the other two about the shape (CSS, SCS, SSC). Your team wins if the number of "red" and "star" answers is **even** for CCC and **odd** for the other three.

No classical strategy answers all four questions correctly: the best classical team wins **3 of 4** — 75% of the rounds if the referee picks the questions at random. Random answers win 50%.

The quantum team shares the three qubits of a GHZ state. Each player measures their qubit: X for color, Y for shape. This is the circuit for SSC:""")
code("""ghz_game_circuit('SSC').draw()""")
md("""On a perfect simulator, the quantum team wins every round of all four questions:""")
code("""ideal = AerSimulator(seed_simulator=SEED)
counts = ideal.run([ghz_game_circuit(q) for q in QUESTIONS], shots=SHOTS).result().get_counts()
for q, c in zip(QUESTIONS, counts):
    print(f"{q}: wins {pct(wins(q, c))}   {c}")""")
md("""For the rest of the notebook, the **win rate** is the average over the four questions: the share of rounds the team wins when the referee picks the questions at random. 100% is perfect; above 75% beats every classical team.""")

md("""## 2. The game on noisy computers<a name="noisy"></a>
[[Top](#top)]

Now the same four circuits run on simulated copies of six IBM quantum computers: two small 5-qubit devices from the early years of IBM's quantum cloud, and four large ones — ibm_brisbane with an Eagle processor, ibm_torino, ibm_fez and ibm_marrakesh with Heron processors. The table shows the date of each calibration snapshot. The transpiler prepares the circuits for each device with its default settings.""")
code("""backends = [FakeYorktownV2(), FakeVigoV2(), FakeBrisbane(), FakeTorino(), FakeFez(), FakeMarrakesh()]

rows = []
for backend in backends:
    r = play(backend)
    rows.append({'device': backend.name, 'qubits': backend.num_qubits, 'two-qubit gate': two_qubit_gate(backend),
                 'snapshot': snapshot(backend), 'win rate': pct(r['win rate'])})
pd.DataFrame(rows)""")
md("""The quantum team still beats every classical team — on the oldest device only just — but nowhere does it win every round. The errors come from three sources:

* **Gate errors:** every gate, especially every two-qubit gate, slightly misses its target.
* **Readout errors:** the measurement sometimes reports 1 for a 0 or the other way round.
* **Decoherence:** a qubit slowly loses its state while it waits.

The calibration snapshot of each device lists these error rates for every qubit and every connection. The next chapter uses them.""")

md("""## 3. Choosing qubits: you and the transpiler<a name="qubits"></a>
[[Top](#top)]

From now on we work with `fake_torino`, a copy of ibm_torino (133 qubits, Heron processor). Its qubits are connected in a heavy-hex pattern: most qubits are connected to two or three neighbors, and a two-qubit gate works only between connected qubits.

**Optimization level 0** does no optimization: Alice's, Bob's and your circuit qubits simply go to physical qubits 0, 1 and 2. But Alice's qubit needs a CNOT with both others, and physical qubits 0 and 2 are not connected:""")
code("""backend = FakeTorino()
report(backend, [0, 1, 2])""")
md("""So the transpiler adds a SWAP (three more two-qubit gates) to bring the qubits together, and it translates every gate into the device's own gates (CZ, √X, Rz and X on Heron). Look at the transpiled circuit and count its two-qubit gates (CZ). After the SWAP, Bob's and your answers are measured on each other's original qubits:""")
code("""level0 = transpile_game(backend, level=0)[3]
print(f"two-qubit gates: {two_qubit_gates(level0)}, qubits measured: {measured_qubits(level0)}")
level0.draw(idle_wires=False, fold=120)""")
code("""print(f"win rate on qubits 0, 1, 2 (level 0): {pct(play(backend, level=0)['win rate'])}")""")
md("""That is barely better than a classical team. Two things went wrong: the SWAP adds gates, and — as the readout errors above show — these three qubits are not among the device's best.

**Choose the qubits yourself.** The circuit fits without SWAPs if Alice's qubit sits in the middle, connected to Bob's and yours. `star_layouts` lists all such placements; `error_score` estimates for each one the chance that none of its three readouts and two CZ gates fails, from the calibration data. It ignores single-qubit gate errors and decoherence, so it is only a guide.""")
code("""layouts = sorted(star_layouts(backend), key=lambda l: error_score(backend, l))
best, worst = layouts[-1], layouts[0]
print(f"{len(layouts)} placements without SWAPs")
print(f"best {best}: estimate {pct(error_score(backend, best))}")
report(backend, best)
print(f"worst {worst}: estimate {pct(error_score(backend, worst))}")
report(backend, worst)""")
code("""for name, layout in [('best', best), ('worst', worst)]:
    r = play(backend, level=0, layout=layout)
    print(f"{name} placement {layout}: {r['two-qubit gates']} two-qubit gates, win rate {pct(r['win rate'])}")""")
md("""An error of 100% means the calibration found that connection not working. The worst placement uses one, and the team wins only about half the rounds — no better than guessing. The best placement wins far more rounds than qubits 0, 1, 2.""")
md("""**Let the transpiler choose.** From optimization level 1 on, the transpiler first looks for a "perfect" placement — one that needs no SWAPs — and uses the backend's error rates to choose among the candidates (Qiskit's `VF2Layout`; level 1 first tries qubits 0, 1, 2). Higher levels search longer and optimize the circuit more:""")
code("""rows = []
for level in range(4):
    r = play(backend, level=level)
    rows.append({'level': level, 'measured on (Alice, Bob, you)': r['qubits'], 'two-qubit gates': r['two-qubit gates'],
                 'estimate': pct(error_score(backend, r['qubits'])) if r['two-qubit gates'] == 2 else '—',
                 'win rate': pct(r['win rate'])})
pd.DataFrame(rows)""")
md("""From level 1 on, the transpiler finds a placement without SWAPs on good qubits — as good as our own choice or close to it. For a three-qubit circuit this is easy; for circuits with hundreds of qubits, a good layout is one of the transpiler's hardest and most important jobs. More: [transpiler stages](https://quantum.cloud.ibm.com/docs/guides/transpiler-stages) in the IBM Quantum documentation.""")

md("""## 4. Readout error mitigation<a name="mitigation"></a>
[[Top](#top)]

The win rates above still fall short of 100%. Part of the loss happens at the very end: the measurement sometimes reports the wrong bit. **Readout error mitigation** measures how often that happens and corrects the results for it:

1. **Calibrate:** prepare each of the 8 basis states 000 … 111 on the same three physical qubits and measure them. This gives the matrix A: A[m, k] is the probability to read m when k was prepared.
2. **Correct:** the measured probabilities are A times the probabilities before readout. Solving this linear system gives an estimate of the probabilities before readout.

Here is the calibration on qubits 0, 1, 2 of `fake_torino`, where qubit 0 has a high readout error:""")
code("""calibration = calibration_circuits(backend, [0, 1, 2])
A = readout_matrix(simulate(backend, calibration))
print("rows: read 000 … 111, columns: prepared 000 … 111")
print(np.array2string(A, precision=3, suppress_small=True))""")
md("""Without readout errors, A would be the identity matrix. Now the mitigated win rates, on the poor qubits 0, 1, 2 and on the transpiler's choice:""")
code("""for name, level in [('qubits 0, 1, 2 (level 0)', 0), ('transpiler (level 2)', 2)]:
    r = play(backend, level=level, mitigation=True)
    print(f"{name}: win rate {pct(r['win rate'])} → mitigated {pct(r['mitigated'])}")""")
md("""Mitigation wins back most of the rounds that readout errors cost — and it helps most where readout was worst. A few things to keep in mind:

* It corrects **readout errors only**. Errors from gates and decoherence remain; that is why the mitigated win rate stays below 100%.
* The result is a corrected **estimate of the probabilities**, not a list of better shots. It inherits the statistical uncertainty of both the calibration and the experiment.
* The calibration needs 2ⁿ circuits for n qubits — fine for 3, impossible for 100. Larger experiments assume independent errors per qubit or use methods that scale, such as the `mthree` package or TREX (Twirled Readout Error eXtinction), which IBM's Estimator primitive applies at its default resilience level 1. More: [error mitigation and suppression techniques](https://quantum.cloud.ibm.com/docs/guides/error-mitigation-and-suppression-techniques) in the IBM Quantum documentation.""")

md("""## 5. Putting it all together<a name="together"></a>
[[Top](#top)]

All six devices, three ways: level 0 on qubits 0, 1, 2; the transpiler's choice (level 2); and the transpiler's choice with readout error mitigation.""")
code("""rows = []
for b in backends:
    plain = play(b, level=0)
    tuned = play(b, level=2, mitigation=True)
    rows.append({'device': b.name, 'level 0, qubits 0–2': pct(plain['win rate']), 'level 2': pct(tuned['win rate']),
                 'level 2 + mitigation': pct(tuned['mitigated'])})
pd.DataFrame(rows)""")
md("""Good qubits and readout mitigation bring every device to 96% or more — even the oldest one. On real hardware the numbers vary from day to day as the calibration drifts, and on a real device you would also measure the readout matrix again for every experiment.

### Your turn

Pick a device and three qubits of your own: change `my_backend` and `my_layout` below. Remember that Alice's qubit (the first number) must be connected to the other two, or the transpiler adds SWAPs. Questions to explore:

* Can you find a placement where mitigation barely helps? What does `report` show for its qubits?
* How far apart are the best and the worst placement without SWAPs on your device, with and without mitigation?

A solution is in [Appendix A](#appendix-a).""")
code("""my_backend = FakeBrisbane()
my_layout = [1, 0, 2]          # physical qubits for Alice, Bob and you

report(my_backend, my_layout)
r = play(my_backend, level=0, layout=my_layout, mitigation=True)
print(f"{r['two-qubit gates']} two-qubit gates: win rate {pct(r['win rate'])} → mitigated {pct(r['mitigated'])}")""")

md("""## Summary

* Noise costs the quantum team rounds. On good qubits it still beats every classical team on all six devices — on bad ones it can fall to guessing.
* **Where** a circuit runs matters: unconnected qubits need extra SWAP gates, and qubits differ in quality. The transpiler (level 1 and up) picks good, connected qubits from the calibration data.
* **Readout error mitigation** corrects measurement errors with a little extra calibration — for small circuits.
* Gate errors and decoherence remain. Reducing them is what error suppression, further mitigation methods and, in the long run, quantum error correction are about.

Thank you for playing! More games: the [GHZ Game](GHZ-Game.ipynb), the [CHSH Game](CHSH-Game.ipynb) and the [Mermin–Peres Magic Square](Mermin-Peres-Game.ipynb).""")

md("""---
## Appendix<a name="appendix"></a>
[[Top](#top)]

### A: A solution of the exercise<a name="appendix-a"></a>

The best and the worst placement without SWAPs on `fake_brisbane`, with and without mitigation:""")
code("""my_backend = FakeBrisbane()
layouts = sorted(star_layouts(my_backend), key=lambda l: error_score(my_backend, l))
for name, layout in [('best', layouts[-1]), ('worst', layouts[0])]:
    print(f"{name} placement {layout} (estimate {pct(error_score(my_backend, layout))}):")
    report(my_backend, layout)
    r = play(my_backend, level=0, layout=layout, mitigation=True)
    print(f"  → win rate {pct(r['win rate'])}, mitigated {pct(r['mitigated'])}\\n")""")
md("""The worst placement uses a connection the calibration marked as not working (error 100%): the team guesses, and no readout correction can repair that. Mitigation helps most where readout errors are large and gate errors small.""")

md("""### B: Run it on a real quantum computer<a name="appendix-b"></a>

The same experiment — four game circuits and eight calibration circuits on the transpiler's qubits — runs on a real IBM quantum computer with the **Sampler** from `qiskit-ibm-runtime`.

1. Create a free account on [IBM Quantum Platform](https://quantum.cloud.ibm.com) (Open Plan: up to 10 minutes of quantum computer time per 28 days) and copy your API key from the dashboard.
2. Set `RUN_ON_HARDWARE = True` below and run the cell. It asks for your API key; the key is used for this session only and not saved.
3. Your job waits in a queue with everyone else's; this can take minutes or longer. With 4000 shots for each of the 12 circuits, this experiment uses well under a minute of quantum computer time.

**Keep your API key private:** don't type it into a notebook you share, and don't save it on a shared machine such as a public Binder session. If you saved an account on a shared machine, remove it with `QiskitRuntimeService.delete_account()`.

With `RUN_ON_HARDWARE = False`, the cell runs the same code on `fake_fez`.""")
code("""RUN_ON_HARDWARE = False

try:
    from qiskit_ibm_runtime.executor_sampler import Sampler   # qiskit-ibm-runtime 0.50 and newer
except ImportError:
    from qiskit_ibm_runtime import SamplerV2 as Sampler       # older versions

def sampler_run(backend, circuits, shots):
    \"\"\"Run circuits with the Sampler from qiskit-ibm-runtime (on hardware, or locally on a fake backend).\"\"\"
    job = Sampler(mode=backend).run(circuits, shots=shots)
    print(f"job {job.job_id()} sent to {backend.name}, waiting for the result …")
    return [r.data.meas.get_counts() for r in job.result()]

if RUN_ON_HARDWARE:
    from getpass import getpass
    from qiskit_ibm_runtime import QiskitRuntimeService
    service = QiskitRuntimeService(channel="ibm_quantum_platform", token=getpass("IBM Quantum API key: "))
    real_backend = service.least_busy(operational=True, simulator=False)
else:
    real_backend = FakeFez()

r = play(real_backend, level=2, mitigation=True, run=sampler_run, shots=4000)
print(f"{real_backend.name}, qubits {r['qubits']}: win rate {pct(r['win rate'])} → mitigated {pct(r['mitigated'])}")""")
md("""On a real device the result changes from run to run and from day to day. Compare it with the simulated copies above: is the real device better or worse than its last snapshot?

*Lennart Schulze and Jan-R. Lahmann, IBM Germany (2020); rebuilt 2026.*""")

nb.cells = cells
nb.metadata = {
    'kernelspec': {'display_name': 'Python 3 (ipykernel)', 'language': 'python', 'name': 'python3'},
    'language_info': {'name': 'python'},
}
import pathlib
nbf.write(nb, pathlib.Path(__file__).resolve().parent.parent / 'GHZ-on-Real-Devices.ipynb')
print('written', len(cells), 'cells')
