import type { Context } from '../types';
import { KNOWLEDGE } from './knowledge.generated';

const text = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : null;

/** What the page sends: the path and title of the rasqberry.org page the visitor is reading. */
export function pageState(raw: unknown): Record<string, unknown> | null {
  const s = (raw ?? {}) as Record<string, unknown>;
  if (typeof s !== 'object' || Array.isArray(s)) return null;
  const out: Record<string, unknown> = {};
  const page = text(s.page, 200);
  if (page && /^\/[\w\-./#%]*$/.test(page)) out.page = page;
  const title = text(s.title, 200);
  if (title) out.title = title;
  return out;
}

export const rasqberryBuild: Context = {
  role:
    'You are the RasQberry helper on rasqberry.org. Visitors ask you how to plan, buy, 3D-print, assemble and set up ' +
    'their own RasQberry Two, the open-source model of IBM Quantum System Two with a Raspberry Pi inside, and how to ' +
    'fix problems along the way.',
  scope:
    'Stay on topic: building and setting up a RasQberry Two (parts, 3D printing, LEDs, the Raspberry Pi image, setup, ' +
    'troubleshooting), what it can do, and the quantum computing behind its demos. Answer from your knowledge below and ' +
    'link the rasqberry.org page that has the details. For anything else, say kindly that you can only help with ' +
    'RasQberry, and point to the GitHub issues (https://github.com/JanLahmann/RasQberry-Two/issues) for questions the ' +
    'pages do not answer.',
  englishOnly: true,
  stateTag: 'page_state',
  knowledge: KNOWLEDGE,
  state: pageState,
};
