# Reference outcomes for test/pd.test.ts, computed with Qiskit exactly as Prisoners-Dilemma.ipynb builds
# the circuit — ryy(π/2) = J, each move as rz(−φ+α), ry(−θ), rz(−φ−α), then ryy(−π/2) = J† — and checked
# against the matrices of Eisert, Wilkens and Lewenstein: J = (I⊗I + i·D⊗D)/√2 and U(θ, φ, α).
# Alice is qubit 0, Bob qubit 1. Amplitudes as [re, im] in Qiskit order (index = Alice + 2·Bob).
#   python test/fixtures/pd_qiskit.py > test/fixtures/pd_qiskit.json
import json, sys
import numpy as np
import qiskit
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

def U(theta, phi, alpha=0):
    t, p, a = np.radians([theta, phi, alpha])
    return np.array([[np.exp(1j * p) * np.cos(t / 2), np.exp(1j * a) * np.sin(t / 2)],
                     [-np.exp(-1j * a) * np.sin(t / 2), np.exp(-1j * p) * np.cos(t / 2)]])

D = U(180, 0)
J = (np.eye(4) + 1j * np.kron(D, D)) / np.sqrt(2)

def move(qc, m, q):
    theta, phi, alpha = m
    qc.rz(np.radians(-phi + alpha), q); qc.ry(np.radians(-theta), q); qc.rz(np.radians(-phi - alpha), q)

MOVES = {'C': (0, 0, 0), 'D': (180, 0, 0), 'Q': (0, 90, 0), 'iX': (180, 0, 90),
         'm1': (40, 25, 0), 'm2': (130, 70, 0), 'm3': (75, 200, 310), 'm4': (155, 15, 45)}
out = {'qiskit': qiskit.__version__, 'cases': []}
for a_name, a in MOVES.items():
    for b_name, b in MOVES.items():
        qc = QuantumCircuit(2)
        qc.ryy(np.pi / 2, 0, 1); move(qc, a, 0); move(qc, b, 1); qc.ryy(-np.pi / 2, 0, 1)
        sv = Statevector(qc).data
        ref = J.conj().T @ np.kron(U(*b), U(*a)) @ J @ np.array([1, 0, 0, 0])   # Qiskit order: Bob ⊗ Alice
        assert abs(abs(np.vdot(ref, sv)) - 1) < 1e-12, (a_name, b_name)          # same state (up to a global phase)
        out['cases'].append({'alice': list(a), 'bob': list(b), 'names': [a_name, b_name],
                             'amplitudes': [[round(float(z.real), 12), round(float(z.imag), 12)] for z in sv]})
json.dump(out, sys.stdout, indent=1)
