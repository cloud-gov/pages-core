const { pick } = require('../utils');

const allowedAttributes = [
  'output',
  'source',
];

function serialize(buildLog) {
  const object = buildLog.get({
    plain: true,
  });
  const filtered = pick(allowedAttributes, object);
  return filtered;
}

function serializeMany(buildLogs) {
  return buildLogs.map(serialize);
}

module.exports = { serialize, serializeMany };
