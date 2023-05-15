const { Queue } = require('bullmq');

const FailStuckBuildsQueueName = 'fail-stuck-builds';

class FailStuckBuildsQueue extends Queue {
  constructor(connection) {
    super(FailStuckBuildsQueueName, { connection });
  }
}

module.exports = {
  FailStuckBuildsQueue,
  FailStuckBuildsQueueName,
};
