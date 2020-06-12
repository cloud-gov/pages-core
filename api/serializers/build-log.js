const { pick } = require('../utils');

const whitelist = [
  'output',
  'source',
];

function serialize(buildLog) {
  const object = buildLog.get({
    plain: true,
  });
  const filtered = pick(whitelist, object);
  return filtered;
}

function serializeMany(buildLogs) {
  return buildLogs.map(serialize);
}

module.exports = { serialize, serializeMany };
