# Reference probabilities for test/sat.test.ts, computed with Qiskit exactly as 3sat.ipynb does
# (PhaseOracleGate with sorted var_order + grover_operator), but as exact state vectors.
#   python test/fixtures/grover_qiskit.py > test/fixtures/grover_qiskit.json
import json, re, sys
import qiskit
from qiskit import QuantumCircuit
from qiskit.circuit.library import PhaseOracleGate, grover_operator
from qiskit.quantum_info import Statevector

FORMULAS = [
    '((A & B) | (C & D)) & ~(A & D)',                       # the party puzzle
    '(~x1 | ~x2 | ~x3) & (x1 | ~x2 | x3) & (x1 | x2 | ~x3) & (x1 | ~x2 | ~x3) & (~x1 | x2 | x3)',  # the 3-SAT example
    '((A & C) | (B & D)) & ~(A & D)',                       # the notebook's "your turn" example
    '(C & ~A) | (B & D & ~C)',                              # variables not in alphabetical order
    'x',                                                    # one variable
    '~a | b & c',                                           # precedence: ~ before & before |
    'Bob & ~alice | eve & (Dan | ~Bob)',                    # mixed case, longer names
    '(p | q) & (~p | r) & (~q | ~r) & (r | s | ~t)',        # five variables
    'a & b & c & d & e & f',                                # six variables, one solution
]

def variables(expr):
    return sorted(set(re.findall(r'[A-Za-z_]\w*', expr)))

out = {'qiskit': qiskit.__version__, 'cases': []}
for f in FORMULAS:
    vs = variables(f)
    n = len(vs)
    oracle = QuantumCircuit(n)
    oracle.append(PhaseOracleGate(f, var_order=vs), range(n))
    step = grover_operator(oracle)
    rounds = []
    for k in range(5):
        qc = QuantumCircuit(n)
        qc.h(range(n))
        for _ in range(k):
            qc.compose(step, inplace=True)
        rounds.append([round(p, 12) for p in Statevector(qc).probabilities()])
    out['cases'].append({'formula': f, 'vars': vs, 'probabilities': rounds})
json.dump(out, sys.stdout, indent=1)
