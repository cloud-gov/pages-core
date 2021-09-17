const { MailQueue, MailQueueName } = require('./MailQueue');
const { ScheduledQueue, ScheduledQueueName } = require('./ScheduledQueue');
const { SlackQueue, SlackQueueName } = require('./SlackQueue');

module.exports = {
  MailQueue,
  MailQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SlackQueue,
  SlackQueueName,
};
