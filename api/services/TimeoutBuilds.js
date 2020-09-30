const moment = require('moment');
const { Op } = require('sequelize');

const { Build } = require('../models');

const TIMEOUT = process.env.BUILD_TIMEOUT || 45;

const timeoutBuilds = (date = new Date()) => {
  const now = moment(date);
  const cutoff = now.clone().subtract(TIMEOUT, 'minutes');

  const atts = {
    error: 'The build timed out',
    state: 'error',
    completedAt: now.toDate(),
  };

  const options = {
    where: {
      state: 'processing',
      startedAt: {
        [Op.lt]: cutoff.toDate(),
      },
    },
    returning: ['id'],
  };

  return Build.update(atts, options);
};

module.exports = timeoutBuilds;
