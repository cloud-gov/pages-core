const moment = require('moment');
const { Op } = require('sequelize');
const PromisePool = require('@supercharge/promise-pool');
const Mailer = require('./mailer');
const { User, Organization, Site } = require('../models');
const { sandboxDays, sandboxMaxNoticeDays, sandboxNoticeFrequency } = require('../../config').app;
const SiteDestroyer = require('./SiteDestroyer');

const getSandboxOrganizations = (date, { include }) => Organization.findAll({
  where: {
    isSandbox: true,
    [Op.or]: [
      {
        sandboxCleanedAt: {
          [Op.lte]: date,
        },
      },
      {
        sandboxCleanedAt: null,
        createdAt: {
          [Op.lte]: date,
        },
      },
    ],
  },
  include,
});

const notifyOrganizations = async () => {
  const date = moment().subtract(sandboxDays - sandboxMaxNoticeDays, 'days').toDate();
  const orgs = await getSandboxOrganizations(date, {
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
  const orgsToNotify = orgs // notify every x days
    .filter(({ daysUntilSandboxCleaning: days }) => (days > 0 && !(days % sandboxNoticeFrequency)));
  return Promise.allSettled(orgsToNotify.map(org => Mailer.sendSandboxReminder(org)));
};

const destroySites = async ({ id, Sites: sites }) => {
  const { errors } = await PromisePool
    .for(sites)
    .withConcurrency(5)
    .process(site => SiteDestroyer.destroySite(site));

  if (errors.length) {
    const errMsg = [
      `Unable to clean sandbox org@id=${id}. Removing org sites failed with the following errors:`,
      errors.map(e => `  ${e.item.id}: ${e.message}`).join('\n'),
    ].join();
    throw new Error(errMsg);
  }
};

const cleanSandboxes = async () => {
  const date = moment().subtract(sandboxDays, 'days').toDate();
  const orgsToClean = await getSandboxOrganizations(date, {
    include: {
      model: Site,
      required: true,
    },
  });
  return orgsToClean.map(org => destroySites(org));
};

module.exports = { notifyOrganizations, cleanSandboxes };
