const { Build, User, Site } = require('../models');
const { buildViewLink } = require('../utils/build');
const siteSerializer = require('./site');
const userSerializer = require('./user');

const toJSON = (build) => {
  const object = build.get({ plain: true });

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
  delete object.url;
  // only return first 80 chars in case it's long
  if (object.error) {
    object.error = object.error.slice(0, 80);
  }
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
