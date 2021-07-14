const { Queue } = require('bullmq');

const MailQueueName = 'mail';

class MailQueue extends Queue {
  constructor(connection) {
    super(MailQueueName, { connection });
  }
}

module.exports = {
  MailQueue,
  MailQueueName,
};
