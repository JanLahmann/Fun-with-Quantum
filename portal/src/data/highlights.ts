/**
 * Family news for the homepage highlight box — the one place to edit.
 *
 * The homepage shows every entry, in this order, below the three doors
 * (src/components/Highlights.astro). Delete an entry to take it down; an empty list shows no box.
 * Keep each one short: a badge, a title, one or two sentences, one or two links.
 *
 * A click on a link is the Umami event "Portal: highlight click" with the properties `id` and
 * `target` (listed in ../../../family/EVENTS.md).
 */
export interface HighlightLink {
  label: string;
  href: string;
  /** Umami `target` property, e.g. 'rasqberry' or 'release-notes'. */
  target: string;
}

export interface Highlight {
  /** Short slug, sent as the Umami `id` property. */
  id: string;
  /** Small label above the title, e.g. 'New beta'. */
  badge: string;
  title: string;
  text: string;
  /** The first link is the button, the others plain links. External links open in a new tab. */
  links: HighlightLink[];
}

export const HIGHLIGHTS: Highlight[] = [
  {
    // RasQberry Two beta-2026-10-04-143935. For a newer beta, update the release tag below;
    // when a stable release ships, reword or remove this entry.
    id: 'rasqberry-two-beta-2026-10',
    badge: 'New beta',
    title: 'RasQberry Two: the SD card stays in the Pi',
    text:
      "The 3D-printed model of IBM Quantum System Two with a Raspberry Pi inside now installs new releases over the air, and falls back by itself if one doesn't work. New too: several new demos and games, a Workshop & Qiskit Server for a whole class, learning paths through the demos, and this website on the Pi, offline.",
    links: [
      { label: 'Try the beta', href: 'https://rasqberry.org/', target: 'rasqberry' },
      {
        label: "What's new",
        href: 'https://github.com/JanLahmann/RasQberry-Two/releases/tag/beta-2026-10-04-143935',
        target: 'release-notes',
      },
    ],
  },
];
