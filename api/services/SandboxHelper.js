const moment = require('moment');
const { Op, fn, col, where: whereClause } = require('sequelize');
const PromisePool = require('@supercharge/promise-pool');
const { User, Organization, Site, Role, UAAIdentity } = require('../models');
const SiteDestroyer = require('./SiteDestroyer');
const { sandboxDays } = require('../../config').app;
const QueueJobs = require('../queue-jobs');
const { createQueueConnection } = require('../utils/queues');

const connection = createQueueConnection();
const queueJob = new QueueJobs(connection);

const notifyOrganizations = async (cleaningDate) => {
  const dateStr = moment(cleaningDate).format('YYYY-MM-DD');
  const managerRole = await Role.findOne({
    where: {
      name: 'manager',
    },
  });
  const orgsToNotify = await Organization.findAll({
    where: {
      [Op.and]: [
        {
          isSandbox: true,
        },
        whereClause(fn('date', col('"sandboxNextCleaningAt"')), dateStr),
      ],
    },
    include: [
      {
        model: User,
        required: true,
        through: {
          where: {
            roleId: managerRole.id,
          },
        },
        include: UAAIdentity,
      },
      {
        model: Site,
        required: true,
      },
    ],
  });
  return Promise.allSettled(orgsToNotify.map((org) => queueJob.sendSandboxReminder(org)));
};

const destroySites = async (organization) => {
  const { id, Sites: sites } = organization;
  const { errors } = await PromisePool.for(sites)
    .withConcurrency(5)
    // this is okay to call directly because
    // cleanSandboxes is only called in a background/queue job
    .process((site) => SiteDestroyer.destroySite(site));

  if (errors.length) {
    const errMsg = [
      // eslint-disable-next-line max-len
      `Unable to clean sandbox org@id=${id}. Removing org sites failed with the following errors:`,
      errors.map((e) => `  site@id=${e.item.id}: ${e.message}`).join('\n'),
    ].join();
    throw new Error(errMsg);
  }
};

const cleanSandboxes = async (cleaningDate) => {
  const orgsToClean = await Organization.findAll({
    where: {
      isSandbox: true,
      sandboxNextCleaningAt: {
        [Op.lte]: cleaningDate,
      },
    },
    include: {
      model: Site,
      required: true,
    },
  });
  return Promise.allSettled(
    orgsToClean.map((org) =>
      destroySites(org).then(() =>
        org.update({
          sandboxNextCleaningAt: moment().add(sandboxDays, 'days').toDate(),
        }),
      ),
    ),
  );
};

module.exports = {
  notifyOrganizations,
  cleanSandboxes,
};
