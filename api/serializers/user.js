const { User } = require('../models');

const protectedAttributes = [
  'githubAccessToken',
  'githubUserId',
  'signedInAt',
  'SiteUser',
];

const toJSON = (user) => {
  const record = user.get({
    plain: true,
  });

  return Object.assign({}, Object.keys(record).reduce((out, attr) => {
    if (protectedAttributes.indexOf(attr) === -1) {
      out[attr] = record[attr]; // eslint-disable-line no-param-reassign
    }

    if (attr === 'SiteUser' && record[attr] && record[attr].buildNotificationSetting) {
      // eslint-disable-next-line no-param-reassign
      out.buildNotificationSetting = record[attr].buildNotificationSetting;
    }
    return out;
  }, {}), {
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
};

const serializeObject = user => toJSON(user);

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const userIds = serializable.map(user => user.id);
    const query = User.findAll({ where: { id: userIds } });

    return query.then(users => users.map(serializeObject));
  }

  const query = User.findByPk(serializable.id);

  return query.then(serializeObject);
};


module.exports = { serialize, toJSON };
