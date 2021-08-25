const moment = require('moment');
const { Op } = require('sequelize');
const Mailer = require('./mailer');
const { User, Organization, Site } = require('../models');
const { sandboxDays, sandboxMaxNoticeDays, sandboxNoticeFrequency } = require('../../config').app;

const notifyOrganizations = () => Organization.findAll({
  where: {
    isSandbox: true,
    [Op.or]: [
      {
        sandboxCleanedAt: {
          [Op.lte]: moment().subtract(sandboxDays - sandboxMaxNoticeDays, 'days').toDate(), // 2 weeks away
        },
      },
      {
        sandboxCleanedAt: null,
        createdAt: {
          [Op.lte]: moment().subtract(sandboxDays - sandboxMaxNoticeDays, 'days').toDate(), // 2 weeks away
        },
      },
    ],
  },
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
})
  .then(orgs => Promise.allSettled(orgs // notify every x days
    .filter(({ daysUntilSandboxCleaning: days }) => (days > 0 && !(days % sandboxNoticeFrequency)))
    .map(org => Mailer.sendSandboxReminder(org))));

module.exports = { notifyOrganizations };
