const { Queue } = require('bullmq');

const SiteDeletionQueueName = 'site-deletion';

class SiteDeletionQueue extends Queue {
  constructor(connection) {
    super(SiteDeletionQueueName, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        delay: 2 * 60 * 1000, // 2 minutes
      },
    });
  }
}

module.exports = {
  SiteDeletionQueue,
  SiteDeletionQueueName,
};
