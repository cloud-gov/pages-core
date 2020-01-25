const { Build, User, Site } = require('../models');
const siteSerializer = require('../serializers/site');
const userSerializer = require('../serializers/user');
const { buildViewLink } = require('../utils/build');

const toJSON = (build) => {
  const object = Object.assign({}, build.get({
    plain: true,
  }));

  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();
  if (object.completedAt) {
    object.completedAt = object.completedAt.toISOString();
  }
  if (object.startedAt) {
    object.startedAt = object.startedAt.toISOString();
  }

  if (build.Site) {
    object.viewLink = buildViewLink(build, build.Site);
  }

  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key];
    }
  });
  delete object.token;
  return object;
};

function serializeObject(build) {
  const json = toJSON(build);
  json.user = userSerializer.toJSON(build.User);
  json.site = siteSerializer.toJSON(build.Site);
  delete json.User;
  delete json.Site;
  return json;
}

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const buildIds = serializable.map(build => build.id);
    const query = Build.findAll({
      attributes: { exclude: ['error'] },
      where: { id: buildIds },
      order: [['createdAt', 'DESC']],
      include: [User, Site],
    });

    return query.then(builds => builds.map(serializeObject));
  }
  const query = Build.findByPk(serializable.id, { include: [User, Site] });

  return query.then(serializeObject);
};

module.exports = { serialize, toJSON };
