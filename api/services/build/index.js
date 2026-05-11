const { BuildLog, Build } = require('../../models');
const SourceCodePlatformHelper = require('../SourceCodePlatformHelper');
const { logger } = require('../../../winston');

const BuildService = {

  async enqueueOrLogBuild(build) {
    if (build.state !== 'invalid') {
      build.enqueue();
    } else {
      await BuildLog.create({
        output: build.error,
        source: 'ALL',
        build: build.id
      });
    }

    return build;
  },

  async createBuild(buildValues, flow) {
    const build = await Build.create(buildValues);

    await SourceCodePlatformHelper.ensureBuildUserWithFreshGitLabToken(build, flow);

    // eslint-disable-next-line max-len
    logger.info(`Created build with id=${build.id} for user ${build.User?.id}-${build.User?.username} and gitlabToken expiration at ${build.User?.gitlabExpiresAt} at ${new Date()} in flow ${flow.description}`);

    return build;
  }
};

module.exports = {
  BuildService
};
