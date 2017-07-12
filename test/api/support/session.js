const crypto = require('crypto');
const factory = require('./factory');
const config = require('../../../config');

const session = (user) => {
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
        authenticated: true,
        authenticatedAt: new Date(),
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
};

module.exports = session;
