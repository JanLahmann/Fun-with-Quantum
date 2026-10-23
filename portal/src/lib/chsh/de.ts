/**
 * The browser CHSH game in German: the same keys, explanation links and numbers as the English
 * catalogue in messages.ts (test/games-de.test.ts). Informal "du", as in the German coin game.
 */
import { between, type Bit, type Round } from './game';
import { percent } from '../games/locale';
import type { ChshMessages } from './messages';

const pct = (p: number) => percent(p, 1, 'de');
const share = (won: number, n: number) => pct(won / n);
const result = (win: boolean) => (win ? '<span class="win">Gewonnen!</span>' : '<span class="lose">Verloren.</span>');
const deg = (d: number) => `${d}°`.replace('-', '−');
const P75 = percent(0.75, 0, 'de');

const UI: ChshMessages['UI'] = {
  chapters: ['Klassisch spielen', 'Das Quantenteam', 'Dreh die Winkel', `Warum ${percent(0.85, 0, 'de')} die Grenze ist`],
  chaptersLabel: 'Kapitel',
  explain: 'Erklärung',
  explainTitle: 'Erklärungen',
  allTerms: '← alle Begriffe',
  close: 'Schließen',
  learnMoreIbm: 'Mehr dazu bei IBM Quantum Learning ↗',
  learnMoreDoq: 'In doQumentation öffnen ↗',
  noscript: 'Die Browser-Version braucht JavaScript — das Notebook funktioniert auch ohne.',
  alice: 'Alice',
  bob: 'Bob',
  answerTo: (who: 'x' | 'y', q: Bit) => `wenn ${who} = ${q}: Antwort`,
  question: (x: Bit, y: Bit) => `x = ${x} · y = ${y}`,
  need: (x: Bit, y: Bit) => (x & y ? 'verschiedene Antworten' : 'gleiche Antwort'),
  needs: (x: Bit, y: Bit) => (x & y ? 'verschiedene Antworten' : 'die gleiche Antwort'),
  sliders: ['Alice, x = 0', 'Alice, x = 1', 'Bob, y = 0', 'Bob, y = 1'],
  circleTitle: 'Der Bloch-Kreis: die Richtungen, entlang derer Alice und Bob messen',
  circleHint: 'Punkt an der Spitze: Antwort 0 · Punkt am anderen Ende: Antwort 1',
  qubits: ['Alice', 'Bob'],
  circuitTitle: 'Der Schaltkreis des Spiels',
  tally: (won: number, n: number) => `${won} von ${n} gewonnen (${share(won, n)})`,
  degrees: (d: number) => `${d} Grad`,
  winCell: (p: number) => `Gewinnchance ${pct(p)}`,
};

const PAGE: ChshMessages['PAGE'] = {
  heading: 'CHSH-Spiel',
};

/** The German page around the game (/de/play/chsh-game/); the English one is src/content/games/chsh-game.md. */
export const PAGE_DE = {
  title: 'CHSH-Spiel | Fun with Quantum',
  description: `Der Bell-Test hinter dem Nobelpreis 2022 — ${P75} für jedes klassische Team, ${pct(Math.cos(Math.PI / 8) ** 2)} mit Verschränkung. Kostenlos im Browser spielen.`,
  kicker: 'Play · Bell-Test, Verschränkung',
  lead: `Der Bell-Test hinter dem Nobelpreis 2022 — ${P75} für jedes klassische Team, ${pct(Math.cos(Math.PI / 8) ** 2)} mit Verschränkung.`,
};

const RULES = `<p>Alice und Bob dürfen vorher eine Strategie absprechen — dann kommen sie in <b>getrennte Räume</b> und können nicht mehr miteinander reden.</p>
<p>Der Quizmaster gibt <b>Alice</b> ein zufälliges Bit <b>x</b> und <b>Bob</b> ein zufälliges Bit <b>y</b>. Beide antworten mit einem Bit: Alice mit <b>a</b>, Bob mit <b>b</b>. Die beiden <b>gewinnen</b>, wenn a ⊕ b = x · y: die <b>gleiche Antwort</b>, außer wenn beide eine 1 bekommen haben — dann <b>verschiedene Antworten</b>.</p>`;

const CH1: ChshMessages['CH1'] = {
  title: 'Klassisch spielen',
  intro: `${RULES}<p>Eine [klassische Strategie](#classical) ist eine Tabelle: was Alice auf x = 0 und auf x = 1 antwortet, was Bob auf y = 0 und auf y = 1 antwortet. <b>Ändere die Antworten</b>, um deine Tabelle zu bauen — die vier Felder zeigen, welche Fragen sie gewinnt.</p>`,
  result: (wins: number, proofShown = false) =>
    `Deine Tabelle gewinnt <b>${wins} von 4</b> Fragen (${percent(wins / 4, 0, 'de')}).${wins === 3 && !proofShown ? ' Findest du eine, die alle vier gewinnt?' : ''}`,
  many: '1000 Runden spielen',
  all: 'Alle 16 Tabellen ausprobieren',
  why: 'Warum nie 4 von 4?',
  next: 'Weiter: das Quantenteam →',
  manyResult: (won: number, n: number, wins: number) =>
    `Deine Tabelle: <b>${won} von ${n}</b> Runden gewonnen (${share(won, n)}). Jede Frage kommt in einem Viertel der Runden dran, im Mittel gewinnt deine Tabelle also ${wins} von 4 Runden: ${percent(wins / 4, 0, 'de')}.`,
  allResult: (tried: number, best: number, nBest: number) =>
    `Der Computer hat alle <b>${tried}</b> Tabellen ausprobiert: <b>${nBest}</b> gewinnen ${best} der 4 Fragen (${percent(best / 4, 0, 'de')}), die anderen ${tried - nBest} nur 1. Keine gewinnt alle vier.`,
  proof: `<p><b>Keine Tabelle gewinnt alle vier.</b> Schreib a₀ für Alices Antwort auf x = 0, a₁ für die auf x = 1 und b₀, b₁ für Bobs Antworten. Um jede Frage zu gewinnen, müsste gelten:</p>
<p class="math">a₀ ⊕ b₀ = 0 &nbsp; a₀ ⊕ b₁ = 0<br>a₁ ⊕ b₀ = 0 &nbsp; a₁ ⊕ b₁ = 1</p>
<p>Verknüpfe alle vier linken Seiten mit ⊕: Jedes von a₀, a₁, b₀, b₁ kommt zweimal vor, und jedes Bit ⊕ sich selbst ergibt 0 — zusammen also 0. Die rechten Seiten ergeben 0 ⊕ 0 ⊕ 0 ⊕ 1 = 1 ([Parität](#parity)). 0 ≠ 1, also muss eine ungerade Anzahl der vier Gleichungen falsch sein: Jede Tabelle verliert 1 oder 3 Fragen. Die besten gewinnen 3 von 4: <b>${P75}</b>.</p>
<p>Würfeln hilft nicht: Eine Zufallsstrategie ist eine zufällige Wahl unter den Tabellen, und keine davon schafft mehr als ${P75}.</p>`,
  proofSaid: `Keine Tabelle gewinnt alle vier Fragen — die besten gewinnen ${P75} der Runden.`,
};

const CH2: ChshMessages['CH2'] = {
  title: 'Das Quantenteam',
  intro: `<p>Jetzt teilen sich Alice und Bob ein [Bell-Paar](#bell): zwei [verschränkte](#entanglement) [Qubits](#qubit), eines für Alice, eines für Bob. In ihren Räumen [misst](#measurement) jede Person ihr Qubit entlang eines Pfeils auf dem [Bloch-Kreis](#bloch); welcher Pfeil, hängt von ihrer Frage ab: Alice entlang A0 (0°) oder A1 (90°), Bob entlang B0 (45°) oder B1 (−45°). Das Ergebnis ist die Antwort: 0 entlang des Pfeils, 1 in die Gegenrichtung.</p>
<p><b>Wähle eine Frage</b> in den Feldern — oder lass den Quizmaster wählen.</p>`,
  again: `Die beiden gewinnen nicht jede Runde. Spiel weiter: Auf Dauer gewinnen sie etwa ${percent(0.85, 0, 'de')} — mehr als jede klassische Tabelle.`,
  ask: 'Quizmaster fragt',
  many: '1000 Runden spielen',
  next: 'Weiter: Dreh die Winkel selbst →',
  manyResult: (won: number, n: number) =>
    `Quantenteam: <b>${won} von ${n}</b> Runden gewonnen (${share(won, n)}). Die exakte Chance: cos²(22,5°) ≈ 85,4 % — das beste klassische Team: ${P75}.`,
  score: (won: number, n: number) => `Quantenteam: ${won} von ${n} Runden gewonnen`,
};

/** One round, with the reason for its odds: P(gleich) = cos²(Δ/2). */
const round = (r: Round, alpha: number, beta: number) => {
  const d = between(alpha, beta), same = Math.cos((d * Math.PI) / 360) ** 2;
  return `x = ${r.x}, y = ${r.y} → nötig: ${UI.needs(r.x, r.y)}.<br>Alice entlang ${deg(alpha)}: <b>${r.a}</b> · Bob entlang ${deg(beta)}: <b>${r.b}</b> — ${result(r.win)}`
    + `<br><small>Die Pfeile der beiden liegen ${d}° auseinander, also antworten sie mit Wahrscheinlichkeit cos²(${d}°/2) = ${pct(same)} gleich.</small>`;
};

const CH3: ChshMessages['CH3'] = {
  title: 'Dreh die Winkel',
  intro: `<p>Warum gerade diese vier Pfeile? <b>Dreh sie selbst</b> mit den Schiebereglern. Jedes Feld zeigt die exakte Chance, diese Frage zu gewinnen: Alice und Bob antworten mit Wahrscheinlichkeit cos²(Δ/2) gleich, wobei Δ der Winkel zwischen ihren beiden Pfeilen ist.</p>
<p>Schaffst du mehr als 85,4 %?</p>`,
  best: 'Beste Winkel',
  allZ: 'Alle entlang Z',
  random: 'Zufällige Winkel',
  many: '1000 Runden spielen',
  next: `Weiter: Warum ${percent(0.85, 0, 'de')} die Grenze ist →`,
  total: (win: number, max: number) =>
    `Gewinnrate: <b>${pct(win)}</b>${win >= max - 1e-9 ? ' — das Maximum. Keine Winkel und keine andere Quantenstrategie schaffen mehr.'
      : win > 0.75 + 1e-9 ? ` — besser als jedes klassische Team (${P75}).`
      : win > 0.75 - 1e-9 ? ' — genauso gut wie das beste klassische Team.'
      : ` — schlechter als das beste klassische Team (${P75}).`}`,
  allZSaid: `Alle vier Pfeile entlang Z: Die Antworten stimmen immer überein — zufällig beide 0 oder beide 1. Das ist nicht besser als die klassische Tabelle „immer 0 antworten“: ${P75}.`,
  manyResult: (won: number, n: number, exact: number) =>
    `Mit diesen Winkeln: <b>${won} von ${n}</b> Runden gewonnen (${share(won, n)}); exakt ${pct(exact)}.`,
};

const CH4: ChshMessages['CH4'] = {
  title: `Warum ${percent(0.85, 0, 'de')} die Grenze ist`,
  sections: ['Der Bloch-Kreis', `Die klassische Grenze: ${P75}`, 'Die Quantengrenze: 85,4 %', 'Was es bedeutet'],
  texts: [
    `<p>Ein Qubit mit reellen Amplituden, cos(φ/2)|0⟩ + sin(φ/2)|1⟩, ist ein Pfeil auf dem [Bloch-Kreis](#bloch) im Winkel φ: |0⟩ oben, |1⟩ unten, |+⟩ bei 90° und |−⟩ bei −90°. Um entlang eines Pfeils im Winkel φ zu messen, dreht man das Qubit mit dem [Gatter](#gate) Ry(−φ) zurück und misst dann: 0 heißt entlang des Pfeils, 1 in die Gegenrichtung.</p>
<p>Beim [Bell-Paar](#bell) (|00⟩ + |11⟩)/√2 bekommt jede Person für sich in der Hälfte der Fälle 0, sonst 1. Zusammen geben sie mit dieser Wahrscheinlichkeit die gleiche Antwort:</p>
<p class="math">P(gleich) = cos²(Δ/2), Δ = der Winkel zwischen den beiden Pfeilen</p>
<p>Mit den besten Pfeilen haben drei Fragen Δ = 45°: die gleiche Antwort mit cos²(22,5°) ≈ 85,4 %. Bei x = y = 1 ist Δ = 135°: die gleiche Antwort nur mit cos²(67,5°) ≈ 14,6 % — verschiedene Antworten, wie verlangt, also mit 85,4 %.</p>
<p><small>Die Lektion von IBM Quantum Learning verwendet die halben Winkel, den Winkel im Zustand cos θ|0⟩ + sin θ|1⟩: 0 und π/4 für Alice, π/8 und −π/8 für Bob.</small></p>`,
    `<p>Bewerte jede Frage mit ihrer Korrelation: E = P(gleich) − P(verschieden), von −1 bis +1. Wenn x · y = 0 ist, gewinnen sie mit P(gleich) = (1 + E)/2; wenn x = y = 1 ist, mit P(verschieden) = (1 − E)/2. Gemittelt über die vier Fragen:</p>
<p class="math">Gewinnrate = 1/2 + S/8,<br>S = E₀₀ + E₀₁ + E₁₀ − E₁₁</p>
<p>Bei einer klassischen Tabelle ist jedes E = +1 oder −1, und sie verliert mindestens eine Frage, also ist S = (gewonnene Fragen) − (verlorene Fragen) ≤ 3 − 1 = 2. Mischt man Tabellen zufällig, wird S gemittelt — es bleibt also höchstens 2. Das ist die [CHSH-Ungleichung](#inequality), S ≤ 2: Gewinnrate ≤ 1/2 + 2/8 = <b>${P75}</b>.</p>`,
    `<p>Beim Bell-Paar ist E = P(gleich) − P(verschieden) = cos²(Δ/2) − sin²(Δ/2) = cos Δ — das Skalarprodukt der beiden Pfeile. Also</p>
<p class="math">S = A0·B0 + A0·B1 + A1·B0 − A1·B1<br>&nbsp; = A0·(B0 + B1) + A1·(B0 − B1)<br>&nbsp; ≤ |B0 + B1| + |B0 − B1| ≤ 2√2</p>
<p>Erster Schritt: Das Skalarprodukt eines Pfeils der Länge 1 mit einem beliebigen Vektor ist höchstens so groß wie die Länge dieses Vektors. Zweiter Schritt: |B0 + B1|² + |B0 − B1|² = 4, und zwei Längen, deren Quadrate zusammen 4 ergeben, ergeben zusammen höchstens 2√2 — erreicht, wenn beide √2 sind, mit B0 und B1 im rechten Winkel zueinander, wie 45° und −45°. Dann zeigt A0 in Richtung B0 + B1 (0°) und A1 in Richtung B0 − B1 (90°).</p>
<p>Für das Bell-Paar ist also S ≤ 2√2 ≈ 2,83 und die Gewinnrate höchstens 1/2 + √2/4 = cos²(22,5°) ≈ <b>85,4 %</b>. Boris Tsirelson hat 1980 bewiesen, dass das für jede Quantenstrategie gilt — für jeden verschränkten Zustand und beliebige Messungen: die [Tsirelson-Schranke](#tsirelson).</p>`,
    `<p><b>Nicht jede Runde.</b> Anders als im GHZ-Spiel und im magischen Quadrat verliert das Quantenteam manche Runden. Der Vorteil zeigt sich in der Statistik — wie bei echten Bell-Tests: viele Runden spielen, dann mit ${P75} vergleichen.</p>
<p><b>Keine Signale.</b> Alices Antworten für sich sind 50:50, egal, was Bob misst; sie kann daraus also y nicht erfahren, und keine Nachricht wird übertragen ([keine Signale](#signaling)). Die Korrelation zeigt sich erst, wenn die beiden Antwortlisten verglichen werden.</p>
<p><b>Kein verstecktes Drehbuch.</b> Im Voraus festgelegte Antworten — [verborgene Variablen](#hidden), die die Qubits mit sich tragen — sind eine klassische Tabelle und gewinnen höchstens ${P75}. John Bell fand 1964 heraus, dass die Quantenmechanik mehr vorhersagt; Clauser, Horne, Shimony und Holt machten daraus diesen Test. Experimente von John Clauser, Alain Aspect, Anton Zeilinger und anderen bestätigten die Quantenmechanik — der Physik-Nobelpreis 2022. 2015 schlossen drei Experimente die wichtigsten Schlupflöcher gleichzeitig.</p>
<p><b>Warum nicht 100 %?</b> Eine gedachte „PR-Box“ (Popescu und Rohrlich, 1994) würde jede Runde gewinnen und trotzdem keine Nachricht übertragen. Die Quantenmechanik hört bei 85,4 % auf. Auf echten Quantencomputern senkt Rauschen die Gewinnrate (zufällige Antworten gewinnen 50 %) — deutlich über ${P75} zu bleiben, ist ein Test für die Hardware.</p>
<p>J. F. Clauser, M. A. Horne, A. Shimony, R. A. Holt, <a href="https://doi.org/10.1103/PhysRevLett.23.880" target="_blank" rel="noopener">Phys. Rev. Lett. 23, 880 (1969)</a>; als nichtlokales Spiel untersucht: R. Cleve, P. Høyer, B. Toner, J. Watrous, <a href="https://arxiv.org/abs/quant-ph/0404076" target="_blank" rel="noopener">arXiv:quant-ph/0404076</a> (2004); B. S. Tsirelson (Cirel’son), <a href="https://doi.org/10.1007/BF00417500" target="_blank" rel="noopener">Lett. Math. Phys. 4, 93 (1980)</a>. Mehr dazu in der Lektion <a href="https://quantum.cloud.ibm.com/learning/de/courses/basics-of-quantum-information/entanglement-in-action/chsh-game" target="_blank" rel="noopener">CHSH-Spiel</a> von IBM Quantum Learning.</p>`,
  ],
  said: [
    'Wähle ein Fragefeld, um seine beiden Pfeile und den Winkel zwischen ihnen zu sehen.',
    `Klassische Tabellen: S ≤ 2, Gewinnrate ≤ ${P75} — die CHSH-Ungleichung.`,
    'Beste Winkel: S = 2√2 ≈ 2,83, Gewinnrate 85,4 % — die Tsirelson-Schranke.',
    `Quantenteam: 85,4 %. Klassisch: ${P75}. Eine gedachte PR-Box: 100 %.`,
  ],
  question: (x: Bit, y: Bit, alpha: number, beta: number, win: number) => {
    const d = between(alpha, beta);
    return `x = ${x}, y = ${y}: Pfeile ${d}° auseinander, die gleiche Antwort mit cos²(${d}°/2) = ${pct(Math.cos((d * Math.PI) / 360) ** 2)}; sie brauchen ${UI.needs(x, y)} — Gewinnchance ${pct(win)}.`;
  },
};

const de: ChshMessages = { UI, PAGE, RULES, CH1, CH2, CH3, CH4, round, percent: (p: number, digits: number) => percent(p, digits, 'de') };
export default de;
