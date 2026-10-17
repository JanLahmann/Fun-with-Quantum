import type { Context } from '../types';
import { GUIDE_KNOWLEDGE } from './guide.generated';
import { DEVICE_KNOWLEDGE } from '../rasqberry/device.generated';

/**
 * The RasQberry Two demos and learning paths, exactly as the helper on the Pi knows them: its knowledge
 * module is rebuilt from the demo manifests at every deploy (scripts/rasqberry-knowledge.mjs), so the guide
 * advises on today's demos. Empty if the sections ever move (test/guide.test.ts checks they are found).
 */
export function rasqberryDemos(device = DEVICE_KNOWLEDGE): string {
  const from = device.indexOf('## Demo groups');
  const to = device.indexOf('## Setting up and fixing the Pi');
  if (from < 0 || to < from) return '';
  return `# RasQberry Two demos — what you know

The demos and learning paths below come with RasQberry Two and run on the model's Raspberry Pi (from the demo
manifests on the Pi, current as of the last deploy). Use them to advise visitors who have, plan or will meet a
RasQberry Two: which demo fits their goal, audience, time and hardware (LED panel, screen, internet, IBM Quantum
account), and which learning path gives a guided order. Demos and paths marked beta are early versions; say so.
For the exact steps to start or fix a demo, point to the demo list on rasqberry.org
(https://rasqberry.org/03-quantum-computing-demos/01-demo-list/) and to Ket on rasqberry.org and on the Pi itself.

${device.slice(from, to).trim().replace(/^(#+) /gm, '#$1 ')}
`;
}

/** The portal pages the guide box is on (portal/src/components/KetGuide.astro). */
export const GUIDE_PAGES = ['/', '/play/', '/build/', '/learn/', '/teachers/', '/workshops/'] as const;

/** What the page sends: which of the guide's pages the visitor is on. Anything else is dropped. */
function state(raw: unknown): Record<string, unknown> | null {
  if (raw === null || raw === undefined) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const page = (raw as Record<string, unknown>).page;
  return typeof page === 'string' && (GUIDE_PAGES as readonly string[]).includes(page) ? { page } : {};
}

/** Ket on fun-with-quantum.org's home and door pages: which family member fits the visitor (#153). */
export const fwqGuide: Context = {
  role:
    'You are Ket, the guide on fun-with-quantum.org, the home of the Fun with Quantum family of open-source quantum ' +
    'computing projects. Visitors tell you what they want to do — play, build, learn, teach or run an event — and you ' +
    'point them to the projects and games of the family that fit them best.',
  scope:
    'Stay on topic: choosing among the family\'s projects and games, what they offer and what a visitor needs for them. ' +
    'Answer from your knowledge below and link the pages it names. Explaining quantum physics in depth is for the games ' +
    'and the learning projects: answer such a question in a sentence or two, then point to the project that teaches it. ' +
    'For anything else, say kindly that you help visitors find their way around the Fun with Quantum family, and offer ' +
    'to help with that.',
  stateTag: 'page_state',
  knowledge: `${GUIDE_KNOWLEDGE}\n${rasqberryDemos()}`,
  state,
};
