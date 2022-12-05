const session = require('express-session');
const connectRedis = require('connect-redis');
const IORedis = require('ioredis');
const config = require('./config');

function configureSession() {
  const RedisStore = connectRedis(session);

  const client = new IORedis(config.redis.url, {
    tls: config.redis.tls,
    maxRetriesPerRequest: null,
  });

  const store = new RedisStore({ client });

  return session({
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: config.cookie.secure,
      sameSite: 'lax',
    },
    name: `${config.product}-${config.appEnv}-bull-board.sid`,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    store,
  });
}

module.exports = configureSession;
