/**
 * The homepage's hero and its three doors (Play, Build, Learn): the one place to edit their words.
 * The iOS app's welcome page shows the same (ios/scripts/build-web.mjs → catalog.json), with the
 * door photos from src/assets (`image`).
 */
export interface HeroPart { text: string; door?: 'play' | 'build' | 'learn' }

export const HERO = {
  /** The headline; words with a door are colored like it. */
  title: [
    { text: 'Quantum computing you can ' }, { text: 'play', door: 'play' }, { text: ', ' }, { text: 'build', door: 'build' },
    { text: ' & ' }, { text: 'learn', door: 'learn' },
  ] as HeroPart[],
  /** Ends the headline on the website (the app, which is installed, ends it with a period). */
  webTail: ' — nothing to install.',
  lead: 'Quantum games, LEGO and 3D-printed quantum computer models, and hands-on ways to learn. Open source, workshop-tested, built by the RasQberry community.',
};

export interface Door { key: 'play' | 'build' | 'learn'; title: string; text: string; image: string; imageAlt: string; fit: 'contain' | 'cover' | 'left' }

export const DOORS: Door[] = [
  {
    key: 'play',
    title: 'Play',
    text: 'Build circuits with your hands, order coffee with a circuit, steer a runner with quantum gates — and try to beat a quantum computer at coin flipping.',
    image: 'qoffee-mug.png',
    imageAlt: 'The Qoffee-Maker mug with a quantum circuit printed on it',
    fit: 'contain',
  },
  {
    key: 'build',
    title: 'Build',
    text: '3D-print or LEGO-build your own model of an IBM Quantum computer.',
    image: 'quantego-two-photo.jpg',
    imageAlt: 'Quantego — a LEGO model of an IBM Quantum computer, mid-build',
    fit: 'cover',
  },
  {
    key: 'learn',
    title: 'Learn',
    text: 'Take the official courses from IBM, keep coding in ready-made environments, prepare for the Qiskit certification, run real Qiskit code in your browser — and build your own quantum games.',
    image: 'ibm-quantum-learning.png',
    imageAlt: 'The IBM Quantum Learning platform: “Learn quantum computing” with a library of courses',
    fit: 'left',
  },
];
