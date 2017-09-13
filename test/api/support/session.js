const crypto = require('crypto');
const factory = require('./factory');
const csrfToken = require('./csrfToken');
const config = require('../../../config');

function unauthenticatedSession() {
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
  };

  return config.session.store.set(sessionKey, sessionBody)
    .then(() => {
      const signedSessionKey = `${sessionKey}.${crypto
        .createHmac('sha256', config.session.secret)
        .update(sessionKey)
        .digest('base64')
        .replace(/=+$/, '')}`;
      return `${config.session.key}=s%3A${signedSessionKey}`;
    });
}

function authenticatedSession(user) {
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
      return config.session.store.set(sessionKey, sessionBody);
    })
    .then(() => {
      const signedSessionKey = `${sessionKey}.${crypto
        .createHmac('sha256', config.session.secret)
        .update(sessionKey)
        .digest('base64')
        .replace(/=+$/, '')}`;
      return `${config.session.key}=s%3A${signedSessionKey}`;
    });
}

module.exports = {
  authenticatedSession,
  unauthenticatedSession,
};
