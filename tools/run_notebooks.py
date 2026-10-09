"""Run notebooks headless and fail on the first error in any of them.

    python tools/run_notebooks.py                 # every notebook at the repository root
    python tools/run_notebooks.py GHZ-Game.ipynb  # only these

Each notebook runs in a fresh kernel from the repository root (so `GHZGame/ghzGame.py` and the
other helpers import as they do in Jupyter). The notebooks are not changed. A first cell answers
input() (the GHZ game's quiz) with "d"; a last cell prints the Qiskit version the kernel really used. Needs nbformat, nbclient and ipykernel.
"""

import sys
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient
from nbclient.exceptions import CellExecutionError

ROOT = Path(__file__).resolve().parent.parent
# ipykernel puts its own input() back before every cell, so answer in the kernel itself
ANSWER = "get_ipython().kernel.raw_input = lambda prompt='': 'd'"
VERSIONS = "import qiskit, qiskit_aer; print('Qiskit', qiskit.__version__, '· Aer', qiskit_aer.__version__)"


def run(path: Path) -> bool:
    nb = nbformat.read(path, as_version=4)
    nb.cells.insert(0, nbformat.v4.new_code_cell(ANSWER))
    nb.cells.append(nbformat.v4.new_code_cell(VERSIONS))
    start = time.monotonic()
    try:
        NotebookClient(nb, timeout=1200, kernel_name="python3", resources={"metadata": {"path": str(ROOT)}}).execute()
    except CellExecutionError as e:
        print(f"FAIL {path.name} ({time.monotonic() - start:.0f} s)\n{e}", flush=True)
        return False
    versions = "".join(o.get("text", "") for o in nb.cells[-1].outputs).strip()
    print(f"ok   {path.name} ({time.monotonic() - start:.0f} s) · {versions}", flush=True)
    return True


def main() -> int:
    paths = [ROOT / a for a in sys.argv[1:]] or sorted(ROOT.glob("*.ipynb"))
    failed = [p.name for p in paths if not run(p)]
    if failed:
        print("failed:", ", ".join(failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
