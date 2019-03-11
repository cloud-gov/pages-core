const moment = require('moment');
const Sequelize = require('sequelize');
const { Build } = require('../models');

const countBuildsFromPastWeek = () => {
  const oneWeekAgo = moment().subtract(1, 'week').startOf('day');
  return Build.count({ where: { createdAt: { [Sequelize.Op.gt]: oneWeekAgo } } });
};

module.exports = { countBuildsFromPastWeek };
