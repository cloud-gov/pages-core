const { MemoryStore } = require('express-session');
const config = require('./config');

module.exports = {
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.cookie.secure,
    sameSite: 'lax',
  },
  name: 'federalist-bull-board.sid',
  secret: config.session.secret,
  proxy: true,
  resave: true,
  saveUninitialized: true,
  store: new MemoryStore(),
};
