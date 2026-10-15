/** The assistant widget's own texts, in the coin game's seven languages. */
import type { Locale } from '../qcoin/i18n';

export interface AssistantTexts {
  open: string;
  title: string;
  intro: string;
  privacy: string;
  privacyLink: string;
  placeholder: string;
  send: string;
  thinking: string;
  you: string;
  explainer: string;
  helpful: string;
  notHelpful: string;
  thanks: string;
  errRate: string;
  errBusy: string;
  errNetwork: string;
  /** The level switch: its label and the three levels (kids, normal, math). */
  level: string;
  levels: { kids: string; normal: string; math: string };
}

export const ASSISTANT_TEXTS: Record<Locale, AssistantTexts> = {
  en: {
    open: 'Ask Ket',
    title: 'Ask about the game',
    intro: 'Questions about this round, the rules or the physics behind it — for example “Why did I lose?”',
    privacy: 'Your questions and the game state are sent to Anthropic (Claude) to answer, and stored for 30 days to improve Ket. Please don’t enter personal data.',
    privacyLink: 'Privacy',
    placeholder: 'Your question…',
    send: 'Ask',
    thinking: 'Thinking…',
    you: 'You',
    explainer: 'Ket (AI)',
    helpful: 'Helpful',
    notHelpful: 'Not helpful',
    thanks: 'Thanks for the feedback!',
    errRate: 'That was a lot of questions — please wait a minute (or until tomorrow) and ask again.',
    errBusy: 'Ket has answered all it can for today. Please try again tomorrow.',
    errNetwork: 'Ket couldn’t be reached. Please try again.',
    level: 'Level',
    levels: { kids: 'Kids', normal: 'Normal', math: 'With math' },
  },
  de: {
    open: 'Frag Ket',
    title: 'Fragen zum Spiel',
    intro: 'Fragen zu dieser Runde, zu den Regeln oder zur Physik dahinter — zum Beispiel „Warum habe ich verloren?“',
    privacy: 'Deine Fragen und der Spielstand gehen zur Beantwortung an Anthropic (Claude) und werden 30 Tage gespeichert, um Ket zu verbessern. Bitte gib keine persönlichen Daten ein.',
    privacyLink: 'Datenschutz',
    placeholder: 'Deine Frage…',
    send: 'Fragen',
    thinking: 'Denke nach…',
    you: 'Du',
    explainer: 'Ket (KI)',
    helpful: 'Hilfreich',
    notHelpful: 'Nicht hilfreich',
    thanks: 'Danke für die Rückmeldung!',
    errRate: 'Das waren viele Fragen — bitte warte eine Minute (oder bis morgen) und frag dann noch einmal.',
    errBusy: 'Ket hat für heute alle Fragen beantwortet, die möglich sind. Bitte versuch es morgen wieder.',
    errNetwork: 'Ket ist gerade nicht erreichbar. Bitte versuch es noch einmal.',
    level: 'Stufe',
    levels: { kids: 'Kids', normal: 'Normal', math: 'Mit Mathe' },
  },
  ja: {
    open: 'Ket に質問する',
    title: 'ゲームについて質問',
    intro: 'このラウンド、ルール、その背後にある物理について質問できます。例:「なぜ負けたの?」',
    privacy: '質問とゲームの状態は回答のために Anthropic (Claude) に送信され、Ket の改善のため 30 日間保存されます。個人情報は入力しないでください。',
    privacyLink: 'プライバシー',
    placeholder: '質問を入力…',
    send: '質問する',
    thinking: '考え中…',
    you: 'あなた',
    explainer: 'Ket（AI）',
    helpful: '役に立った',
    notHelpful: '役に立たなかった',
    thanks: 'フィードバックありがとうございます!',
    errRate: '質問が多すぎます。1 分ほど(または明日まで)待ってから、もう一度質問してください。',
    errBusy: '今日の回答数の上限に達しました。明日もう一度お試しください。',
    errNetwork: 'Ket に接続できませんでした。もう一度お試しください。',
    level: 'レベル',
    levels: { kids: 'キッズ', normal: 'ふつう', math: '数式あり' },
  },
  es: {
    open: 'Pregunta a Ket',
    title: 'Preguntas sobre el juego',
    intro: 'Preguntas sobre esta ronda, las reglas o la física que hay detrás; por ejemplo: «¿Por qué he perdido?»',
    privacy: 'Tus preguntas y el estado del juego se envían a Anthropic (Claude) para responder y se guardan 30 días para mejorar a Ket. No introduzcas datos personales.',
    privacyLink: 'Privacidad',
    placeholder: 'Tu pregunta…',
    send: 'Preguntar',
    thinking: 'Pensando…',
    you: 'Tú',
    explainer: 'Ket (IA)',
    helpful: 'Útil',
    notHelpful: 'No es útil',
    thanks: '¡Gracias por tu opinión!',
    errRate: 'Han sido muchas preguntas: espera un minuto (o hasta mañana) y vuelve a preguntar.',
    errBusy: 'Ket ya ha respondido todo lo que puede por hoy. Vuelve a intentarlo mañana.',
    errNetwork: 'No se ha podido contactar con Ket. Inténtalo de nuevo.',
    level: 'Nivel',
    levels: { kids: 'Niños', normal: 'Normal', math: 'Con matemáticas' },
  },
  uk: {
    open: 'Запитати Ket',
    title: 'Питання про гру',
    intro: 'Питання про цей раунд, правила або фізику, що стоїть за ними, — наприклад: «Чому я програв?»',
    privacy: 'Ваші запитання та стан гри надсилаються до Anthropic (Claude) для відповіді й зберігаються 30 днів, щоб покращити Ket. Будь ласка, не вводьте особисті дані.',
    privacyLink: 'Конфіденційність',
    placeholder: 'Ваше запитання…',
    send: 'Запитати',
    thinking: 'Думаю…',
    you: 'Ви',
    explainer: 'Ket (ШІ)',
    helpful: 'Корисно',
    notHelpful: 'Не корисно',
    thanks: 'Дякуємо за відгук!',
    errRate: 'Забагато запитань — зачекайте хвилину (або до завтра) і запитайте знову.',
    errBusy: 'На сьогодні ліміт відповідей Ket вичерпано. Спробуйте завтра.',
    errNetwork: 'Не вдалося зв’язатися з Ket. Спробуйте ще раз.',
    level: 'Рівень',
    levels: { kids: 'Для дітей', normal: 'Звичайний', math: 'З математикою' },
  },
  it: {
    open: 'Chiedi a Ket',
    title: 'Domande sul gioco',
    intro: 'Domande su questo round, sulle regole o sulla fisica che c’è dietro: per esempio «Perché ho perso?»',
    privacy: 'Le tue domande e lo stato del gioco vengono inviati ad Anthropic (Claude) per rispondere e conservati per 30 giorni per migliorare Ket. Non inserire dati personali.',
    privacyLink: 'Privacy',
    placeholder: 'La tua domanda…',
    send: 'Chiedi',
    thinking: 'Sto pensando…',
    you: 'Tu',
    explainer: 'Ket (IA)',
    helpful: 'Utile',
    notHelpful: 'Non utile',
    thanks: 'Grazie per il feedback!',
    errRate: 'Sono state tante domande: aspetta un minuto (o fino a domani) e chiedi di nuovo.',
    errBusy: 'Per oggi sono state date tutte le risposte possibili. Riprova domani.',
    errNetwork: 'Impossibile raggiungere Ket. Riprova.',
    level: 'Livello',
    levels: { kids: 'Bambini', normal: 'Normale', math: 'Con la matematica' },
  },
  fr: {
    open: 'Demander à Ket',
    title: 'Questions sur le jeu',
    intro: 'Des questions sur cette manche, les règles ou la physique derrière — par exemple « Pourquoi ai-je perdu ? »',
    privacy: 'Vos questions et l’état du jeu sont envoyés à Anthropic (Claude) pour y répondre, et conservés 30 jours pour améliorer Ket. Merci de ne pas saisir de données personnelles.',
    privacyLink: 'Confidentialité',
    placeholder: 'Votre question…',
    send: 'Demander',
    thinking: 'Réflexion…',
    you: 'Vous',
    explainer: 'Ket (IA)',
    helpful: 'Utile',
    notHelpful: 'Pas utile',
    thanks: 'Merci pour votre avis !',
    errRate: 'Cela fait beaucoup de questions : attendez une minute (ou jusqu’à demain), puis réessayez.',
    errBusy: 'Ket a atteint sa limite de réponses pour aujourd’hui. Réessayez demain.',
    errNetwork: 'Impossible de joindre Ket. Veuillez réessayer.',
    level: 'Niveau',
    levels: { kids: 'Enfants', normal: 'Normal', math: 'Avec les maths' },
  },
};
