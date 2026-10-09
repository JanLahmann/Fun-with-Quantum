# Generates one social share card per game, portal/public/og/<slug>.png (1200×630), in the style of
# portal/public/og-card.png: the dice mark on the left, the game's title, its concept, how it plays
# (browser or notebook) and the site address.
#   python3 tools/og_cards.py   (needs Pillow; uses macOS system fonts, Avenir Next and Menlo)
# Not named build_…: the notebook CI runs every tools/build_*.py on Linux, without these fonts.
# Run it again when a game's title or concept changes; commit the PNGs.

import pathlib
import re

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORTAL = ROOT / 'portal'
OUT = PORTAL / 'public' / 'og'
BASE = Image.open(PORTAL / 'public' / 'og-card.png').convert('RGB')

PAPER, INK, MUTED, CYAN, MAGENTA = (246, 247, 250), (28, 29, 39), (91, 93, 112), (14, 124, 156), (194, 47, 110)
TITLE = ImageFont.truetype('/System/Library/Fonts/Avenir Next.ttc', 76, index=0)          # Bold
TITLE_SMALL = ImageFont.truetype('/System/Library/Fonts/Avenir Next.ttc', 62, index=0)
MONO = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 26)
X, MAX_W = 506, 640   # text column of og-card.png


def front_matter(path):
    text = path.read_text()
    fm = text.split('---')[1]
    get = lambda key: re.search(rf'^{key}:\s*(.+)$', fm, re.M)
    value = lambda key: get(key).group(1).strip().strip('"') if get(key) else None
    return {'title': value('title'), 'concept': value('concept'), 'webGame': value('webGame') == 'true'}


def wrap(draw, text, font, width):
    lines, line = [], ''
    for word in text.split():
        trial = f'{line} {word}'.strip()
        if draw.textlength(trial, font=font) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    return lines + [line]


def card(slug, game):
    im = Image.new('RGB', BASE.size, PAPER)
    im.paste(BASE.crop((150, 150, 450, 480)), (150, 150))   # the dice mark
    draw = ImageDraw.Draw(im)
    font = TITLE
    lines = wrap(draw, game['title'], font, MAX_W)
    if len(lines) > 2:
        font = TITLE_SMALL
        lines = wrap(draw, game['title'], font, MAX_W)
    line_h = font.size * 1.12
    kicker = wrap(draw, game['concept'].upper(), MONO, MAX_W)
    block = len(lines) * line_h + 22 + 32 + 40 * len(kicker) + 46 + 30
    y = (630 - block) / 2
    for line in lines:
        draw.text((X, y), line, font=font, fill=INK)
        y += line_h
    y += 22
    for i in range(96):   # the cyan-to-magenta rule
        t = i / 95
        color = tuple(round(a + (b - a) * t) for a, b in zip(CYAN, MAGENTA))
        draw.line([(X + i, y), (X + i, y + 4)], fill=color)
    y += 32
    for line in kicker:
        draw.text((X, y), line, font=MONO, fill=MUTED)
        y += 40
    y += 6
    draw.text((X, y), '▶ plays in your browser' if game['webGame'] else 'Jupyter notebook', font=MONO, fill=MAGENTA)
    y += 46
    draw.text((X, y), 'fun-with-quantum.org', font=MONO, fill=CYAN)
    im.save(OUT / f'{slug}.png', optimize=True)


OUT.mkdir(exist_ok=True)
for md in sorted((PORTAL / 'src' / 'content' / 'games').glob('*.md')):
    card(md.stem, front_matter(md))
    print('written', f'og/{md.stem}.png')
