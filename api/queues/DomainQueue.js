const { Queue } = require('bullmq');

const DomainQueueName = 'domain';

class DomainQueue extends Queue {
  constructor(connection) {
    super(DomainQueueName, {
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
  DomainQueue,
  DomainQueueName,
};
