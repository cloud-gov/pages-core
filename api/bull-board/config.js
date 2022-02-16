const {
  APP_ENV,
  APP_HOSTNAME,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  LOG_LEVEL,
  PRODUCT,
  REDIS_URL,
  REDIS_TLS,
  UAA_CLIENT_ID,
  UAA_CLIENT_SECRET,
  UAA_HOST,
  UAA_HOST_DOCKER_URL,
} = process.env;

const internalUAAHost = UAA_HOST_DOCKER_URL || UAA_HOST;

// if (!REDIS_URL) throw new Error('No Redis credentials found');

module.exports = {
  appEnv: APP_ENV,
  helmet: {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': [
          "'self'",
          'fonts.gstatic.com',
          'fonts.googleapis.com',
        ],
      },
    },
    frameguard: {
      action: 'deny',
    },
    xssFilter: false,
  },
  github: {
    clientID: GITHUB_CLIENT_ID || 'test',
    clientSecret: GITHUB_CLIENT_SECRET || 'test',
    callbackURL: `${APP_HOSTNAME}/auth/github/callback`,
    scope: ['user', 'repo'],
    state: true,
  },
  log: {
    level: LOG_LEVEL || 'info',
  },
  product: PRODUCT,
  uaa: {
    apiUrl: internalUAAHost,
    authorizationURL: `${UAA_HOST}/oauth/authorize`,
    callbackURL: `${APP_HOSTNAME}/auth/uaa/callback`,
    clientID: UAA_CLIENT_ID,
    clientSecret: UAA_CLIENT_SECRET,
    logoutCallbackURL: `${APP_HOSTNAME}/auth/uaa/logout`,
    logoutURL: `${UAA_HOST}/logout.do`,
    tokenURL: `${internalUAAHost}/oauth/token`,
    userURL: `${internalUAAHost}/userinfo`,
    scope: ['openid'],
    state: true,
  },
  redis: {
    url: REDIS_URL,
    tls: REDIS_TLS,
  },
};
