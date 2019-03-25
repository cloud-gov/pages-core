const AWS = require('aws-sdk');
const url = require('url');
const config = require('../../config');
const { logger } = require('../../winston');

const buildConfig = config.build;
const s3Config = config.s3;

const defaultBranch = build => build.branch === build.Site.defaultBranch;
const demoBranch = build => build.branch === build.Site.demoBranch;

const siteConfig = (build) => {
  if (defaultBranch(build)) {
    return build.Site.config;
  } else if (demoBranch(build)) {
    return build.Site.demoConfig;
  }
  return build.Site.previewConfig;
};

const pathForBuild = (build) => {
  if (defaultBranch(build)) {
    return `site/${build.Site.owner}/${build.Site.repository}`;
  } else if (demoBranch(build)) {
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
  } else if (demoBranch(build) && build.Site.demoDomain) {
    return baseURLForCustomDomain(build.Site.demoDomain);
  }
  return `/${pathForBuild(build)}`;
};

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

const sourceForBuild = build => build.source || {};

const buildContainerEnvironment = build => ({
  AWS_DEFAULT_REGION: s3Config.region,
  AWS_ACCESS_KEY_ID: s3Config.accessKeyId,
  AWS_SECRET_ACCESS_KEY: s3Config.secretAccessKey,
  STATUS_CALLBACK: statusCallbackURL(build),
  LOG_CALLBACK: buildLogCallbackURL(build),
  BUCKET: s3Config.bucket,
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

const sqsConfig = config.sqs;
const SQS = {
  sqsClient: new AWS.SQS({
    accessKeyId: sqsConfig.accessKeyId,
    secretAccessKey: sqsConfig.secretAccessKey,
    region: sqsConfig.region,
  }),
};

SQS.messageBodyForBuild = (build) => {
  const environment = buildContainerEnvironment(build);
  return {
    environment: Object.keys(environment).map(key => ({
      name: key,
      value: environment[key],
    })),
    name: buildConfig.containerName,
  };
};

SQS.sendBuildMessage = (build) => {
  const params = {
    QueueUrl: sqsConfig.queue,
    MessageBody: JSON.stringify(SQS.messageBodyForBuild(build)),
  };
  SQS.sqsClient.sendMessage(params, (err) => {
    if (err) {
      logger.error('There was an error, adding the job to SQS: ', err);
      build.completeJob(err);
    }
  });
};

module.exports = SQS;
