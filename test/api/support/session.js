const crypto = require('crypto');

const sessionConfig = require('../../../api/init/sessionConfig');

const factory = require('./factory');
const csrfToken = require('./csrfToken');

function unauthenticatedSession({
  oauthState,
  authRedirectPath,
  cfg = sessionConfig,
} = {}) {
  const sessionKey = crypto.randomBytes(8).toString('hex');

  const sessionBody = {
    cookie: {
      originalMaxAge: null,
      expires: null,
      httpOnly: true,
      path: '/',
    },
    flash: {},
    authenticated: false,
    csrfSecret: csrfToken.TEST_CSRF_SECRET,
    'oauth2:uaa': {
      state: oauthState,
    },
    authRedirectPath,
  };

  return cfg.store.set(sessionKey, sessionBody).then(() => {
    const signedSessionKey = `${sessionKey}.${crypto
      .createHmac('sha256', cfg.secret)
      .update(sessionKey)
      .digest('base64')
      .replace(/=+$/, '')}`;
    return `${cfg.key}=s%3A${signedSessionKey}`;
  });
}

function authenticatedSession(user, cfg = sessionConfig) {
  const sessionKey = crypto.randomBytes(8).toString('hex');

  return Promise.resolve(user || factory.user())
    .then((u) => {
      const sessionBody = {
        cookie: {
          originalMaxAge: null,
          expires: null,
          httpOnly: true,
          path: '/',
        },
        passport: {
          user: u.id,
        },
        flash: {},
        authenticated: true,
        authenticatedAt: new Date(),
        csrfSecret: csrfToken.TEST_CSRF_SECRET,
      };
      return cfg.store.set(sessionKey, sessionBody);
    })
    .then(() => {
      const signedSessionKey = `${sessionKey}.${crypto
        .createHmac('sha256', cfg.secret)
        .update(sessionKey)
        .digest('base64')
        .replace(/=+$/, '')}`;
      return `${cfg.key}=s%3A${signedSessionKey}`;
    });
}

function authenticatedAdminOrSupportSession(
  user,
  cfg = sessionConfig,
  role = 'pages.admin',
) {
  const sessionKey = crypto.randomBytes(8).toString('hex');

  return Promise.resolve(user || factory.user())
    .then((u) => {
      const sessionBody = {
        cookie: {
          originalMaxAge: null,
          expires: null,
          httpOnly: true,
          path: '/',
        },
        passport: {
          user: {
            id: u.id,
            role,
          },
        },
        flash: {},
        authenticated: true,
        authenticatedAt: new Date(),
        csrfSecret: csrfToken.TEST_CSRF_SECRET,
      };
      return cfg.store.set(sessionKey, sessionBody);
    })
    .then(() => {
      const signedSessionKey = `${sessionKey}.${crypto
        .createHmac('sha256', cfg.secret)
        .update(sessionKey)
        .digest('base64')
        .replace(/=+$/, '')}`;
      return `${cfg.key}=s%3A${signedSessionKey}`;
    });
}

module.exports = {
  authenticatedSession,
  authenticatedAdminOrSupportSession,
  unauthenticatedSession,
};
