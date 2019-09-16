const yaml = require('js-yaml');
const { Site, User } = require('../models');
const userSerializer = require('../serializers/user');

const toJSON = (site) => {
  const object = Object.assign({}, site.get({
    plain: true,
  }));

  delete object.site_users__user_sites;

  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();

  object.viewLink = site.siteUrl();

  if (object.demoBranch) {
    object.demoViewLink = site.demoUrl();
  }

  if (object.defaultConfig) {
    object.defaultConfig = yaml.safeDump(site.defaultConfig);
  }

  if (object.demoConfig) {
    object.demoConfig = yaml.safeDump(site.demoConfig);
  }

  if (object.previewConfig) {
    object.previewConfig = yaml.safeDump(site.previewConfig);
  }

  object.previewLink = site.branchPreviewUrl();

  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key];
    }
  });

  return object;
};

const serializeObject = (site) => {
  const json = toJSON(site);

  if (json.Users) {
    json.users = site.Users.map(u => userSerializer.toJSON(u));
    delete json.Users;
  }

  return json;
};

const serialize = (serializable) => {
  const include = [User.scope('withGithub')];

  if (serializable.length !== undefined) {
    const siteIds = serializable.map(site => site.id);
    const query = Site.findAll({ where: { id: siteIds }, include });
    return query.then(sites => sites.map(site => serializeObject(site)));
  }

  const query = Site.findByPk(serializable.id, { include });
  return query.then(serializeObject);
};

module.exports = { serialize, toJSON };
