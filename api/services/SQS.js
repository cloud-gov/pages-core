const AWS = require('aws-sdk');
const url = require('url');
const yaml = require('js-yaml');
const S3Helper = require('./S3Helper');
const config = require('../../config');
const { logger } = require('../../winston');
const CloudFoundryAPIClient = require('../utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

const buildConfig = config.build;

const defaultBranch = build => build.branch === build.Site.defaultBranch;
const demoBranch = build => build.branch === build.Site.demoBranch;

const siteConfig = (build) => {
  let siteBuildConfig = '';
  if (defaultBranch(build)) {
    siteBuildConfig = build.Site.defaultConfig;
  } else if (demoBranch(build)) {
    siteBuildConfig = build.Site.demoConfig;
  } else {
    siteBuildConfig = build.Site.previewConfig;
  }
  return siteBuildConfig ? yaml.safeDump(siteBuildConfig) : ''; // to be safedumped
};


const pathForBuild = (build) => {
  if (defaultBranch(build)) {
    return `site/${build.Site.owner}/${build.Site.repository}`;
  }
  if (demoBranch(build)) {
    return `demo/${build.Site.owner}/${build.Site.repository}`;
  }
  return `preview/${build.Site.owner}/${build.Site.repository}/${build.branch}`;
};

const baseURLForCustomDomain = (rawDomain) => {
  let domain = rawDomain;
  if (!domain.match(/https?:\/\//)) {
    domain = `https://${domain}`;
  }
  return url.parse(domain).path.replace(/\/$/, '');
};

const baseURLForBuild = (build) => {
  if (defaultBranch(build) && build.Site.domain) {
    return baseURLForCustomDomain(build.Site.domain);
  }
  if (demoBranch(build) && build.Site.demoDomain) {
    return baseURLForCustomDomain(build.Site.demoDomain);
  }
  return `/${pathForBuild(build)}`;
};

const statusCallbackURL = build => [
  url.resolve(config.app.internal_hostname, '/v0/build'),
  build.id,
  'status',
  build.token,
].join('/');

const buildLogCallbackURL = build => [
  url.resolve(config.app.internal_hostname, '/v0/build'),
  build.id,
  'log',
  build.token,
].join('/');

const sourceForBuild = build => build.source || {};

const generateDefaultCredentials = build => ({
  AWS_DEFAULT_REGION: config.s3.region,
  AWS_ACCESS_KEY_ID: config.s3.accessKeyId,
  AWS_SECRET_ACCESS_KEY: config.s3.secretAccessKey,
  STATUS_CALLBACK: statusCallbackURL(build),
  LOG_CALLBACK: buildLogCallbackURL(build),
  BUCKET: config.s3.bucket,
  BASEURL: baseURLForBuild(build),
  CACHE_CONTROL: buildConfig.cacheControl,
  BRANCH: sourceForBuild(build).branch || build.branch,
  CONFIG: siteConfig(build),
  REPOSITORY: build.Site.repository,
  OWNER: build.Site.owner,
  SITE_PREFIX: pathForBuild(build),
  GITHUB_TOKEN: build.User.githubAccessToken,
  GENERATOR: build.Site.engine,
  SOURCE_REPO: sourceForBuild(build).repository,
  SOURCE_OWNER: sourceForBuild(build).owner,
  SKIP_LOGGING: config.app.app_env === 'development',
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

const setupBucket = (build, buildCount) => {
  if (buildCount > 1) return Promise.resolve();

  return apiClient.fetchServiceInstanceCredentials(build.Site.s3ServiceName)
    .then((credentials) => {
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

      return s3Client.putBucketWebsite(build.Site.owner, build.Site.repository, 30);
    });
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
            logger.error('There was an error, adding the job to SQS: ', err);
            build.completeJob(err);
          }
        });
      });
  });

module.exports = SQS;
