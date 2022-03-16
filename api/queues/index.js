const { ArchiveBuildLogsQueue, ArchiveBuildLogsQueueName } = require('./ArchiveBuildLogsQueue');
const { DomainQueue, DomainQueueName } = require('./DomainQueue');
const { MailQueue, MailQueueName } = require('./MailQueue');
const { ScheduledQueue, ScheduledQueueName } = require('./ScheduledQueue');
const { SlackQueue, SlackQueueName } = require('./SlackQueue');

module.exports = {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
  DomainQueue,
  DomainQueueName,
  MailQueue,
  MailQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SlackQueue,
  SlackQueueName,
};
