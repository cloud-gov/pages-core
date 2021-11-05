const { DomainQueue, DomainQueueName } = require('./DomainQueue');
const { MailQueue, MailQueueName } = require('./MailQueue');
const { ScheduledQueue, ScheduledQueueName } = require('./ScheduledQueue');
const { SlackQueue, SlackQueueName } = require('./SlackQueue');

module.exports = {
  DomainQueue,
  DomainQueueName,
  MailQueue,
  MailQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SlackQueue,
  SlackQueueName,
};
