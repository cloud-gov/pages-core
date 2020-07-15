const { pick } = require('../utils');

const allowedAttributes = [
  'id',
  'name',
  'hint',
];

function serialize(userEnvVar) {
  const object = userEnvVar.get({
    plain: true,
  });
  return pick(allowedAttributes, object);
}

function serializeMany(userEnvVars) {
  return userEnvVars.map(serialize);
}

module.exports = { serialize, serializeMany };
