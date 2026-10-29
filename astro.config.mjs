// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

import sitemap from '@astrojs/sitemap';

// Pages exclues du sitemap (remerciement, pages légales)
const PAGES_EXCLUES = ['/merci', '/mentions-legales', '/politique-de-confidentialite', '/cgv'];

// https://astro.build/config
export default defineConfig({
  site: 'https://bnz-toitures.com',
  // Une seule forme d'URL : sans slash final, comme les liens internes (/blog, /contact…)
  trailingSlash: 'never',
  output: 'static',

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true
    }
  }),

  integrations: [
    sitemap({
      filter: (page) => {
        const chemin = new URL(page).pathname.replace(/\/$/, '');
        return !PAGES_EXCLUES.includes(chemin);
      },
    }),
  ],
});
