/**
 * schema.org structured data (JSON-LD) for search engines, rendered by Base.astro (`jsonLd`).
 * Only facts the page itself shows: no ratings, no invented numbers.
 */
const SITE = 'https://fun-with-quantum.org';
const ORG_ID = `${SITE}/#organization`;
/** The publisher, named in full on every page (the Organization node itself is on the home page). */
const PUBLISHER = { '@type': 'Organization', '@id': ORG_ID, name: 'Fun with Quantum', url: `${SITE}/` };

/** The home page: who runs the site (Organization) and the site itself (WebSite). */
export function homeJsonLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'Fun with Quantum',
        url: `${SITE}/`,
        logo: `${SITE}/apple-touch-icon.png`,
        description,
        founder: { '@type': 'Person', name: 'Jan-R. Lahmann', sameAs: ['https://www.linkedin.com/in/JanLahmann'] },
        sameAs: ['https://github.com/JanLahmann/Fun-with-Quantum'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        name: 'Fun with Quantum',
        url: `${SITE}/`,
        inLanguage: 'en',
        publisher: { '@id': ORG_ID },
      },
    ],
  };
}

export interface GameFacts {
  id: string;
  title: string;
  description: string;
  concept: string;
  level: string;
  goals: string[];
  webGame: boolean;
}

/**
 * A game page. A browser game is a free web game (VideoGame, co-typed with WebApplication as Google
 * asks for software apps); a notebook-only game is a LearningResource (an interactive Jupyter notebook).
 * Both teach: level and learning goals are the ones on /teachers/.
 */
export function gameJsonLd(g: GameFacts) {
  const url = `${SITE}/play/${g.id}/`;
  const common = {
    '@context': 'https://schema.org',
    name: g.title,
    description: g.description,
    url,
    image: `${SITE}/og/${g.id}.png`,
    inLanguage: 'en',
    isAccessibleForFree: true,
    about: { '@type': 'Thing', name: g.concept },
    educationalLevel: g.level,
    teaches: g.goals,
    publisher: PUBLISHER,
  };
  return g.webGame
    ? {
        ...common,
        '@type': ['VideoGame', 'WebApplication'],
        genre: 'Educational game',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any (runs in a web browser)',
        gamePlatform: 'Web browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      }
    : {
        ...common,
        '@type': 'LearningResource',
        learningResourceType: 'Interactive Jupyter notebook',
      };
}
