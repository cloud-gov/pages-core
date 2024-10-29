import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';

const { API_URL, NODE_ENV, ROLLUP_WATCH } = process.env;

const production = !ROLLUP_WATCH;
const apiUrl = API_URL || 'http://localhost:1337';

const uswds = 'node_modules/@uswds/uswds/dist';

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      // eslint-disable-next-line global-require
      server = require('child_process').spawn('yarn', ['start'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true,
      });

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    },
  };
}

export default {
  input: 'src/main.js',
  output: {
    sourcemap: true,
    format: 'es',
    name: 'app',
    file: 'public/build/bundle.js',
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      API_URL: JSON.stringify(apiUrl),
    }),
    copy({
      targets: [
        {
          src: `${uswds}/fonts`,
          dest: 'public',
        },
        {
          src: `${uswds}/img`,
          dest: 'public',
        },
        {
          src: [`${uswds}/css/uswds.min.css`, `${uswds}/css/uswds.min.css.map`],
          dest: 'public',
        },
      ],
      copyOnce: !production,
    }),
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: (css) => {
        css.write('bundle.css');
      },
    }),
    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production, minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
