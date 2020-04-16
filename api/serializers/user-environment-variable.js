const { pick } = require('../utils');

const whitelist = [
  'id',
  'name',
  'hint',
];

function serialize(userEnvVar) {
  const object = userEnvVar.get({
    plain: true,
  });
  return pick(whitelist, object);
}

function serializeMany(userEnvVars) {
  return userEnvVars.map(serialize);
}

module.exports = { serialize, serializeMany };
