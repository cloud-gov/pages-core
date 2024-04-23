const { Queue } = require('bullmq');

const SiteBuildsQueueName = 'site-builds';

class SiteBuildsQueue extends Queue {
  constructor(connection, { attempts = 1 } = {}) {
    super(SiteBuildsQueueName, {
      connection,
      defaultJobOptions: {
        attempts,
      },
    });
  }
}

module.exports = {
  SiteBuildsQueue,
  SiteBuildsQueueName,
};
