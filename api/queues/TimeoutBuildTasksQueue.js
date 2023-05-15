const { Queue } = require('bullmq');

const TimeoutBuildTasksQueueName = 'timeout-build-tasks';

class TimeoutBuildTasksQueue extends Queue {
  constructor(connection) {
    super(TimeoutBuildTasksQueueName, { connection });
  }
}

module.exports = {
  TimeoutBuildTasksQueue,
  TimeoutBuildTasksQueueName,
};
