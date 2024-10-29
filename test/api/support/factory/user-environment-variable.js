const { UserEnvironmentVariable } = require('../../../../api/models');
const siteFactory = require('./site');

const build = ({
  name = 'SECRET_VALUE',
  ciphertext = 'fkashdfkahskfhsafkhsf',
  hint = 'hsui',
  ...params
} = {}) =>
  UserEnvironmentVariable.build({
    name,
    ciphertext,
    hint,
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
