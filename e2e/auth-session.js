const crypto = require('crypto');

const sessionConfig = require('../api/init/sessionConfig');
const factory = require('../test/api/support/factory');

function authenticatedSession(user, cfg = sessionConfig, role = 'pages.admin') {
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
        role,
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
};
