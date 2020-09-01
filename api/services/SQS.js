const AWS = require('aws-sdk');
const url = require('url');
const S3Helper = require('./S3Helper');
const config = require('../../config');
const { logger } = require('../../winston');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const { buildViewLink, buildUrl } = require('../utils/build');

const apiClient = new CloudFoundryAPIClient();

const buildConfig = config.build;

const defaultBranch = build => build.branch === build.Site.defaultBranch;
const demoBranch = build => build.branch === build.Site.demoBranch;

const siteConfig = (build) => {
  let siteBuildConfig;
  if (defaultBranch(build)) {
    siteBuildConfig = build.Site.defaultConfig;
  } else if (demoBranch(build)) {
    siteBuildConfig = build.Site.demoConfig;
  } else {
    siteBuildConfig = build.Site.previewConfig;
  }
  return siteBuildConfig || {};
};

const baseURLForDomain = rawDomain => url.parse(rawDomain).path.replace(/(\/)+$/, '');

const sitePrefixForBuild = rawDomain => baseURLForDomain(rawDomain).replace(/^(\/)+/, '');

const baseURLForBuild = build => baseURLForDomain(buildViewLink(build, build.Site));

const statusCallbackURL = build => [
  url.resolve(config.app.hostname, '/v0/build'),
  build.id,
  'status',
  build.token,
].join('/');

const buildLogCallbackURL = build => [
  url.resolve(config.app.hostname, '/v0/build'),
  build.id,
  'log',
  build.token,
].join('/');

const buildUEVs = uevs => (uevs
  ? uevs.map(uev => ({
    name: uev.name,
    ciphertext: uev.ciphertext,
  }))
  : []);

const generateDefaultCredentials = build => ({
  AWS_DEFAULT_REGION: config.s3.region,
  AWS_ACCESS_KEY_ID: config.s3.accessKeyId,
  AWS_SECRET_ACCESS_KEY: config.s3.secretAccessKey,
  STATUS_CALLBACK: statusCallbackURL(build),
  LOG_CALLBACK: buildLogCallbackURL(build),
  BUCKET: config.s3.bucket,
  BASEURL: baseURLForBuild(build),
  CACHE_CONTROL: buildConfig.cacheControl,
  BRANCH: build.branch,
  CONFIG: JSON.stringify(siteConfig(build)),
  REPOSITORY: build.Site.repository,
  OWNER: build.Site.owner,
  SITE_PREFIX: sitePrefixForBuild(buildUrl(build, build.Site)),
  GITHUB_TOKEN: build.User.githubAccessToken,
  GENERATOR: build.Site.engine,
  SKIP_LOGGING: config.app.app_env === 'development',
  AUTH_BASEURL: process.env.APP_HOSTNAME,
  AUTH_ENDPOINT: 'external/auth/github',
  BUILD_ID: build.id,
  USER_ENVIRONMENT_VARIABLES: JSON.stringify(buildUEVs(build.Site.UserEnvironmentVariables)),
});

const buildContainerEnvironment = (build) => {
  const defaultCredentials = generateDefaultCredentials(build);

  if (build.Site.s3ServiceName === config.s3.serviceName) {
    return Promise.resolve(defaultCredentials);
  }

  return apiClient
    .fetchServiceInstanceCredentials(build.Site.s3ServiceName)
    .then(credentials => Object.assign({}, defaultCredentials, {
      AWS_DEFAULT_REGION: credentials.region,
      AWS_ACCESS_KEY_ID: credentials.access_key_id,
      AWS_SECRET_ACCESS_KEY: credentials.secret_access_key,
      BUCKET: credentials.bucket,
    }));
};

const setupBucket = async (build, buildCount) => {
  if (buildCount > 1) return true;

  const credentials = await apiClient.fetchServiceInstanceCredentials(build.Site.s3ServiceName);
  const {
    access_key_id, // eslint-disable-line
    bucket,
    region,
    secret_access_key, // eslint-disable-line
  } = credentials;

  const s3Client = new S3Helper.S3Client({
    accessKeyId: access_key_id,
    secretAccessKey: secret_access_key,
    bucket,
    region,
  });

  // Wait until AWS credentials are usable in case we had to
  // provision new ones. This may take up to 10 seconds.
  await s3Client.waitForCredentials();

  await s3Client.putBucketWebsite(build.Site.owner, build.Site.repository);
  await s3Client.putObject('User-agent: *\nDisallow: /\n', 'robots.txt', {
    CacheControl: 'max-age=60',
    ServerSideEncryption: 'AES256',
    ContentType: 'text/plain',
  });
  return true;
};

const sqsConfig = config.sqs;
const SQS = {
  sqsClient: new AWS.SQS({
    accessKeyId: sqsConfig.accessKeyId,
    secretAccessKey: sqsConfig.secretAccessKey,
    region: sqsConfig.region,
  }),
};

SQS.messageBodyForBuild = build => buildContainerEnvironment(build)
  .then(environment => ({
    environment: Object.keys(environment).map(key => ({
      name: key,
      value: environment[key],
    })),
    name: buildConfig.containerName,
  }));

SQS.sendBuildMessage = (build, buildCount) => SQS.messageBodyForBuild(build)
  .then((message) => {
    const params = {
      QueueUrl: sqsConfig.queue,
      MessageBody: JSON.stringify(message),
    };

    return setupBucket(build, buildCount)
      .then(() => {
        SQS.sqsClient.sendMessage(params, (err) => {
          if (err) {
            const errMsg = `There was an error, adding the job to SQS: ${err}`;
            logger.error(errMsg);
            build.updateJobStatus({
              status: 'error',
              message: errMsg,
            });
          }
          build.updateJobStatus({ state: 'queued' });
        });
      });
  });

module.exports = SQS;
