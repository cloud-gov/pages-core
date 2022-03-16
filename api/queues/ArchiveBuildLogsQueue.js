const { Queue } = require('bullmq');

const ArchiveBuildLogsQueueName = 'archive-build-logs';

class ArchiveBuildLogsQueue extends Queue {
  constructor(connection) {
    super(ArchiveBuildLogsQueueName, { connection });
  }
}

module.exports = {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
};
