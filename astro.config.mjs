// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'static', // Static by default, opt-out specific routes with prerender: false
  adapter: vercel(), // Vercel adapter for server routes
});
