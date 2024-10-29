const BaseSerializer = require('./base');
const organizationSerializer = require('./organization');
const roleSerializer = require('./role');
const userSerializer = require('./user');

const attributes = {
  createdAt: 'date',
  Organization: (org, _, isSystemAdmin) =>
    organizationSerializer.serialize(org, isSystemAdmin),
  Role: (role, _, isSystemAdmin) => roleSerializer.serialize(role, isSystemAdmin),
  User: (user, _, isSystemAdmin) => userSerializer.serialize(user, isSystemAdmin),
  updatedAt: 'date',
};

module.exports = new BaseSerializer(attributes);
