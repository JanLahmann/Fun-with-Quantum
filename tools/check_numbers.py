# "Numbers come from code": every percentage, decimal number and fraction in the texts players read
# must be listed below — with a computation that reproduces it, or (for the few that are not physics,
# such as a Qiskit version) with the reason it may stand. A new number in a text fails CI until it
# gets an entry here, so no figure reaches the site or a notebook unchecked.
#   python3 tools/check_numbers.py      exits 1 on an unlisted number or a failing computation
# Scanned: the markdown of every notebook, README.md, the game pages (portal/src/content/games), the
# browser games' English texts (portal/src/lib/*/messages.ts, qcoin/i18n/en.ts; the other languages
# are kept equal by the parity tests) and the portal's pages (outside <style>).

import glob
import json
import math
import pathlib
import re
import sys
from itertools import product

ROOT = pathlib.Path(__file__).resolve().parent.parent
deg = math.radians
pct = lambda p, digits=1: f'{100 * p:.{digits}f}%'


def grover(M, N, rounds):
    """Chance that Grover's search with M solutions among N finds one after `rounds` rounds."""
    theta = math.asin(math.sqrt(M / N))
    return math.sin((2 * rounds + 1) * theta) ** 2


def party_solutions():
    """Solutions of the party puzzle in 3sat.ipynb: ((A & B) | (C & D)) & ~(A & D)."""
    return sum(1 for A, B, C, D in product((0, 1), repeat=4) if ((A and B) or (C and D)) and not (A and D))


HARDY_X = (math.sqrt(5) - 1) / 2          # the best cos²(φ/2)
HARDY_MAX = (5 * math.sqrt(5) - 11) / 2   # Hardy's maximum for two qubits
CHSH_Q = math.cos(math.pi / 8) ** 2       # = 1/2 + √2/4, Tsirelson's bound as a win rate

# token -> (computation that must be True, or None) and what the number is
NUMBERS = {
    # CHSH game
    '75%': (lambda: pct(3 / 4, 0) == '75%', 'best classical win rate in the CHSH and GHZ games: 3 of 4'),
    '85.4%': (lambda: pct(CHSH_Q) == '85.4%' and abs(CHSH_Q - (0.5 + math.sqrt(2) / 4)) < 1e-12, 'CHSH quantum win rate cos²(22.5°)'),
    '85%': (lambda: pct(CHSH_Q, 0) == '85%', 'CHSH quantum win rate, rounded'),
    '14.6%': (lambda: pct(math.cos(deg(67.5)) ** 2) == '14.6%', 'cos²(67.5°), same answers for x = y = 1'),
    '22.5': (lambda: 45 / 2 == 22.5, 'half of the 45° angle between the arrows (Bloch circle → state angle)'),
    '67.5': (lambda: 135 / 2 == 67.5, 'half of 135°'),
    '2.83': (lambda: f'{2 * math.sqrt(2):.2f}' == '2.83', '2√2, the largest quantum CHSH value S'),
    '1/2': (None, 'formula fragment: win rate 1/2 + S/8'),
    '2/8': (lambda: 0.5 + 2 / 8 == 0.75, 'formula fragment: 1/2 + 2/8 = 75%'),
    '2/4': (lambda: abs(0.5 + math.sqrt(2) / 4 - CHSH_Q) < 1e-12, 'formula fragment: 1/2 + √2/4 = cos²(22.5°)'),
    '50%': (None, 'random answers win half the rounds (CHSH, GHZ); a measurement outcome with probability 1/2'),
    '50/50': (None, 'GHZ state measured in Z: 000 or 111, each with probability 1/2'),
    '100%': (None, 'certainty: a perfect device, a sure outcome, an imagined PR box — or "100% open source"'),
    # Mermin–Peres magic square
    '88.9%': (lambda: pct(8 / 9) == '88.9%', 'best classical team: 8 of 9 questions'),
    # Hardy's paradox
    '0%': (None, 'the outcome every classical spec sheet forbids'),
    '1/12': (lambda: abs((1 / (2 * math.sqrt(3))) ** 2 - 1 / 12) < 1e-12, 'both diesel with the engine at X: (1/(2√3))²'),
    '8.33%': (lambda: pct(1 / 12) == '8.33%' or pct(1 / 12, 2) == '8.33%', '1/12'),
    '1/3': (None, 'the factory state of Hardys-Paradox.ipynb: red with probability 1/3 (checked against Qiskit in portal/test/fixtures/hardy_qiskit.py)'),
    '2/3': (None, 'blue with probability 2/3 in Hardy; the heavy-output threshold 2/3 of the Quantum Volume protocol'),
    '9.02%': (lambda: pct(HARDY_MAX, 2) == '9.02%', "Hardy's maximum (5√5 − 11)/2"),
    '9%': (lambda: pct(HARDY_MAX, 0) == '9%', "Hardy's maximum, rounded"),
    '0.618': (lambda: f'{HARDY_X:.3f}' == '0.618', 'the best cos²(φ/2) = (√5 − 1)/2'),
    '76.35': (lambda: f'{math.degrees(2 * math.acos(math.sqrt(HARDY_X))):.2f}' == '76.35', 'the best angle φ'),
    # 3-SAT / Grover
    '84%': (lambda: abs(grover(3, 8, 1) - 27 / 32) < 1e-12 and pct(27 / 32, 0) == '84%', 'one Grover round, 3 solutions among 8'),
    '16%': (lambda: pct(1 - 27 / 32, 0) == '16%', 'the wrong answers after one round'),
    '99%': (lambda: pct(grover(3, 8, 3), 0) == '99%', 'three Grover rounds, 3 solutions among 8'),
    '25%': (lambda: party_solutions() == 4 and abs(grover(4, 16, 1) - 1) < 1e-12 and pct(grover(4, 16, 2), 0) == '25%'
            and pct(0.5 ** 2, 0) == '25%', 'party puzzle: 1 round 100%, 2 rounds 25%; an amplitude of 0.5 is a probability of 25%'),
    '0.5': (None, 'an amplitude of 0.5 (3-SAT browser game)'),
    # Prisoner's dilemma
    '2.25': (lambda: (3 + 0 + 5 + 1) / 4 == 2.25, 'average payoff when all four outcomes are equally likely (payoffs 3, 0, 5, 1)'),
    '2.5': (None, 'Eisert & Wilkens (2000): another random equilibrium worth 2.5 each — from the paper'),
    # GHZ on real devices — simulation results, printed by the notebook itself
    '96%': (None, 'GHZ-on-Real-Devices: lowest mitigated win rate in its own results table (fake backends, fixed seeds)'),
    # not physics
    '97.7%': (None, 'Quantum Volume protocol: confidence level two standard deviations (from the protocol)'),
    '2.1': (None, 'Qiskit version 2.1 / QuBins image 2.1-xl'),
    '3.1': (None, 'tutorial part 3.1'),
    '3.2': (None, 'tutorial part 3.2'),
    '1904.01502': (None, 'arXiv number'),
    '99.95': (None, 'display threshold in pct() (3-SAT browser game)'),
    '99.9%': (None, 'display text ">99.9%" for almost-sure outcomes'),
    '0.05': (None, 'display threshold in pct()'),
    '0.1%': (None, 'display text "<0.1%"'),
}

TOKEN = re.compile(r'(?<![\w.])(\d+(?:\.\d+)?\s?%|\d+\.\d+(?!\.\d)|\d+\s?/\s?\d+(?![\d/]))')


def clean(text):
    text = re.sub(r'<style.*?</style>', ' ', text, flags=re.S)
    return re.sub(r'https?://\S+|\(\S+\.(ipynb|png|pdf)\)|`[^`]*`', ' ', text)


def sources():
    for p in sorted(ROOT.glob('*.ipynb')):
        for c in json.loads(p.read_text())['cells']:
            if c['cell_type'] == 'markdown':
                yield p.name, ''.join(c['source'])
    files = (['README.md'] + glob.glob('portal/src/content/games/*.md', root_dir=ROOT)
             + glob.glob('portal/src/lib/*/messages.ts', root_dir=ROOT) + ['portal/src/lib/qcoin/i18n/en.ts']
             + glob.glob('portal/src/pages/**/*.astro', root_dir=ROOT, recursive=True))
    for f in sorted(files):
        yield f, (ROOT / f).read_text()


errors, used = [], set()
for name, text in sources():
    for m in TOKEN.finditer(clean(text)):
        token = m.group(1).replace(' ', '')
        if token not in NUMBERS:
            errors.append(f'{name}: "{token}" is not in tools/check_numbers.py — add it with a computation or a reason')
        used.add(token)
for token, (check, why) in NUMBERS.items():
    if check is not None and not check():
        errors.append(f'"{token}": the computation does not reproduce it ({why})')
unused = sorted(set(NUMBERS) - used)

print(f'{len(used)} numbers checked, {sum(1 for t in used if NUMBERS.get(t, (None,))[0])} of them computed'
      + (f'; not found in any text any more: {", ".join(unused)}' if unused else ''))
for e in sorted(set(errors)):
    print('✗', e)
sys.exit(1 if errors else 0)
