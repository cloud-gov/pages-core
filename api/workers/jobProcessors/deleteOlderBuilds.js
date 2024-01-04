const moment = require('moment');
const { Op } = require('sequelize');
const { Build } = require('../../models');
const Mailer = require('../../services/mailer');
const Slacker = require('../../services/slacker');
const { createJobLogger } = require('./utils');

async function deleteOlderBuilds(job) {
  const logger = createJobLogger(job);
  const cutoffDate = moment().subtract(180, 'days').startOf('day');

  logger.log(`Deleting all builds completed before ${cutoffDate}.`);

  try {
    const numDeleted = await Build.destroy({
      where: {
        completedAt: {
          [Op.lt]: cutoffDate.toDate(),
        },
      },
    });
    logger.log(`Deleted ${numDeleted} builds.`);
    await logger.flush();
    return 'OK';
  } catch (error) {
    const errMsg = `Delete builds before ${cutoffDate.format('YYYY-MM-DD')} completed with error`;
    logger.log(errMsg, error);
    await logger.flush();
    Mailer.init();
    Slacker.init();
    Mailer.sendAlert(errMsg, error);
    Slacker.sendAlert(errMsg, error);
    throw new Error(errMsg);
  }
}

module.exports = deleteOlderBuilds;
