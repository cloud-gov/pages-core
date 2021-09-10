const IORedis = require('ioredis');
const moment = require('moment');
const { redis: redisConfig, app: appConfig } = require('../../../config');
const { MailQueue } = require('../../queues');
const Templates = require('./templates');

let mailQueue;
const { hostname, app_env: appEnv } = { ...appConfig };

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
    to: [email],
    subject: 'Invitation to join cloud.gov Pages',
    html: Templates.uaaInvite({ link }),
  });
}

async function sendSandboxReminder(organization) {
  const dateStr = moment(organization.sandboxNextCleaningAt).format('MM-DD-YYYY');

  const {
    id: organizationId,
    name: organizationName,
    Users: users,
    Sites: sites,
  } = organization;

  const subject = `Your Pages sandbox organization's sites will be removed in ${organization.daysUntilSandboxCleaning} days`;
  ensureInit();

  return mailQueue.add('sandbox-reminder', {
    to: users.map(user => user.email),
    subject,
    html: Templates.sandboxReminder({
      organizationName,
      dateStr,
      organizationId,
      sites: sites.map(({ id, owner, repository }) => ({ id, owner, repository })),
      hostname,
    }),
  });
}
async function sendAlert(reason, errors) {
  ensureInit();
  return mailQueue.add('alert', {
    to: ['federalist-alerts@gsa.gov'],
    subject: `Federalist ${appEnv} Alert | ${reason}`,
    html: Templates.alert({ errors, reason }),
  });
}

module.exports = {
  init,
  sendUAAInvite,
  sendSandboxReminder,
  sendAlert,
};
