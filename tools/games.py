# The games list, read from portal/src/content/games/*.md — the one source for the game names,
# their order and the teacher facts. Used by tools/build_games_list.py and by the notebook builders
# (the "At a glance" box on each notebook's first slide).

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def _front_matter(path):
    """The few YAML shapes the game files use: `key: value` and `key:` followed by `  - item` lines."""
    out, key = {}, None
    for line in path.read_text().split('---')[1].splitlines():
        if not line.strip() or line.lstrip().startswith('#'):
            continue
        item = re.match(r'^\s+-\s+(.*)$', line)
        if item and key:
            out.setdefault(key, []).append(item.group(1).strip().strip('"'))
            continue
        m = re.match(r'^(\w+):\s*(.*)$', line)
        if m:
            key = m.group(1)
            if m.group(2):
                out[key] = m.group(2).strip().strip('"')
    return out


def load_games():
    games = [dict(_front_matter(p), slug=p.stem) for p in (ROOT / 'portal/src/content/games').glob('*.md')]
    return sorted(games, key=lambda g: int(g['order']))


def game_for(notebook):
    return next(g for g in load_games() if g['notebook'] == notebook)


def glance(notebook):
    """The "At a glance" box for a notebook's first slide."""
    g = game_for(notebook)
    goals = '\n'.join(f'- {x}' for x in g['goals'])
    return (f"> **At a glance** · {g['duration']} · level: {g['level'].lower()} · {g['concept']}\n>\n"
            f"> *Prerequisites:* {g['prerequisites']}\n>\n"
            f"> *In this notebook you:*\n>\n" + '\n'.join(f'> {line}' for line in goals.splitlines()))
