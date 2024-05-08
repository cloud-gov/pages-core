const path = require('path');
const {
  BuildTask,
} = require('../models');
const config = require('../../config');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const S3Helper = require('./S3Helper');

const apiClient = new CloudFoundryAPIClient();

const statusCallbackURL = buildTask => new URL(
  path.join('/v0/tasks', String(buildTask.id), buildTask.token),
  config.app.hostname
).href;

const generateDefaultCredentials = async buildTask => ({
  STATUS_CALLBACK: statusCallbackURL(buildTask),
  TASK_ID: buildTask.id,
});

const buildContainerEnvironment = async (buildTask) => {
  const defaultCredentials = await generateDefaultCredentials(buildTask);

  return apiClient
    .fetchServiceInstanceCredentials(buildTask.Build.Site.s3ServiceName)
    .then(credentials => ({
      ...defaultCredentials,
      AWS_DEFAULT_REGION: credentials.region,
      AWS_ACCESS_KEY_ID: credentials.access_key_id,
      AWS_SECRET_ACCESS_KEY: credentials.secret_access_key,
      BUCKET: credentials.bucket,
    }));
};

const setupBucket = async (build) => {
  const credentials = await apiClient.fetchServiceInstanceCredentials(
    build.Site.s3ServiceName
  );
  const {
    access_key_id, // eslint-disable-line
    bucket,
    region,
    secret_access_key, // eslint-disable-line
  } = credentials;

  const s3Client = new S3Helper.S3Client({
    accessKeyId: access_key_id, // eslint-disable-line
    secretAccessKey: secret_access_key, // eslint-disable-line
    bucket,
    region,
  });

  // Wait until AWS credentials are usable in case we had to
  // provision new ones. This may take up to 10 seconds.
  await s3Client.waitForBucket();

  return true;
};

const BuildTaskQueue = {
  messageBodyForBuild: async buildTask => buildContainerEnvironment(buildTask),

  setupTaskEnv: async (buildTaskId) => {
    const buildTask = await BuildTask.forRunner().findByPk(buildTaskId);

    await setupBucket(buildTask.Build);

    const data = await BuildTaskQueue.messageBodyForBuild(buildTask);

    return {
      buildTask,
      data,
    };
  },
};

module.exports = BuildTaskQueue;
