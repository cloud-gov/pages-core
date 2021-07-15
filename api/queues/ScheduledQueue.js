const { Queue } = require('bullmq');

const ScheduledQueueName = 'scheduled';

class ScheduledQueue extends Queue {
  constructor(connection) {
    super(ScheduledQueueName, { connection });
  }
}

module.exports = {
  ScheduledQueue,
  ScheduledQueueName,
};
