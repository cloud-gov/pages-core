const { Queue } = require('bullmq');

const MailQueueName = 'mail';

class MailQueue extends Queue {
  constructor(connection) {
    super(MailQueueName, {
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
  MailQueue,
  MailQueueName,
};
