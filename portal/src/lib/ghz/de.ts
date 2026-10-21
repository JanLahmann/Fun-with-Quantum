/**
 * The browser GHZ game in German: the same keys, explanation links and numbers as the English
 * catalogue in messages.ts (test/games-de.test.ts). Informal "du", as in the German coin game.
 */
import { isAllColor, type Question } from './game';
import { percent } from '../games/locale';
import type { GhzMessages } from './messages';

const UI: GhzMessages['UI'] = {
  chapters: ['Team klassisch', 'Team Quanten', 'Wie es funktioniert'],
  chaptersLabel: 'Kapitel',
  explain: 'Erklärung',
  explainTitle: 'Erklärungen',
  allTerms: '← alle Begriffe',
  close: 'Schließen',
  learnMoreIbm: 'Mehr dazu bei IBM Quantum Learning ↗',
  learnMoreDoq: 'In doQumentation öffnen ↗',
  noscript: 'Die Browser-Version braucht JavaScript — das Notebook funktioniert auch ohne.',
  players: ['Alice', 'Bob', 'Du'],
  color: 'Farbe?',
  shape: 'Form?',
  red: 'rot', blue: 'blau', star: 'Stern', rectangle: 'Rechteck',
  thing: (color: number, shape: number) => (shape ? `${color ? 'roter' : 'blauer'} Stern` : `${color ? 'rotes' : 'blaues'} Rechteck`),
  questionsLabel: 'Die Frage',
  changeThing: (player: string) => (player === 'Du' ? 'Deinen Gegenstand ändern' : `Gegenstand von ${player} ändern`),
  circuitTitle: 'Der Schaltkreis des Spiels',
  histLabel: 'Wie oft jede Antwort herauskommt',
  zBasis: 'Z · Z · Z (keine Frage)',
};

const PAGE: GhzMessages['PAGE'] = {
  heading: 'GHZ-Spiel',
};

/** The German page around the game (/de/play/ghz-game/); the English one is src/content/games/ghz-game.md. */
export const PAGE_DE = {
  title: 'GHZ-Spiel | Fun with Quantum',
  description: 'Ein Teamspiel, bei dem keine klassische Strategie jede Runde gewinnt — mit Verschränkung gewinnt ihr immer. Kostenlos im Browser spielen.',
  kicker: 'Play · Verschränkung (GHZ-Zustände)',
  lead: 'Ein Teamspiel, bei dem keine klassische Strategie jede Runde gewinnt — mit Verschränkung gewinnt ihr immer.',
};

const ASK = { C: 'Farbe', S: 'Form' } as const;
const questionLabel = (q: Question) => q.map((a) => ASK[a]).join(' · ');

const said = (ask: 'C' | 'S', bit: number) => (ask === 'C' ? (bit ? UI.red : UI.blue) : bit ? UI.star : UI.rectangle);

const result = (win: boolean) => (win ? '<span class="win">Gewonnen!</span>' : '<span class="lose">Verloren.</span>');
const pct = (won: number, n: number) => percent(won / n, 1, 'de');

/** "2 × rot: gerade. Gewonnen!" */
function verdict(q: Question, bits: readonly number[], win: boolean): string {
  const k = bits.reduce((a, b) => a + b, 0);
  const what = isAllColor(q) ? 'rot' : 'rot oder Stern';
  return `${k} × ${what}: ${k % 2 ? 'ungerade' : 'gerade'}. ${result(win)}`;
}

const RULES = `<p>Alice, Bob und du seid ein Team. Jede Person wird entweder nach einer <b>Farbe</b> (rot oder blau) oder nach einer <b>Form</b> (Stern oder Rechteck) gefragt. Vorher dürft ihr eine Strategie absprechen — sobald die Fragen gestellt sind, darf niemand mehr reden.</p>
<p>Der Quizmaster fragt entweder alle drei nach der Farbe oder eine Person nach der Farbe und die beiden anderen nach der Form. Euer Team <b>gewinnt</b>, wenn</p>
<p>• alle drei nach der Farbe gefragt werden und eine <b>gerade</b> Anzahl von euch <b>rot</b> sagt (0 oder 2);<br>• einmal nach der Farbe und zweimal nach der Form gefragt wird und eine <b>ungerade</b> Anzahl <b>rot oder Stern</b> sagt (1 oder 3).</p>`;

const CH1: GhzMessages['CH1'] = {
  title: 'Team klassisch',
  intro: `${RULES}<p>Eine [klassische Strategie](#classical): Jede Person denkt sich einen Gegenstand aus — einen roten oder blauen Stern oder ein rotes oder blaues Rechteck — und antwortet danach. <b>Wähle den Gegenstand einer Person aus, um ihn zu ändern</b>, dann lass den Quizmaster alle vier Fragen stellen.</p>`,
  askAll: 'Alle vier Fragen stellen',
  all: 'Alle klassischen Teams ausprobieren',
  why: 'Warum nie 4 von 4?',
  next: 'Weiter: Team Quanten →',
  changed: 'Bereit — stell die vier Fragen.',
  score: (won: number) => (won === 3 ? 'Euer Team gewinnt <b>3 der 4</b> Fragen — besser geht es nicht.' : `Euer Team gewinnt <b>${won} der 4</b> Fragen. Findest du ein Team, das mehr gewinnt?`),
  allResult: (tried: number, best: number) => `Der Computer hat alle <b>${tried}</b> klassischen Teams ausprobiert (4 Gegenstände für jede der 3 Personen): Die besten gewinnen <b>${best} der 4</b> Fragen — ${percent(0.75, 0, 'de')}. Keines gewinnt alle vier.`,
  proof: `<p><b>Warum nie 4 von 4?</b> Schreib jede Antwort als Zahl: rot oder Stern = −1, blau oder Rechteck = +1. Dann ist das Produkt der drei Antworten +1, wenn eine gerade Anzahl rot ist, und −1, wenn eine ungerade Anzahl rot oder Stern ist ([Parität](#parity)). Mit den Farben c und Formen s (color, shape) von Alice (A), Bob (B) und dir (Y, you) heißt „alle vier Fragen gewonnen“:</p>
<p class="math">c<sub>A</sub>·c<sub>B</sub>·c<sub>Y</sub> = +1<br>c<sub>A</sub>·s<sub>B</sub>·s<sub>Y</sub> = −1<br>s<sub>A</sub>·c<sub>B</sub>·s<sub>Y</sub> = −1<br>s<sub>A</sub>·s<sub>B</sub>·c<sub>Y</sub> = −1</p>
<p>Multipliziere die letzten drei Zeilen: Jede Form kommt zweimal vor, und s·s = +1. Übrig bleibt c<sub>A</sub>·c<sub>B</sub>·c<sub>Y</sub> = (−1)·(−1)·(−1) = −1 — das Gegenteil der ersten Zeile. Also gewinnt kein Team mit festen Gegenständen alle vier Fragen; die besten gewinnen 3 von 4.</p>`,
  proofSaid: `Für kein klassisches Team möglich: höchstens 3 von 4 (${percent(0.75, 0, 'de')}).`,
};

const CH2: GhzMessages['CH2'] = {
  title: 'Team Quanten',
  intro: `<p>Team Quanten teilt sich drei [verschränkte](#entanglement) [Qubits](#qubit) in einem [GHZ-Zustand](#ghz) — eines für jede Person. Wer nach der Farbe gefragt wird, [misst](#measurement) X: ein H-Gatter, dann messen. Wer nach der Form gefragt wird, misst Y: S†, H, dann messen ([eine andere Basis](#basis)). Ergebnis 1 bedeutet rot oder Stern, 0 bedeutet blau oder Rechteck.</p>
<p><b>Wähle eine Frage</b> über den drei Personen — oder lass den Quizmaster fragen.</p>`,
  ask: 'Quizmaster fragt',
  many: '1000 Runden spielen',
  next: 'Weiter: Wie funktioniert das? →',
  again: 'Die Antworten ändern sich von Runde zu Runde — jede Person für sich sieht reinen Zufall —, aber das Team gewinnt immer.',
  manyResult: (won: number, n: number) => `Team Quanten: <b>${won} von ${n}</b> Runden gewonnen (${pct(won, n)}). Das beste klassische Team: ${percent(0.75, 0, 'de')}.`,
  score: (won: number, n: number) => `Team Quanten: ${won} von ${n} Runden gewonnen`,
};

const CH3: GhzMessages['CH3'] = {
  title: 'Wie es funktioniert',
  sections: ['Der GHZ-Zustand', 'Was jede Frage ergibt', 'Warum der Beweis scheitert', 'Was es bedeutet'],
  texts: [
    `<p>Der [GHZ-Zustand](#ghz) (|000⟩ + |111⟩)/√2 entsteht durch die ersten drei Gatter des [Schaltkreises](#circuit): H bringt Alices Qubit in [Superposition](#superposition), und zwei [CNOTs](#cnot) kopieren seine 0 oder 1 auf Bobs und dein Qubit.</p>
<p>Direkt gemessen (Z) stimmen die drei immer überein: 000 oder 111, 50:50 — siehe das Diagramm. Das allein ist noch kein Rätsel; drei zusammengeklebte Münzen tun dasselbe. Die Überraschung kommt mit den Fragen.</p>`,
    `<p><b>Wähle eine Frage</b> über dem Diagramm: Es zeigt, wie oft jede Antwort herauskommt, exakt berechnet. Bei Farbe · Farbe · Farbe erscheinen nur Antworten mit einer <b>geraden</b> Anzahl von Einsen (rot); bei den anderen drei Fragen nur <b>ungerade</b> Anzahlen von Einsen (rot oder Stern). Jede Antwort, die erscheinen kann, gewinnt.</p>
<p>Und jede Person für sich? Ihre eigene 0 oder 1 ist 50:50, egal, wonach die anderen gefragt werden. Niemand kann aus der eigenen Antwort etwas über die Fragen der anderen ablesen — zwischen ihnen geht kein Signal hin und her.</p>`,
    `<p>Der Beweis hat angenommen, dass jede Person <b>beide</b> Antworten bei sich trägt — eine Farbe und eine Form — und die erfragte verrät. Bei Qubits gibt es keinen Quantenzustand, in dem Farbe (X) und Form (Y) zugleich feste Werte haben: X·Y = −Y·X, sie [kommutieren](#commute) nicht. Nur die tatsächlich gestellte Frage bekommt eine Antwort, und diese Antworten passen immer zusammen.</p>
<blockquote>„Was nicht passiert ist, ist nicht passiert.“</blockquote>
<p>— N. David Mermins Leitspruch für Quantenphysiker (im Original: „What didn’t happen didn’t happen.“), in <i>Quantum Computer Science: An Introduction</i>.</p>`,
    `<p><b>Kein verstecktes Drehbuch.</b> Trüge jede Person feste Antworten bei sich — Einsteins [verborgene Variablen](#hidden) —, würde das Team mindestens eine der vier Fragen verlieren. Die Quantenmechanik sagt voraus, dass es jede einzelne Runde gewinnt. Anders als bei der Bellschen Ungleichung geht es bei diesem Widerspruch nicht um Mittelwerte.</p>
<p><b>Keine Kommunikation.</b> Jede Antwort für sich ist zufällig, und die Fragen der anderen hinterlassen darin keine Spur — ein [nichtlokales Spiel](#nonlocal), gewonnen allein durch Verschränkung.</p>
<p><b>Auf echten Quantencomputern</b> lässt das Rauschen das Team ab und zu verlieren. Wie oft — und wie es besser geht — zeigt <a href="/play/ghz-real-devices/">das GHZ-Spiel auf echten Geräten</a> (auf Englisch). Das Spiel geht auf Daniel Greenberger, Michael Horne und Anton Zeilinger (1989) zurück, in der Form, die N. David Mermin (1990) bekannt gemacht hat.</p>`,
  ],
};

const de: GhzMessages = { UI, PAGE, RULES, CH1, CH2, CH3, questionLabel, said, verdict, percent: (p: number, digits: number) => percent(p, digits, 'de') };
export default de;
