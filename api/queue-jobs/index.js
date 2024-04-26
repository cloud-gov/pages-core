const IORedis = require('ioredis');
const { SiteBuildsQueue } = require('../queues');
const { truncateString } = require('../utils');
const { redis } = require('../../config');

const connection = new IORedis(redis.url, {
  tls: redis.tls,
  maxRetriesPerRequest: null,
});

const siteBuildsQueue = new SiteBuildsQueue(connection);

const QueueJobs = {};

/**
* Adds a site build job to the Site Builds Queue
* The build's branch, site owner, and site repository attributes
* are used to creat the name of the job added to the queue
* @async
* @method startSiteBuild
* @param {Object} build - An instance of the model Build
* @param {number} build.id - The build primary key
* @param {string} build.branch - The git branch for the site build
* @param {Object} build.Site - The build instance's related site
* @param {string} build.Site.owner - The site's owner
* @param {string} build.Site.repository - The site's repository
* @return {Promise<{Object}>} The bullmq's queue add job response
*/
QueueJobs.startSiteBuild = async (build, priority) => {
  const { branch, id: buildId, Site } = build;
  const { owner, repository } = Site;
  const jobName = `${owner}/${repository}: ${truncateString(branch)}`;

  return siteBuildsQueue.add(jobName, { buildId }, { priority });
};

module.exports = QueueJobs;
