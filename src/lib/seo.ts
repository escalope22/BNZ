// Constantes et helpers pour les balises SEO et les données structurées (JSON-LD).

export const NOM_SITE       = 'BNZ Toitures';
export const TELEPHONE_E164 = '+33631295662';
export const IMAGE_DEFAUT   = '/og-default.jpg';
export const AUTEUR         = 'Benjamin';

/** URL absolue d'un chemin, construite à partir de `site` (astro.config), sans slash final. */
export function urlAbsolue(chemin: string, site: URL | undefined): string {
  if (!site) throw new Error('`site` doit être défini dans astro.config.mjs');
  const url = new URL(chemin, site);
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}

/** Sérialise un objet JSON-LD pour une balise <script>, en neutralisant `</script>`. */
export function serialiserJsonLd(donnees: object): string {
  return JSON.stringify(donnees).replace(/</g, '\\u003c');
}

export function filAriane(elements: { nom: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: elements.map((element, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: element.nom,
      item: element.url,
    })),
  };
}

function markdownEnTexte(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')       // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')    // liens
    .replace(/(\*\*|__|\*|_|`)/g, '')           // emphase, code
    .replace(/^\s*[-*+]\s+/gm, '')              // puces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrait les questions/réponses de la section FAQ d'un article Markdown :
 * chaque H3 situé sous un H2 contenant « FAQ » devient une question,
 * le texte qui le suit (jusqu'au titre suivant) devient la réponse.
 */
export function extraireFaq(markdown: string): { question: string; reponse: string }[] {
  const lignes = markdown.split(/\r?\n/);
  const faq: { question: string; reponse: string }[] = [];
  let dansFaq = false;
  let courante: { question: string; lignes: string[] } | null = null;

  const cloturer = () => {
    if (courante) {
      const reponse = markdownEnTexte(courante.lignes.join('\n'));
      if (reponse) faq.push({ question: markdownEnTexte(courante.question), reponse });
    }
    courante = null;
  };

  for (const ligne of lignes) {
    const titre = ligne.match(/^(#{1,6})\s+(.*)$/);
    if (titre) {
      const niveau = titre[1].length;
      if (niveau <= 2) {
        cloturer();
        dansFaq = niveau === 2 && /\bFAQ\b/i.test(titre[2]);
        continue;
      }
      if (dansFaq) {
        cloturer();
        if (niveau === 3) courante = { question: titre[2], lignes: [] };
        continue;
      }
    }
    if (courante) (courante as { lignes: string[] }).lignes.push(ligne);
  }
  cloturer();
  return faq;
}
