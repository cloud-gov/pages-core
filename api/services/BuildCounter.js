const moment = require('moment');
const { Build } = require('../models');

const countBuildsFromPastWeek = () => {
  const oneWeekAgo = moment().subtract(1, 'week').startOf('day').format();
  return Build.count({ where: { createdAt: { $gt: oneWeekAgo } } });
};

module.exports = { countBuildsFromPastWeek };
