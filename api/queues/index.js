const {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
} = require('./ArchiveBuildLogsQueue');
const { BuildTasksQueue, BuildTasksQueueName } = require('./BuildTasksQueue');
const {
  CreateEditorSiteQueue,
  CreateEditorSiteQueueName,
} = require('./CreateEditorSiteQueue');
const { DomainQueue, DomainQueueName } = require('./DomainQueue');
const {
  FailStuckBuildsQueue,
  FailStuckBuildsQueueName,
} = require('./FailStuckBuildsQueue');
const { MailQueue, MailQueueName } = require('./MailQueue');
const { NightlyBuildsQueue, NightlyBuildsQueueName } = require('./NightlyBuildsQueue');
const { ScheduledQueue, ScheduledQueueName } = require('./ScheduledQueue');
const { SiteBuildsQueue, SiteBuildsQueueName } = require('./SiteBuildsQueue');
const { SiteDeletionQueue, SiteDeletionQueueName } = require('./SiteDeletionQueue');
const {
  TimeoutBuildTasksQueue,
  TimeoutBuildTasksQueueName,
} = require('./TimeoutBuildTasksQueue');

module.exports = {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
  BuildTasksQueue,
  BuildTasksQueueName,
  CreateEditorSiteQueue,
  CreateEditorSiteQueueName,
  DomainQueue,
  DomainQueueName,
  FailStuckBuildsQueue,
  FailStuckBuildsQueueName,
  MailQueue,
  MailQueueName,
  NightlyBuildsQueue,
  NightlyBuildsQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SiteBuildsQueue,
  SiteBuildsQueueName,
  SiteDeletionQueue,
  SiteDeletionQueueName,
  TimeoutBuildTasksQueue,
  TimeoutBuildTasksQueueName,
};
