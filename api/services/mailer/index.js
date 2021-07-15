const IORedis = require('ioredis');
const { redis: redisConfig } = require('../../../config');
const { MailQueue } = require('../../queues');
const Templates = require('./templates');

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

module.exports = {
  init,
  sendUAAInvite,
};
