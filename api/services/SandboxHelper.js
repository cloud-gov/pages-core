const moment = require('moment');
const {
  Op, fn, col, where: whereClause,
} = require('sequelize');
const PromisePool = require('@supercharge/promise-pool');
const Mailer = require('./mailer');
const { User, Organization, Site } = require('../models');
const { sandboxDays, sandboxNotices, sandboxNoticeDaysInterval } = require('../../config').app;
const SiteDestroyer = require('./SiteDestroyer');

const notifyOrganizations = async () => {
  const getNoticeDate = i => moment().subtract(sandboxDays - (i * sandboxNoticeDaysInterval), 'days')
    .format('YYYY-MM-DD');
  const dates = [];
  let i = 1;
  for (i = 1; i <= sandboxNotices; i += 1) {
    dates.push(getNoticeDate(i));
  }
  const where = {
    isSandbox: true,
    [Op.or]: [
      whereClause(fn('date', col('"sandboxCleanedAt"')), { [Op.in]: dates }),
      {
        [Op.and]: [
          { sandboxCleanedAt: null },
          whereClause(fn('date', col('Organization."createdAt"')), { [Op.in]: dates }),
        ],
      },
    ],
  };
  const orgsToNotify = await Organization.findAll({
    where,
    include: [
      {
        model: User,
        required: true,
      },
      {
        model: Site,
        required: true,
      },
    ],
  });
  return Promise.allSettled(orgsToNotify.map(org => Mailer.sendSandboxReminder(org)));
};

const destroySites = async (organization) => {
  const { id, Sites: sites } = organization;
  const { errors } = await PromisePool
    .for(sites)
    .withConcurrency(5)
    .process(site => SiteDestroyer.destroySite(site));

  if (errors.length) {
    const errMsg = [
      `Unable to clean sandbox org@id=${id}. Removing org sites failed with the following errors:`,
      errors.map(e => `  site@id=${e.item.id}: ${e.message}`).join('\n'),
    ].join();
    throw new Error(errMsg);
  }
};

const cleanSandboxes = async () => {
  const date = moment().subtract(sandboxDays, 'days').startOf('day').toDate();
  const orgsToClean = await Organization.findAll({
    where: {
      isSandbox: true,
      [Op.or]: [
        {
          sandboxCleanedAt: {
            [Op.lt]: date,
          },
        },
        {
          sandboxCleanedAt: null,
          createdAt: {
            [Op.lt]: date,
          },
        },
      ],
    },
    include: {
      model: Site,
      required: true,
    },
  });
  return Promise.allSettled(orgsToClean.map(org => destroySites(org)));
};

module.exports = { notifyOrganizations, cleanSandboxes };
