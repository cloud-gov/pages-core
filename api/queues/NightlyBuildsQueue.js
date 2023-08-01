const { Queue } = require('bullmq');

const NightlyBuildsQueueName = 'nightly-builds';

class NightlyBuildsQueue extends Queue {
  constructor(connection) {
    super(NightlyBuildsQueueName, { connection });
  }
}

module.exports = {
  NightlyBuildsQueue,
  NightlyBuildsQueueName,
};
