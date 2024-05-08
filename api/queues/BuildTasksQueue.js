const { Queue } = require('bullmq');

const BuildTasksQueueName = 'build-tasks';

class BuildTasksQueue extends Queue {
  constructor(connection, { attempts = 1 } = {}) {
    super(BuildTasksQueueName, {
      connection,
      defaultJobOptions: {
        attempts,
      },
    });
  }
}

module.exports = {
  BuildTasksQueue,
  BuildTasksQueueName,
};
