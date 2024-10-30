const moment = require('moment');
const { Op } = require('sequelize');
const { Build, BuildLog } = require('../models');

const BUILD_STUCK_MINUTES = 10;

async function checkStuckBuilds() {
  const date = new Date();
  const now = moment(date);
  const buildQueueTime = now.clone().subtract(BUILD_STUCK_MINUTES, 'minutes');

  const options = {
    attributes: ['id'],
    where: {
      state: {
        [Op.in]: [Build.States.Created, Build.States.Tasked],
      },
      updatedAt: {
        [Op.lt]: buildQueueTime.toDate(),
      },
    },
    returning: ['id'],
  };

  const builds = await Build.findAll(options);

  return builds.map((b) => b.id);
}

async function failBuilds(buildIds) {
  const [, updated] = await Build.update(
    {
      state: Build.States.Error,
    },
    {
      where: {
        id: {
          [Op.in]: buildIds,
        },
      },
      returning: ['id', 'state'],
    },
  );

  const bulkLogs = updated.map((record) => ({
    build: record.id,
    source: 'ALL',
    output: 'An error occurred while trying to build this branch. Please rebuild branch.',
  }));

  await BuildLog.bulkCreate(bulkLogs);

  return updated.map((b) => b);
}

async function runFailStuckBuilds() {
  const buildIds = await checkStuckBuilds();

  if (buildIds.length === 0) return null;

  return failBuilds(buildIds);
}

module.exports = {
  runFailStuckBuilds,
};
