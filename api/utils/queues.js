const IORedis = require('ioredis');
const { redis } = require('../../config');

const createQueueConnection = () => new IORedis(redis.url, {
  tls: redis.tls,
  maxRetriesPerRequest: null,
});

module.exports = { createQueueConnection };
