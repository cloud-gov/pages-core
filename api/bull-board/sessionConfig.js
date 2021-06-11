const session = require('express-session');
const IORedis = require('ioredis');
const RedisStore = require('connect-redis')(session);
const { logger } = require('../../winston');
const sessionConfig = require('../../config/session');
const config = require('./config');

const client = new IORedis(config.redis.url);
client.on('error', logger.error);

module.exports = {
  ...sessionConfig,
  name: 'federalist-bull-board.sid',
  // I think we only need `name`, but adding `key` for legacy
  key: 'federalist-bull-board.sid',
  // Use a different secret
  secret: `${sessionConfig.secret}bull-board`,
  store: new RedisStore({ client, prefix: 'bullboardSess' }),
};
