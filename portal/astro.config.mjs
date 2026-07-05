// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://fun-with-quantum.org',
  trailingSlash: 'ignore',
  redirects: {
    '/about': '/#about',
  },
});
