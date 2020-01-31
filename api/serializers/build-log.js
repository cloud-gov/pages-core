const { pick } = require('../utils');

const whitelist = [
  'createdAt',
  'output',
  'source',
]

function serialize(buildLog) {
  const object = buildLog.get({
    plain: true,
  });
  const filtered = pick(whitelist, object);
  filtered.createdAt = filtered.createdAt.toISOString();
  return filtered;
}

function serializeMany(buildLogs) {
  return buildLogs.map(serialize);
}

module.exports = { serialize, serializeMany };
