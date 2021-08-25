const IORedis = require('ioredis');
const moment = require('moment');
const { redis: redisConfig, app: appConfig } = require('../../../config');
const { MailQueue } = require('../../queues');
const Templates = require('./templates');

let mailQueue;
const { hostname } = { ...appConfig };

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

async function sendSandboxReminder(organization) {
  const dateStr = moment(organization.sandboxCleaningScheduledAt).format('MM-DD-YYYY');

  const {
    id: organizationId,
    name: organizationName,
    Users,
  } = organization;

  const organizationLink = `${hostname}/organizations/${organizationId}`;
  const subject = `Your Pages sandbox organization's sites will be deleted in ${organization.daysUntilSandboxCleaning} days`;

  ensureInit();

  return mailQueue.add('sandbox-reminder', {
    to: Users.map(user => user.email).join('; '),
    subject,
    html: Templates.sandboxReminder({
      organizationName,
      dateStr,
      organizationLink,
    }),
  });
}

module.exports = {
  init,
  sendUAAInvite,
  sendSandboxReminder,
};
