const IORedis = require('ioredis');
const config = require('../../../config');
const { MailQueue } = require('../../queues');
const Templates = require('./templates');

const { redis: redisConfig, app: { app_env: appEnv } } = config;

let mailQueue;

function ensureInit() {
  if (!mailQueue) {
    throw new Error('Mail Queue is not initialized, did you forget to call `init()`?');
  }
}

function createConnection() {
  return new IORedis(redisConfig.url, {
    tls: redisConfig.tls,
  });
}

function init(connection) {
  mailQueue = new MailQueue(connection || createConnection());
}

async function sendUAAInvite(email, link) {
  ensureInit();
  return mailQueue.add('uaa-invite', {
    to: email,
    subject: 'Invitation to join cloud.gov Pages',
    html: Templates.uaaInvite({ link }),
  });
}

async function sendAlert(reason, errors) {
  ensureInit();
  return mailQueue.add('alert', {
    to: ['federalist-admins@gsa.gov'],
    subject: `Federalist ${appEnv} Alert | ${reason}`,
    html: Templates.alert({ errors, reason }),
  });
}

module.exports = {
  init,
  sendUAAInvite,
  sendAlert,
};
