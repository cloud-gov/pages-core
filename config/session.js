const env = require('../services/environment')();

module.exports = {
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  key: 'federalist.sid',
  secret: env.FEDERALIST_SESSION_SECRET || 'keyboard-cat',
  proxy: true,
  resave: true,
  saveUninitialized: true,
};
