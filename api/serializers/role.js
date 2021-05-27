const { pick } = require('../utils');

const allowedAttributes = [
  'id',
  'name',
  'createdAt',
  'updatedAt',
];

function serialize(model) {
  const object = model.get({ plain: true });
  const filtered = pick(allowedAttributes, object);
  filtered.createdAt = filtered.createdAt.toISOString();
  filtered.updatedAt = filtered.updatedAt.toISOString();
  return filtered;
}

function serializeMany(models) {
  return models.map(serialize);
}

module.exports = { serialize, serializeMany };
