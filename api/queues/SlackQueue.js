const { Queue } = require('bullmq');

const SlackQueueName = 'slack';

class SlackQueue extends Queue {
  constructor(connection) {
    super(SlackQueueName, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    });
  }
}

module.exports = {
  SlackQueue,
  SlackQueueName,
};
