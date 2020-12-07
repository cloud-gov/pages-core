const protectedAttributes = [
  'githubAccessToken',
  'githubUserId',
  'signedInAt',
  'SiteUser',
  'pushedAt',
  'isActive',
  'adminEmail',
];

const toJSON = (user) => {
  const record = user.get({
    plain: true,
  });

  return {
    ...Object.keys(record).reduce((out, attr) => {
      if (protectedAttributes.indexOf(attr) === -1) {
        out[attr] = record[attr]; // eslint-disable-line no-param-reassign
      }

      if (attr === 'SiteUser' && record[attr] && record[attr].buildNotificationSetting) {
      // eslint-disable-next-line no-param-reassign
        out.buildNotificationSetting = record[attr].buildNotificationSetting;
      }
      return out;
    }, {}),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
};

module.exports = { toJSON };
