// Fun with Quantum family icons: one template, one glyph per member.
// The template is the portal's favicon cut — a tumbling die (rounded frame in the superposition
// gradient, tilted −12°) with a motion arc. Inside, each member draws its own object in the brand
// palette: ghost cyan (#0E7C9C at 45%) for what is still in superposition, one solid magenta part
// (#C22F6E) for what is measured. Coordinates: 64×64 box, glyph inside the frame (≈ 18…46).
export const CYAN = '#0E7C9C';
export const MAGENTA = '#C22F6E';
const ghost = `fill="${CYAN}" opacity="0.45"`;
const ghostStroke = (w) => `fill="none" stroke="${CYAN}" stroke-width="${w}" opacity="0.45" stroke-linecap="round" stroke-linejoin="round"`;
const solidStroke = (w) => `fill="none" stroke="${MAGENTA}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

export const GLYPHS = {
  // the die itself (portal favicon): one measured pip, one ghost pip
  'fun-with-quantum': `<circle cx="22" cy="22" r="4" ${ghost}/><circle cx="32" cy="32" r="5.5" fill="${MAGENTA}"/>`,
  // a raspberry: drupelets measured, leaf in superposition
  'rasqberry-two': `<path d="M32 24 C 27 17, 22 20, 22 20 C 25 25, 29 25, 32 24 C 35 25, 39 25, 42 20 C 42 20, 37 17, 32 24 Z" ${ghost}/>`
    + [[28, 29.5], [36, 29.5], [24, 35.5], [32, 35.5], [40, 35.5], [28, 41.5], [36, 41.5]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.7" fill="${MAGENTA}"/>`).join(''),
  // IBM Q System One's chandelier: three plates, the coldest (the chip) measured
  'rasqberry-one': `<path d="M32 19 V 40" ${ghostStroke(2.5)}/>`
    + `<rect x="21" y="22" width="22" height="4" rx="2" ${ghost}/><rect x="24" y="29" width="16" height="4" rx="2" ${ghost}/>`
    + `<rect x="27" y="36" width="10" height="4" rx="2" ${ghost}/><circle cx="32" cy="43" r="3.2" fill="${MAGENTA}"/>`,
  // a LEGO brick: body in superposition, studs measured
  'quantego': `<rect x="20" y="30" width="24" height="12" rx="1.5" ${ghost}/>`
    + [21.5, 29.5, 37.5].map((x) => `<rect x="${x}" y="25.5" width="5" height="4" rx="1" fill="${MAGENTA}"/>`).join(''),
  // a smiling cube (Qutie's own favicon)
  'qutie': `<circle cx="24" cy="27" r="4" ${ghost}/><circle cx="40" cy="27" r="4" ${ghost}/><path d="M25 37 Q 32 43 39 37" ${solidStroke(4.5)}/>`,
  // a coffee cup with measured steam
  'qoffee-maker': `<path d="M21 30 H 39 V 37 A 6 6 0 0 1 33 43 H 27 A 6 6 0 0 1 21 37 Z" ${ghost}/><path d="M39 32 H 41.5 A 3.5 3.5 0 0 1 41.5 39 H 38" ${ghostStroke(2.5)}/>`
    + `<path d="M27 26 C 25 23.5, 29 22, 27 19" ${solidStroke(2.8)}/><path d="M33 26 C 31 23.5, 35 22, 33 19" ${solidStroke(2.8)}/>`,
  // two linked rings: entanglement
  'entangible': `<circle cx="27" cy="32" r="7.5" ${ghostStroke(4)}/><circle cx="37" cy="32" r="7.5" ${solidStroke(4)}/>`,
  // a race track: the road in superposition, the car measured
  'racetraq': `<path d="M21 42 C 21 32, 30 34, 32 30 C 34 26, 36 22, 43 22" ${ghostStroke(5)}/><circle cx="32" cy="30" r="4" fill="${MAGENTA}"/>`,
  // a certificate check
  'certiq': `<circle cx="32" cy="32" r="11" ${ghost}/><path d="M26 32.5 L 30.5 37 L 39 27.5" ${solidStroke(4.2)}/>`,
  // a bin with a qubit dropping in
  'qubins': `<path d="M20 30 H 44 L 41 44 H 23 Z" ${ghost}/><circle cx="32" cy="23" r="4" fill="${MAGENTA}"/>`,
  // a page that runs: executable docs
  'doqumentation': `<path d="M23 19 H 36 L 42 25 V 45 H 23 Z" ${ghost}/><path d="M29 28 L 37 33.5 L 29 39 Z" fill="${MAGENTA}"/>`,
};
