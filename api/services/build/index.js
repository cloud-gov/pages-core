const { BuildLog } = require('../../models');

const BuildService = {

  async enqueueOrLogBuild(build) {
    if (build.state !== 'invalid') {
      build.enqueue();
    } else {
      await BuildLog.create({
        output: build.error,
        source: 'ALL',
        build: build.id,
      });
    }

    return build;
  }
};

module.exports = {
  BuildService,
};
