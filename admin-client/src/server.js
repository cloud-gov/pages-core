import { config } from 'dotenv';
import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';

config();

const {
  NODE_ENV,
  PORT,
  REDIRECT_BASE_URL,
} = process.env;

const dev = NODE_ENV === 'development';

polka()
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    sapper.middleware({
      session: () => ({
        REDIRECT_BASE_URL,
        authenticated: false,
        user: null,
      }),
    })
  )
  .listen(PORT, (err) => {
    // eslint-disable-next-line no-console
    if (err) console.log('error', err);
  });
