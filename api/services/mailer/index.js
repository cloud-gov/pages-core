const IORedis = require('ioredis');
const moment = require('moment');
const PromisePool = require('@supercharge/promise-pool');
const { redis: redisConfig, app: { hostname, app_env: appEnv } } = require('../../../config');
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
    to: [email],
    subject: 'Invitation to join cloud.gov Pages',
    html: Templates.uaaInvite({ link }),
  });
}

async function sendSandboxReminder(organization) {
  const {
    id: organizationId,
    name: organizationName,
    Sites: sites,
    Users: users,
  } = organization;

  const dateStr = moment(organization.sandboxNextCleaningAt).format('MM-DD-YYYY');
  const subject = `Your Pages sandbox organization's sites will be removed in ${organization.daysUntilSandboxCleaning} days`;

  ensureInit();

  const { results, errors } = await PromisePool
    .for(users)
    .process(user => mailQueue.add('sandbox-reminder', {
      to: [user.email],
      subject,
      html: Templates.sandboxReminder({
        organizationName,
        dateStr,
        organizationId,
        sites: sites.map(({ id, owner, repository }) => ({ id, owner, repository })),
        hostname,
      }),
    }));

  if (errors.length) {
    const errMsg = [
      `Failed to queue a sandbox reminders for organization@id=${organizationId} members:`,
      errors.map(e => `  user@id=${e.item.id}: ${e.message}`).join('\n'),
    ].join();
    throw new Error(errMsg);
  }

  return results;
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
