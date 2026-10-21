/**
 * German explanations for the browser games that exist in German (GHZ, CHSH): every term those games
 * and these entries link to. Same numbers as GLOSSARY_EN (test/games-de.test.ts); terms without a
 * German entry fall back to English (glossaryEntry in glossary.ts).
 */
import type { GlossaryEntry, TermKey } from './glossary';

export const GLOSSARY_DE: Partial<Record<TermKey, GlossaryEntry>> = {
  qubit: {
    title: 'Qubit',
    body: 'Die Quantenversion eines Bits. Misst man es, erhält man immer 0 oder 1. Vorher kann es in einer [Superposition](#superposition) aus beidem sein, und mehrere Qubits können [verschränkt](#entanglement) sein.',
  },
  superposition: {
    title: 'Superposition',
    body: 'Ein Qubit kann zugleich in einer Kombination aus 0 und 1 sein. Eine [Messung](#measurement) wählt dann zufällig eines davon aus. Das H-Gatter macht aus |0⟩ eine gleichmäßige Superposition: 50:50.',
  },
  measurement: {
    title: 'Messung',
    body: 'Das Auslesen eines Qubits ergibt 0 oder 1, zufällig, mit Wahrscheinlichkeiten, die sein Zustand festlegt. Ein Quantencomputer liest Qubits nur in einer Richtung aus, der Z-Basis. Um X oder Y zu messen, dreht man das Qubit vorher mit [Gattern](#gate) — siehe [Messen in einer anderen Basis](#basis).',
  },
  entanglement: {
    title: 'Verschränkung',
    body: 'Qubits, die sich einen gemeinsamen Zustand teilen, der sich nicht in einen Zustand für jedes einzelne Qubit zerlegen lässt. In den Zuständen unserer Spiele liefert jedes Qubit für sich zufällige Ergebnisse, und doch passen die Ergebnisse zusammen — perfekt im GHZ-Spiel und im magischen Quadrat, in 85 % der Fälle im CHSH-Spiel. Zwischen ihnen geht kein Signal hin und her — und trotzdem kann keine im Voraus geschriebene Liste von Antworten diese Korrelationen erzeugen.',
  },
  bell: {
    title: 'Bell-Paar',
    body: 'Zwei verschränkte Qubits im Zustand (|00⟩ + |11⟩)/√2, erzeugt aus |00⟩ durch ein H und ein [CNOT](#cnot). Beide in Z oder beide in X gemessen, liefern sie immer dasselbe Ergebnis; beide in Y, immer entgegengesetzte Ergebnisse. In der X-Basis geschrieben ist es (|++⟩ + |−−⟩)/√2 — genauso einfach.',
  },
  ghz: {
    title: 'GHZ-Zustand',
    body: 'Drei verschränkte Qubits im Zustand (|000⟩ + |111⟩)/√2, benannt nach Greenberger, Horne und Zeilinger. Ein H und zwei [CNOTs](#cnot) erzeugen ihn. In Z gemessen: alle 0 oder alle 1. X, X, X gemessen: immer eine gerade Anzahl von Einsen. X, Y, Y gemessen (in beliebiger Reihenfolge): immer eine ungerade Anzahl.',
  },
  pauli: {
    title: 'X-, Y- und Z-Messungen',
    body: 'Die drei grundlegenden Messungen eines Qubits, entlang der drei Achsen der Bloch-Kugel. Jede ergibt +1 oder −1, was wir als 0 oder 1 schreiben. Auf zwei Qubits bedeutet X⊗Z: X auf dem ersten und Z auf dem zweiten; das Ergebnis ist das Produkt der beiden.',
  },
  commute: {
    title: 'Kommutierende Messungen',
    body: 'Zwei Messungen kommutieren, wenn ihre Reihenfolge keine Rolle spielt: A·B = B·A. Dann kann man sie zusammen ausführen. X und Z kommutieren nicht: X·Z = −Z·X. Deshalb gibt es keinen Quantenzustand, in dem X und Z desselben Qubits zugleich feste Werte haben — und ein Beweis, der alle Antworten miteinander multipliziert, als ob es so wäre, greift nicht.',
  },
  basis: {
    title: 'Messen in einer anderen Basis',
    body: 'Ein Quantencomputer misst nur Z. Erst Gatter U anzuwenden und dann Z zu messen ist dasselbe, wie U†·Z·U zu messen. Da H·Z·H = X ist, misst „H, dann messen“ X; „S†, H, dann messen“ misst Y. Mit Zwei-Qubit-Gattern wie [CNOT](#cnot) und [SWAP](#swap) misst derselbe Trick X⊗X, Z⊗Z und mehr.',
  },
  gate: {
    title: 'Quantengatter',
    body: 'Eine Operation auf Qubits — die Quantenversion eines Logikgatters. H (Hadamard) erzeugt [Superposition](#superposition), X vertauscht 0 und 1, Z, S und S† ändern die Phase, Ry(θ) dreht das Qubit um θ auf dem [Bloch-Kreis](#bloch). Gatter sind umkehrbar.',
  },
  cnot: {
    title: 'CNOT und CZ',
    body: 'Zwei-Qubit-Gatter. CNOT (gezeichnet ● und ⊕) kippt das zweite Qubit, wenn das erste 1 ist. CZ (● und ●) multipliziert mit −1, wenn beide 1 sind. Ein H auf dem ersten Qubit vor einem CNOT erzeugt [Verschränkung](#entanglement) — ein [Bell-Paar](#bell); CZ tut dasselbe, wenn beide Qubits vorher ein H bekommen.',
  },
  swap: {
    title: 'SWAP',
    body: 'Vertauscht zwei Qubits (gezeichnet × und ×). Vor eine Messung gesetzt, macht es aus einer Messung des zweiten Qubits eine des ersten.',
  },
  circuit: {
    title: 'Quantenschaltkreis',
    body: 'Ein Rezept aus [Gattern](#gate), von links nach rechts gelesen: eine Linie pro Qubit, die Messungen am Ende. Kästen wie „Orakel“ und „Diffusor“ stehen für Gruppen von Gattern. In den Spielen mit weit voneinander entfernten Beteiligten trennt eine gestrichelte Linie die Vorbereitung des gemeinsamen Zustands von dem, was danach jede Seite für sich tut.',
  },
  parity: {
    title: 'Gerade und ungerade (Parität)',
    body: 'Ob eine Liste aus Nullen und Einsen eine gerade oder eine ungerade Anzahl von Einsen hat. Schreibt man sie als Zahlen +1 und −1 (0 → +1, 1 → −1), ist es ihr Produkt: gerade → +1, ungerade → −1. So wird in den Beweisen aus dem Zählen ein Multiplizieren.',
  },
  classical: {
    title: 'Klassische Strategie',
    body: 'Jeder Plan ohne Quantenhilfe. Weil die Beteiligten während des Spiels nicht reden können, läuft es auf eine feste Tabelle hinaus: was jede Person auf jede Frage antwortet. (Würfeln ist nie besser als die beste Tabelle.) Es gibt nur endlich viele Tabellen — 16 im CHSH-Spiel und in Hardys Paradoxon, 64 im GHZ-Spiel, 4096 im magischen Quadrat —, also kann der Computer alle ausprobieren.',
  },
  nonlocal: {
    title: 'Nichtlokales Spiel',
    body: 'Getrennte Beteiligte bekommen je eine Frage und müssen antworten, ohne miteinander zu reden. Der Vergleich der besten [klassischen Strategie](#classical) mit der besten Quantenstrategie zeigt, was [Verschränkung](#entanglement) kann. Im GHZ-Spiel und im magischen Quadrat gewinnt das Quantenteam jede Runde — „Quanten-Pseudotelepathie“. Das bekannteste nichtlokale Spiel ist das CHSH-Spiel.',
  },
  hidden: {
    title: 'Verborgene Variablen',
    body: 'Die von Einstein verteidigte Idee, dass jedes Messergebnis im Voraus feststeht, wie ein Drehbuch, das jedes Teilchen mit sich trägt, und dass nichts weit Entferntes es ändern kann. Ein solches Drehbuch ist genau eine [klassische Strategie](#classical) — gewinnt das Quantenteam öfter, ist die Idee also falsch. Das GHZ-Spiel und Hardys Paradoxon zeigen das ohne jede Ungleichung.',
  },
  bloch: {
    title: 'Bloch-Kreis',
    body: 'Jeder Qubit-Zustand ist ein Pfeil auf der Bloch-Kugel: |0⟩ oben, |1⟩ unten. Zustände mit reellen Amplituden, cos(φ/2)|0⟩ + sin(φ/2)|1⟩, liegen auf einem Kreis durch oben und unten, im Winkel φ von oben gemessen: |+⟩ bei 90°, |−⟩ bei −90°. Um entlang eines Pfeils im Winkel φ zu messen, dreht man das Qubit mit Ry(−φ) zurück und misst: 0 heißt entlang des Pfeils, 1 in die Gegenrichtung.',
  },
  inequality: {
    title: 'CHSH-Ungleichung',
    body: 'Bewerte jede Frage mit ihrer Korrelation E = P(gleich) − P(verschieden). Im CHSH-Spiel ist die Gewinnrate 1/2 + S/8 mit S = E₀₀ + E₀₁ + E₁₀ − E₁₁. Jede [klassische Strategie](#classical) — beliebige lokale [verborgene Variablen](#hidden) — hat S ≤ 2 und gewinnt also höchstens 75 %. Die Quantenmechanik erreicht S = 2√2 ≈ 2,83. Clauser, Horne, Shimony und Holt (1969) fanden diese Form von John Bells Ungleichung, die Form, die die meisten Experimente testen.',
  },
  tsirelson: {
    title: 'Tsirelson-Schranke',
    body: 'Keine Quantenstrategie gewinnt das CHSH-Spiel öfter als cos²(π/8) = 1/2 + √2/4 ≈ 85,4 % (S ≤ 2√2) — ganz gleich, welcher verschränkte Zustand und welche Messungen. Boris Tsirelson hat das 1980 bewiesen. Ein [Bell-Paar](#bell), entlang der richtigen Pfeile gemessen, erreicht die Schranke genau.',
  },
  signaling: {
    title: 'Keine Signale',
    body: 'Mit Verschränkung können Alice und Bob einander keine Nachrichten schicken. Alices Ergebnisse für sich hängen nicht davon ab, was Bob misst (in unseren Spielen sind sie einfach 50:50), also verraten sie ihr nichts über Bobs Frage. Die Korrelation zeigt sich erst, wenn beide Ergebnislisten zusammengebracht werden — und dafür braucht es gewöhnliche Kommunikation.',
  },
};
