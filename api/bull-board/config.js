const {
  ADMIN_GITHUB_ORGANIZATION,
  ADMIN_GITHUB_TEAM,
  APP_ENV,
  APP_HOSTNAME,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  LOG_LEVEL,
  NODE_ENV,
  PRODUCT,
  REDIS_URL,
  REDIS_TLS,
  SESSION_SECRET,
  UAA_CLIENT_ID,
  UAA_CLIENT_SECRET,
  UAA_HOST,
  UAA_HOST_DOCKER_URL,
} = process.env;

const internalUAAHost = UAA_HOST_DOCKER_URL || UAA_HOST;

// if (!REDIS_URL) throw new Error('No Redis credentials found');

module.exports = {
  admin: {
    org: ADMIN_GITHUB_ORGANIZATION,
    team: ADMIN_GITHUB_TEAM,
  },
  appEnv: APP_ENV ?? 'development',
  cookie: {
    secure: NODE_ENV === 'production',
  },
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
  session: {
    secret: SESSION_SECRET || 'test-secret',
  },
  uaa: {
    apiUrl: internalUAAHost,
    authorizationURL: `${UAA_HOST}/oauth/authorize`,
    callbackURL: `${APP_HOSTNAME}/auth/uaa/callback`,
    clientID: UAA_CLIENT_ID || 'test',
    clientSecret: UAA_CLIENT_SECRET || 'test',
    logoutCallbackURL: `${APP_HOSTNAME}/auth/uaa/logout`,
    logoutURL: `${UAA_HOST}/logout.do`,
    tokenURL: `${internalUAAHost}/oauth/token`,
    userURL: `${internalUAAHost}/userinfo`,
    scope: ['openid'],
    state: true,
  },
  redis: {
    url: REDIS_URL || 'redis://redis:6379',
    tls: REDIS_TLS,
  },
  rateLimiting: {
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 50, // limit each IP to 50 requests per window
  },
  rateSlowing: {
    windowMs: 1 * 60 * 1000, // 1 minute window
    delayAfter: 25, // delay requests by delayMs after 25 are made in a window
    delayMs: 500, // delay requests by 500 ms
  },
};
