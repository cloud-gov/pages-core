const url = require('url');
const {
  Domain,
  Site,
  User,
  Build,
  UserEnvironmentVariable,
  SiteBranchConfig,
} = require('../models');
const config = require('../../config');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const { sitePrefix, buildUrl } = require('../utils/build');
const GithubBuildHelper = require('./GithubBuildHelper');
const S3Helper = require('./S3Helper');

const apiClient = new CloudFoundryAPIClient();

const siteConfig = (build, siteBranchConfigs = []) => {
  const configRecord =
    siteBranchConfigs.find((c) => c.branch === build.branch) ||
    siteBranchConfigs.find((c) => c.context === 'preview') ||
    null;

  return configRecord?.config || {};
};

const baseURLForBuild = (build) => {
  const link = buildUrl(build, build.Site);
  const urlObject = new URL(link);
  // eslint-disable-next-line sonarjs/slow-regex
  return urlObject.pathname.replace(/(\/)+$/, '');
};

const statusCallbackURL = (build) =>
  [url.resolve(config.app.hostname, '/v0/build'), build.id, 'status', build.token].join(
    '/',
  );

const buildUEVs = (uevs) =>
  uevs
    ? uevs.map((uev) => ({
        name: uev.name,
        ciphertext: uev.ciphertext,
      }))
    : [];

const generateDefaultCredentials = async (build) => {
  const { engine, owner, repository, UserEnvironmentVariables, SiteBranchConfigs } =
    build.Site;

  const baseUrl = baseURLForBuild(build);

  return {
    STATUS_CALLBACK: statusCallbackURL(build),
    BASEURL: baseUrl,
    BRANCH: build.branch,
    CONFIG: JSON.stringify(siteConfig(build, SiteBranchConfigs)),
    REPOSITORY: repository,
    OWNER: owner,
    SITE_PREFIX: sitePrefix(build, build.Site),
    GITHUB_TOKEN: (build.User || {}).githubAccessToken, // temp hot-fix
    GENERATOR: engine,
    BUILD_ID: build.id,
    USER_ENVIRONMENT_VARIABLES: JSON.stringify(buildUEVs(UserEnvironmentVariables)),
  };
};

const buildContainerEnvironment = async (build) => {
  const defaultCredentials = await generateDefaultCredentials(build);

  if (!defaultCredentials.GITHUB_TOKEN) {
    defaultCredentials.GITHUB_TOKEN =
      await GithubBuildHelper.loadBuildUserAccessToken(build);
  }

  return apiClient
    .fetchServiceInstanceCredentials(build.Site.s3ServiceName)
    .then((credentials) => ({
      ...defaultCredentials,
      AWS_DEFAULT_REGION: credentials.region,
      AWS_ACCESS_KEY_ID: credentials.access_key_id,
      AWS_SECRET_ACCESS_KEY: credentials.secret_access_key,
      BUCKET: credentials.bucket,
    }));
};

const SiteBuildQueue = {};

// eslint-disable-next-line sonarjs/no-invariant-returns
SiteBuildQueue.setupBucket = async (build, buildCount) => {
  if (buildCount > 1) return true;

  const credentials = await apiClient.fetchServiceInstanceCredentials(
    build.Site.s3ServiceName,
  );
  const { access_key_id, bucket, region, secret_access_key } = credentials;

  const s3Client = new S3Helper.S3Client({
    accessKeyId: access_key_id,
    secretAccessKey: secret_access_key,
    bucket,
    region,
  });

  // Wait until AWS credentials are usable in case we had to
  // provision new ones. This may take up to 10 seconds.
  await s3Client.waitForBucket();

  return true;
};

SiteBuildQueue.messageBodyForBuild = (build) =>
  buildContainerEnvironment(build).then((environment) => ({
    environment: Object.keys(environment).map((key) => ({
      name: key,
      value: environment[key],
    })),
    containerName: build.Site.containerConfig.name,
    containerSize: build.Site.containerConfig.size,
  }));

SiteBuildQueue.setupTaskEnv = async (buildId) => {
  const build = await Build.findOne({
    where: {
      id: buildId,
    },
    include: [
      User,
      {
        model: Site,
        required: true,
        include: [UserEnvironmentVariable, SiteBranchConfig, Domain],
      },
    ],
  });

  const count = await Build.count({
    where: {
      site: build.site,
    },
  });

  await SiteBuildQueue.setupBucket(build, count);

  const message = await SiteBuildQueue.messageBodyForBuild(build);

  return {
    build,
    message,
  };
};

module.exports = SiteBuildQueue;
