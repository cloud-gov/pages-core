const base = require('./base');
const organizationSerializer = require('./organization');
const roleSerializer = require('./role');

const allowedAttributes = {
  createdAt: 'date',
  Organization: organizationSerializer.serialize,
  Role: roleSerializer.serialize,
  updatedAt: 'date',
};

module.exports = base(allowedAttributes);
