const IORedis = require('ioredis');
const config = require('../../../config');
const { SlackQueue } = require('../../queues');
const Templates = require('./templates');

const { redis: redisConfig, app: { appEnv } } = config;

let slackQueue;

function ensureInit() {
  if (!slackQueue) {
    throw new Error('Slack Queue is not initialized, did you forget to call `init()`?');
  }
}

function createConnection() {
  return new IORedis(redisConfig.url, {
    tls: redisConfig.tls,
  });
}

function init(connection) {
  slackQueue = new SlackQueue(connection || createConnection());
}

async function sendAlert(reason, errors) {
  ensureInit();
  return slackQueue.add('alert', {
    channel: 'federalist-supportstream',
    text: Templates.alert({ errors, reason }),
    username: `Federalist ${appEnv} Alerts`,
  });
}

module.exports = {
  init,
  sendAlert,
};
