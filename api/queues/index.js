const { ArchiveBuildLogsQueue, ArchiveBuildLogsQueueName } = require('./ArchiveBuildLogsQueue');
const { BuildTasksQueue, BuildTasksQueueName } = require('./BuildTasksQueue');
const { DomainQueue, DomainQueueName } = require('./DomainQueue');
const { FailStuckBuildsQueue, FailStuckBuildsQueueName } = require('./FailStuckBuildsQueue');
const { MailQueue, MailQueueName } = require('./MailQueue');
const { NightlyBuildsQueue, NightlyBuildsQueueName } = require('./NightlyBuildsQueue');
const { ScheduledQueue, ScheduledQueueName } = require('./ScheduledQueue');
const { SiteBuildQueue, SiteBuildQueueName } = require('./SiteBuildQueue');
const { SiteDeletionQueue, SiteDeletionQueueName } = require('./SiteDeletionQueue');
const { SlackQueue, SlackQueueName } = require('./SlackQueue');
const { TimeoutBuildTasksQueue, TimeoutBuildTasksQueueName } = require('./TimeoutBuildTasksQueue');

module.exports = {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
  BuildTasksQueue,
  BuildTasksQueueName,
  DomainQueue,
  DomainQueueName,
  FailStuckBuildsQueue,
  FailStuckBuildsQueueName,
  MailQueue,
  MailQueueName,
  NightlyBuildsQueue,
  NightlyBuildsQueueName,
  SiteBuildQueue,
  SiteBuildQueueName,
  SiteDeletionQueue,
  SiteDeletionQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SlackQueue,
  SlackQueueName,
  TimeoutBuildTasksQueue,
  TimeoutBuildTasksQueueName,
};
