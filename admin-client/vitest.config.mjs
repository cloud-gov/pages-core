import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      compilerOptions: {
        dev: true,
        // Enable Svelte 5 legacy mode for Svelte 3 compatibility
        compatibility: {
          componentApi: 4,
        },
      },
    }),
  ],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.js'],
  },
  define: {
    API_URL: JSON.stringify('http://localhost:3000'),
  },
});
