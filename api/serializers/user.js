const BaseSerializer = require('./base');
const organizationSerializer = require('./organization');
const roleSerializer = require('./role');
const uaaIdentitySerializer = require('./uaa-identity');

const attributes = {
  id: '',
  email: '',
  username: '',
  buildNotificationSettings: '',
  hasGithubAuth: (_, user) => !!user.githubAccessToken,
  UAAIdentity: (uaaIdentity, _, isSystemAdmin) => uaaIdentitySerializer
    .serialize(uaaIdentity, isSystemAdmin),
  OrganizationRoles: (orgRoles, _, isSystemAdmin) => orgRoles?.map(orgRole => ({
    Organization: organizationSerializer.serialize(orgRole.Organization, isSystemAdmin),
    Role: roleSerializer.serialize(orgRole.Role, isSystemAdmin),
  })),
};

const adminAttributes = {
  createdAt: 'date',
  updatedAt: 'date',
  signedInAt: 'date',
  pushedAt: 'date',
  adminEmail: '',
  deletedAt: 'date',
};

const { serialize, serializeMany } = new BaseSerializer(attributes, adminAttributes);

module.exports = { toJSON: serialize, serialize, serializeMany };
