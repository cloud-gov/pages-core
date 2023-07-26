const { ArchiveBuildLogsQueue, ArchiveBuildLogsQueueName } = require('./ArchiveBuildLogsQueue');
const { DomainQueue, DomainQueueName } = require('./DomainQueue');
const { FailStuckBuildsQueue, FailStuckBuildsQueueName } = require('./FailStuckBuildsQueue');
const { MailQueue, MailQueueName } = require('./MailQueue');
const { NightlyBuildsQueue, NightlyBuildsQueueName } = require('./NightlyBuildsQueue');
const { ScheduledQueue, ScheduledQueueName } = require('./ScheduledQueue');
const { SiteDeletionQueue, SiteDeletionQueueName } = require('./SiteDeletionQueue');
const { SlackQueue, SlackQueueName } = require('./SlackQueue');
const { TimeoutBuildTasksQueue, TimeoutBuildTasksQueueName } = require('./TimeoutBuildTasksQueue');

module.exports = {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
  DomainQueue,
  DomainQueueName,
  FailStuckBuildsQueue,
  FailStuckBuildsQueueName,
  MailQueue,
  MailQueueName,
  NightlyBuildsQueue,
  NightlyBuildsQueueName,
  SiteDeletionQueue,
  SiteDeletionQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SlackQueue,
  SlackQueueName,
  TimeoutBuildTasksQueue,
  TimeoutBuildTasksQueueName,
};
