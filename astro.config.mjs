// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://MikeFrank99.github.io',
  base: '/Willi-Bevande',
  trailingSlash: 'always',
  integrations: [svelte()]
});