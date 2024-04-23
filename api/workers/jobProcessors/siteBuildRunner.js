const { Build } = require('../../models');
const SiteBuildQueueService = require('../../services/SiteBuildQueue');
const { createJobLogger } = require('./utils');
const CloudFoundryAPIClient = require('../../utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

// Add CF Task (startBuildTask method) call to retry sleep interval to 1 second
// If it is in test environment set to 0 seconds
const sleepInterval = process.env.NODE_ENV === 'test' ? 0 : 1000;

/**
 * The Site Builds Queue job processor
 * to start a CF Task to build the site's branch
 * @async
 * @method siteBuildRunner
 * @param {Object} job - The bullmq job object
 * @param {object} job.data - The job data object
 * @param {string} job.data.buildId - The buildId for the site build job
 * @param {Object} options - The options for polling.
 * @param {number} [options.totalAttempts=180] - The total number of attempts
 * @param {number} [options.sleepNumber=15000] - The milliseconds
 * @return {Promise<{Object}>} The bullmq's queue add job response
 */
async function siteBuildRunner(
  job,
  { sleepNumber = 15000, totalAttempts = 180 } = {}
) {
  const logger = createJobLogger(job);
  const { buildId } = job.data;

  logger.log(`Running site build: ${buildId}`);
  try {
    const { build, message } = await SiteBuildQueueService.setupTaskEnv(
      buildId
    );

    const {
      branch,
      Site: { owner, repository },
    } = build;

    logger.log(
      `Starting site build for ${owner}/${repository} on branch ${branch}`
    );

    const cfResponse = await apiClient.startSiteBuildTask(message, job.id, {
      sleepInterval,
    });

    if (cfResponse.state === 'FAILED') {
      const errorMessage = `CF task failed for site build ${buildId}`;
      logger.log(errorMessage);
      throw new Error(errorMessage);
    }

    logger.log('The site build started successfully.');

    logger.log('Waiting for build status update.');
    const hasCompleted = await apiClient.pollTaskStatus(cfResponse.guid, {
      sleepInterval: sleepNumber,
      totalAttempts,
    });

    // reload instance
    await build.reload();

    if (
      hasCompleted.state === 'FAILED'
      && [
        Build.States.Processing,
        Build.States.Queued,
        Build.States.Created,
        Build.States.Tasked,
      ].includes(build.state)
    ) {
      await build.update({ state: Build.States.Error });
    }

    logger.log(`Site build completed with ${build.state}`);

    return true;
  } catch (err) {
    const message = `Error site build ${buildId}: ${err?.message}`;
    logger.log(message);
    const errorTask = await Build.findByPk(buildId);
    await errorTask.update({
      state: Build.States.Error,
      error: err?.message,
    });
    throw new Error(message);
  }
}

module.exports = siteBuildRunner;
