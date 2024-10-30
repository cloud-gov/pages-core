const crypto = require('crypto');
const URLSafeBase64 = require('urlsafe-base64');
const { Build } = require('../../../../api/models');

const buildAttributes = (overrides = {}) =>
  Object.assign(
    {
      site: 1,
      user: 1,
      token: URLSafeBase64.encode(crypto.randomBytes(32)),
      state: 'success',
      branch: 'test-branch-1',
    },
    overrides,
  );

const bulkBuild = (overrides, count) => {
  const batch = Array(count)
    .fill(0)
    .map(() => buildAttributes(overrides));

  return Build.bulkCreate(batch);
};

module.exports = bulkBuild;
