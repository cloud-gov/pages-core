const { pick } = require('../utils');

const allowedAttributes = [
  'output',
  'source',
];

function serialize(buildLog) {
  const object = buildLog.get({
    plain: true,
  });
  return pick(allowedAttributes, object);
}

function serializeMany(buildLogs) {
  return buildLogs.map(serialize);
}

module.exports = { serialize, serializeMany };
