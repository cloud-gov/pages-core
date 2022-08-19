// Until this is refactored into a completely separate app and we can use a .profile file,
// let's do this when running on CG
const cfenv = require('cfenv');

const {
  APP_ENV,
  PRODUCT,
} = process.env;

const appEnv = cfenv.getAppEnv();

const redisCreds = appEnv.getServiceCreds(`${PRODUCT}-${APP_ENV}-redis`);
process.env.REDIS_URL = redisCreds.uri;
process.env.REDIS_TLS = {};

const uaaCredentials = appEnv.getServiceCreds(`app-${APP_ENV}-uaa-client`);
process.env.UAA_CLIENT_ID = uaaCredentials.clientID;
process.env.UAA_CLIENT_SECRET = uaaCredentials.clientSecret;

if (PRODUCT === 'federalist') {
  const githubCredentials = appEnv.getServiceCreds(`${PRODUCT}-${APP_ENV}-github-queues-ui`);
  process.env.GITHUB_CLIENT_ID = githubCredentials.GITHUB_CLIENT_ID;
  process.env.GITHUB_CLIENT_SECRET = githubCredentials.GITHUB_CLIENT_SECRET;
}

const envCredentials = appEnv.getServiceCreds(`${PRODUCT}-${APP_ENV}-env`);
process.env.SESSION_SECRET = envCredentials.FEDERALIST_SESSION_SECRET;
