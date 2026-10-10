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
}

export const ASSISTANT_TEXTS: Record<Locale, AssistantTexts> = {
  en: {
    open: 'Ask the explainer',
    title: 'Ask about the game',
    intro: 'Questions about this round, the rules or the physics behind it — for example “Why did I lose?”',
    privacy: 'Your questions and the game state are sent to Anthropic (Claude) to answer, and stored for 30 days to improve the explainer. Please don’t enter personal data.',
    privacyLink: 'Privacy',
    placeholder: 'Your question…',
    send: 'Ask',
    thinking: 'Thinking…',
    you: 'You',
    explainer: 'Explainer',
    helpful: 'Helpful',
    notHelpful: 'Not helpful',
    thanks: 'Thanks for the feedback!',
    errRate: 'That was a lot of questions — please wait a minute (or until tomorrow) and ask again.',
    errBusy: 'The explainer has answered all it can for today. Please try again tomorrow.',
    errNetwork: 'The explainer couldn’t be reached. Please try again.',
  },
  de: {
    open: 'Frag den Erklärer',
    title: 'Fragen zum Spiel',
    intro: 'Fragen zu dieser Runde, zu den Regeln oder zur Physik dahinter — zum Beispiel „Warum habe ich verloren?“',
    privacy: 'Deine Fragen und der Spielstand gehen zur Beantwortung an Anthropic (Claude) und werden 30 Tage gespeichert, um den Erklärer zu verbessern. Bitte gib keine persönlichen Daten ein.',
    privacyLink: 'Datenschutz',
    placeholder: 'Deine Frage…',
    send: 'Fragen',
    thinking: 'Denke nach…',
    you: 'Du',
    explainer: 'Erklärer',
    helpful: 'Hilfreich',
    notHelpful: 'Nicht hilfreich',
    thanks: 'Danke für die Rückmeldung!',
    errRate: 'Das waren viele Fragen — bitte warte eine Minute (oder bis morgen) und frag dann noch einmal.',
    errBusy: 'Der Erklärer hat für heute alles beantwortet, was er kann. Bitte versuch es morgen wieder.',
    errNetwork: 'Der Erklärer ist gerade nicht erreichbar. Bitte versuch es noch einmal.',
  },
  ja: {
    open: '解説役に質問する',
    title: 'ゲームについて質問',
    intro: 'このラウンド、ルール、その背後にある物理について質問できます。例:「なぜ負けたの?」',
    privacy: '質問とゲームの状態は回答のために Anthropic (Claude) に送信され、解説役の改善のため 30 日間保存されます。個人情報は入力しないでください。',
    privacyLink: 'プライバシー',
    placeholder: '質問を入力…',
    send: '質問する',
    thinking: '考え中…',
    you: 'あなた',
    explainer: '解説役',
    helpful: '役に立った',
    notHelpful: '役に立たなかった',
    thanks: 'フィードバックありがとうございます!',
    errRate: '質問が多すぎます。1 分ほど(または明日まで)待ってから、もう一度質問してください。',
    errBusy: '今日の回答数の上限に達しました。明日もう一度お試しください。',
    errNetwork: '解説役に接続できませんでした。もう一度お試しください。',
  },
  es: {
    open: 'Pregunta al explicador',
    title: 'Preguntas sobre el juego',
    intro: 'Preguntas sobre esta ronda, las reglas o la física que hay detrás; por ejemplo: «¿Por qué he perdido?»',
    privacy: 'Tus preguntas y el estado del juego se envían a Anthropic (Claude) para responder y se guardan 30 días para mejorar el explicador. No introduzcas datos personales.',
    privacyLink: 'Privacidad',
    placeholder: 'Tu pregunta…',
    send: 'Preguntar',
    thinking: 'Pensando…',
    you: 'Tú',
    explainer: 'Explicador',
    helpful: 'Útil',
    notHelpful: 'No es útil',
    thanks: '¡Gracias por tu opinión!',
    errRate: 'Han sido muchas preguntas: espera un minuto (o hasta mañana) y vuelve a preguntar.',
    errBusy: 'El explicador ya ha respondido todo lo que puede por hoy. Vuelve a intentarlo mañana.',
    errNetwork: 'No se ha podido contactar con el explicador. Inténtalo de nuevo.',
  },
  uk: {
    open: 'Запитати пояснювача',
    title: 'Питання про гру',
    intro: 'Питання про цей раунд, правила або фізику, що стоїть за ними, — наприклад: «Чому я програв?»',
    privacy: 'Ваші запитання та стан гри надсилаються до Anthropic (Claude) для відповіді й зберігаються 30 днів, щоб покращити пояснювача. Будь ласка, не вводьте особисті дані.',
    privacyLink: 'Конфіденційність',
    placeholder: 'Ваше запитання…',
    send: 'Запитати',
    thinking: 'Думаю…',
    you: 'Ви',
    explainer: 'Пояснювач',
    helpful: 'Корисно',
    notHelpful: 'Не корисно',
    thanks: 'Дякуємо за відгук!',
    errRate: 'Забагато запитань — зачекайте хвилину (або до завтра) і запитайте знову.',
    errBusy: 'На сьогодні пояснювач уже відповів на все, що міг. Спробуйте завтра.',
    errNetwork: 'Не вдалося зв’язатися з пояснювачем. Спробуйте ще раз.',
  },
  it: {
    open: 'Chiedi a chi spiega',
    title: 'Domande sul gioco',
    intro: 'Domande su questo round, sulle regole o sulla fisica che c’è dietro: per esempio «Perché ho perso?»',
    privacy: 'Le tue domande e lo stato del gioco vengono inviati ad Anthropic (Claude) per rispondere e conservati per 30 giorni per migliorare le spiegazioni. Non inserire dati personali.',
    privacyLink: 'Privacy',
    placeholder: 'La tua domanda…',
    send: 'Chiedi',
    thinking: 'Sto pensando…',
    you: 'Tu',
    explainer: 'Spiegazione',
    helpful: 'Utile',
    notHelpful: 'Non utile',
    thanks: 'Grazie per il feedback!',
    errRate: 'Sono state tante domande: aspetta un minuto (o fino a domani) e chiedi di nuovo.',
    errBusy: 'Per oggi sono state date tutte le risposte possibili. Riprova domani.',
    errNetwork: 'Impossibile raggiungere il servizio. Riprova.',
  },
  fr: {
    open: 'Demander à l’explicateur',
    title: 'Questions sur le jeu',
    intro: 'Des questions sur cette manche, les règles ou la physique derrière — par exemple « Pourquoi ai-je perdu ? »',
    privacy: 'Vos questions et l’état du jeu sont envoyés à Anthropic (Claude) pour y répondre, et conservés 30 jours pour améliorer l’explicateur. Merci de ne pas saisir de données personnelles.',
    privacyLink: 'Confidentialité',
    placeholder: 'Votre question…',
    send: 'Demander',
    thinking: 'Réflexion…',
    you: 'Vous',
    explainer: 'Explicateur',
    helpful: 'Utile',
    notHelpful: 'Pas utile',
    thanks: 'Merci pour votre avis !',
    errRate: 'Cela fait beaucoup de questions : attendez une minute (ou jusqu’à demain), puis réessayez.',
    errBusy: 'L’explicateur a répondu à tout ce qu’il pouvait pour aujourd’hui. Réessayez demain.',
    errNetwork: 'Impossible de joindre l’explicateur. Veuillez réessayer.',
  },
};
