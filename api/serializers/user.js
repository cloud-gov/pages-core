const base = require('./base');
const uaaIdentitySerializer = require('./uaa-identity');

const attributes = {
  id: '',
  email: '',
  username: '',
  buildNotificationSetting: (_, user) => user.SiteUser?.buildNotificationSetting,
  hasGithubAuth: (_, user) => !!user.githubAccessToken,
  UAAIdentity: (uaaIdentity, _, isSystemAdmin) => uaaIdentitySerializer.serialize(uaaIdentity, isSystemAdmin),
};

const adminAttributes = {
  createdAt: 'date',
  updatedAt: 'date',
  signedInAt: 'date',
  pushedAt: 'date',
  isActive: '',
  adminEmail: '',
  deletedAt: 'date',
};

const { serialize, serializeMany } = base(attributes, adminAttributes);

module.exports = { toJSON: serialize, serialize, serializeMany };
