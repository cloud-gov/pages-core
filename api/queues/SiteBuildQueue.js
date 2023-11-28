const { Queue } = require('bullmq');

const SiteBuildQueueName = 'site-build-queue';

class SiteBuildQueue extends Queue {
  constructor(connection) {
    super(SiteBuildQueueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    });
  }
}

module.exports = {
  SiteBuildQueue,
  SiteBuildQueueName,
};
