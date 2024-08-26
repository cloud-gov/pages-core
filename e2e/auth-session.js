const crypto = require('crypto');

const sessionConfig = require('../api/init/sessionConfig');
const factory = require('../test/api/support/factory');

// this file is adapted from test/api/support/session for use in CI testing
// it contains hardcoded session cookie key names rather than reading config from
// the pages, admin, and queues apps simultaneously

function authenticatedSession(user, app = 'pages', role = 'pages.admin', cfg = sessionConfig) {
  const sessionKey = crypto.randomBytes(8).toString('hex');
  let cookieKey = 'pages.sid';
  if (app === 'admin') cookieKey = 'pages-admin.sid';
  if (app === 'queues') cookieKey = `pages-${process.env.APP_ENV}-bull-board.sid`;

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
          user: u.id, role, // unsure if role is added here or one level up
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
      return `${cookieKey}=s%3A${signedSessionKey}`;
    });
}

module.exports = {
  authenticatedSession,
};
