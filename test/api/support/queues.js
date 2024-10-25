const IORedis = require('ioredis');
const { redis: redisConfig } = require('../../../config');

const connection = new IORedis(redisConfig.url, {
  tls: redisConfig.tls,
  maxRetriesPerRequest: null,
});

function promisedQueueEvents(queueEvents, event) {
  return new Promise((resolve) => {
    queueEvents.on(event, resolve);
  });
}

function promisedQueueAnyEvents(queueEvents, events) {
  return new Promise((resolve) => {
    events.forEach((event) => queueEvents.on(event, resolve));
  });
}

function promisedQueueAllEvents(queueEvents) {
  const events = [
    'active',
    'added',
    'cleaned',
    'completed',
    'delayed',
    'drained',
    'duplicated',
    'error',
    'failed',
    'paused',
    'progress',
    'removed',
    'resumed',
    'stalled',
    'waiting',
    'ioredis:close',
    'retries-exhausted',
    'waiting-children',
  ];

  return new Promise((resolve) => {
    events.forEach((event) =>
      queueEvents.on(event, (x) => {
        return resolve(x);
      })
    );
  });
}

module.exports = {
  connection,
  promisedQueueEvents,
  promisedQueueAnyEvents,
  promisedQueueAllEvents,
};
