const { Queue } = require('bullmq');

const BuildTasksQueueName = 'build-tasks';

class BuildTasksQueue extends Queue {
  constructor(connection) {
    super(BuildTasksQueueName, {
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
  BuildTasksQueue,
  BuildTasksQueueName,
};
