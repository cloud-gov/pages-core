import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    svelte({
      compilerOptions: {
        // Enable Svelte 5 legacy mode for Svelte 3 compatibility
        compatibility: {
          componentApi: 4,
        },
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@uswds/uswds/dist/img',
          dest: '..',
        },
        {
          src: 'node_modules/@uswds/uswds/dist/fonts',
          dest: '..',
        },
        {
          src: 'node_modules/@uswds/uswds/dist/css/uswds.min.css',
          dest: '..',
          transform: (contents) =>
            contents
              .toString()
              .replace(/\n?\/\*# sourceMappingURL=uswds\.min\.css\.map \*\//, ''),
        },
      ],
    }),
  ],
  build: {
    outDir: 'public/build',
    emptyOutDir: true,
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',
        chunkFileNames: 'bundle.js',
        assetFileNames: (assetInfo) => {
          // Rename the main CSS bundle
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'bundle.css';
          }
          return assetInfo.name || 'assets/[name][extname]';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    open: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    API_URL: JSON.stringify(process.env.API_URL || 'http://localhost:1337'),
  },
  publicDir: 'public', // Serve static assets from public/ in dev mode
}));
