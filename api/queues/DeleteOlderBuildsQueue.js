const { Queue } = require('bullmq');

const DeleteOlderBuildsQueueName = 'delete-older-builds';

class DeleteOlderBuildsQueue extends Queue {
  constructor(connection) {
    super(DeleteOlderBuildsQueueName, { connection });
  }
}

module.exports = {
  DeleteOlderBuildsQueue,
  DeleteOlderBuildsQueueName,
};
