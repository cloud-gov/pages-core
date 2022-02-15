const { MemoryStore } = require('express-session');

const {
  NODE_ENV,
  SESSION_SECRET,
} = process.env;

module.exports = {
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
  },
  name: 'federalist-bull-board.sid',
  secret: SESSION_SECRET,
  proxy: true,
  resave: true,
  saveUninitialized: true,
  store: new MemoryStore(),
};
