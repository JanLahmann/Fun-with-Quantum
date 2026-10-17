import { GUIDE_KNOWLEDGE } from './guide.generated';

/**
 * The Fun with Quantum family and its games, as the portal's guide knows them (guide.generated.ts, from
 * family/family.json and portal/src/content), for the other sites' helpers: Ket on rasqberry.org and on the
 * Pi can point a visitor to the family member that fits (Jan, 2026-10-17). Only the facts, not the guide's
 * own instructions. Empty if the guide's sections ever move (test/guide.test.ts checks it is found).
 */
export function familyKnowledge(guide = GUIDE_KNOWLEDGE): string {
  const from = guide.indexOf('## The family (');
  if (from < 0) return '';
  return `# The Fun with Quantum family — what you know

RasQberry Two is part of the Fun with Quantum family (https://fun-with-quantum.org): open-source projects for
playing, building and learning quantum computing. When a visitor asks for something beyond RasQberry (a smaller
model, a LEGO build, games in the browser, a lesson, learning or coding Qiskit, a booth), point to the member
below that fits, in a sentence, with its link. Don't give away how a game is won.

${guide.slice(from).trim().replace(/^(#+) /gm, '#$1 ')}
`;
}
