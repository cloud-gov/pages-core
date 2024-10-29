const { pick } = require('../utils');

const allowedAttributes = ['id', 'branch', 'config', 'context', 's3Key'];

function serialize(sbc) {
  const object = sbc.get({
    plain: true,
  });
  return pick(allowedAttributes, object);
}

function serializeMany(sbc) {
  return sbc.map(serialize);
}

module.exports = {
  serialize,
  serializeMany,
};
