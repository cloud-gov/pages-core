const { pick } = require('../utils');

const allowedAttributes = [
  'id',
  'email',
  'username',
  'SiteUser',
];

const adminAllowedAttributes = [
  'createdAt',
  'updatedAt',
  'signedInAt',
  'pushedAt',
  'isActive',
  'adminEmail',
  'deletedAt',
];

const uaaAdminAllowedAttributes = [
  'uaaId',
  'userId',
  'username',
  'email',
  'origin',
];

const dateFields = [
  'createdAt',
  'updatedAt',
  'signedInAt',
  'pushedAt',
  'deletedAt',
];

const toJSON = (user, isSystemAdmin = false) => {
  const object = user.get({ plain: true });

  const attributes = allowedAttributes;
  if (isSystemAdmin) {
    attributes.push(...adminAllowedAttributes);
  }

  const filtered = pick(attributes, object);

  dateFields
    .filter(dateField => filtered[dateField])
    .forEach((dateField) => {
      filtered[dateField] = filtered[dateField].toISOString();
    });

  if (filtered.SiteUser && filtered.SiteUser.buildNotificationSetting) {
    filtered.buildNotificationSetting = filtered.SiteUser.buildNotificationSetting;
  }

  if (isSystemAdmin && object.UAAIdentity) {
    filtered.uaa = pick(uaaAdminAllowedAttributes, object.UAAIdentity);
  }

  return filtered;
};

function serializeMany(users, isSystemAdmin) {
  return users.map(user => toJSON(user, isSystemAdmin));
}

module.exports = { serializeMany, toJSON };
