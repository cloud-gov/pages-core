const { SiteBranchConfig } = require('../../../../api/models');
const siteFactory = require('./site');

const build = ({
  branch = 'factory',
  config = {
    type: 'factory',
  },
  context = 'site',
  s3Key = 'path/to/site',
  ...params
} = {}) =>
  SiteBranchConfig.build({
    branch,
    config,
    s3Key,
    context,
    ...params,
  });

const buildMany = (num) =>
  Array(num)
    .fill(0)
    .map(() => build());

const create = async ({ site = null, ...params } = {}) => {
  const siteObj = site || (await siteFactory());
  return build({
    ...params,
    siteId: siteObj.id,
  }).save();
};

const createMany = (num) =>
  Promise.all(
    Array(num)
      .fill(0)
      .map(() => create()),
  );

module.exports = {
  build,
  buildMany,
  create,
  createMany,
};
