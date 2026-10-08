# Reference probabilities for test/chsh.test.ts, computed with Qiskit exactly as CHSH-Game.ipynb
# builds the circuit (Bell pair, then ry(−α) on Alice's qubit 0 and ry(−β) on Bob's qubit 1), as
# exact state vectors. Angles in degrees on the Bloch circle. The "plain" cases leave out the Bell pair
# (ry(−α) on qubit 0, ry(−β) on qubit 1, from |00⟩): they are not symmetric in Alice and Bob, so they
# catch a swapped qubit or a wrong Ry sign. Amplitudes are stored too, as [re, im].
#   python test/fixtures/chsh_qiskit.py > test/fixtures/chsh_qiskit.json
import json, sys
import numpy as np
import qiskit
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

PAIRS = [(0, 45), (0, -45), (90, 45), (90, -45),      # the best angles: the four questions
         (0, 0), (90, 0), (0, 90), (90, 90),          # everything along Z or X
         (30, -75), (-120, 170), (5, 355), (180, 0), (-180, 135), (17, 263)]

PLAIN = [(30, 0), (0, 70), (-50, 120), (90, -45)]

out = {'qiskit': qiskit.__version__, 'cases': []}
for bell, pairs in ((True, PAIRS), (False, PLAIN)):
    for alpha, beta in pairs:
        qc = QuantumCircuit(2)
        if bell:
            qc.h(0); qc.cx(0, 1)
        qc.ry(np.radians(-alpha), 0); qc.ry(np.radians(-beta), 1)
        sv = Statevector(qc)
        out['cases'].append({'bell': bell, 'alpha': alpha, 'beta': beta,
                             'probabilities': [round(float(p), 12) for p in sv.probabilities()],
                             'amplitudes': [[round(float(a.real), 12), round(float(a.imag), 12)] for a in sv.data]})
json.dump(out, sys.stdout, indent=1)
