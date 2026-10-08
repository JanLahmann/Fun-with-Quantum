# Reference state vectors for test/hardy.test.ts, computed with Qiskit exactly as Hardys-Paradox.ipynb
# builds the circuits: the factory (ry on car 1 = qubit 0, x on car 2 = qubit 1, cry from car 1 to
# car 2), then ry(−φ) on each car whose engine is checked. Amplitudes as [re, im], Qiskit order.
#   python test/fixtures/hardy_qiskit.py > test/fixtures/hardy_qiskit.json
import json, sys
import numpy as np
import qiskit
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

def factory(phi):
    k, s = np.cos(np.radians(phi) / 2), np.sin(np.radians(phi) / 2)
    a, c = k / np.sqrt(1 + k * k), s / np.sqrt(1 + k * k)
    qc = QuantumCircuit(2)
    qc.ry(2 * np.arccos(a), 0)
    qc.x(1)
    qc.cry(-2 * np.arctan2(a, c), 0, 1)
    return qc

out = {'qiskit': qiskit.__version__, 'cases': []}
for phi in (90, 0, 30, 76.3454152540245, 120, 150, 180):
    for c1 in (0, 1):
        for c2 in (0, 1):
            qc = factory(phi)
            if c1: qc.ry(np.radians(-phi), 0)
            if c2: qc.ry(np.radians(-phi), 1)
            sv = Statevector(qc)
            out['cases'].append({'phi': phi, 'c1': c1, 'c2': c2,
                                 'amplitudes': [[round(float(a.real), 12), round(float(a.imag), 12)] for a in sv.data]})
json.dump(out, sys.stdout, indent=1)
