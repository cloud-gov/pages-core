const { Queue } = require('bullmq');

const BuildTasksQueueName = 'build-tasks';

class BuildTasksQueue extends Queue {
  constructor(connection, { attempts = 1 } = {}) {
    super(BuildTasksQueueName, {
      connection,
      defaultJobOptions: {
        attempts,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
      },
    });
  }
}

module.exports = {
  BuildTasksQueue,
  BuildTasksQueueName,
};
