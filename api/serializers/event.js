const { pick } = require('../utils');

const allowedAttributes = [
  'type',
  'label',
  'modelId',
  'model',
  'body',
  'createdAt',
];

function serialize(model) {
  const object = model.get({ plain: true });
  const filtered = pick(allowedAttributes, object);
  return filtered;
}

function serializeMany(models) {
  return models.map(serialize);
}

module.exports = { serialize, serializeMany };
