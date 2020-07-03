const yaml = require('js-yaml');
const { Site, User } = require('../models');
const userSerializer = require('../serializers/user');
const { siteViewLink } = require('../utils/site');

const toJSON = (site) => {
  const object = Object.assign({}, site.get({
    plain: true,
  }));

  delete object.site_users__user_sites;
  delete object.config; // may contain sensitive info

  object.demoViewLink = siteViewLink(object, 'demo');
  object.previewLink = siteViewLink(object, 'preview');
  object.viewLink = siteViewLink(object, 'site');
  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();

  if (object.defaultConfig) {
    object.defaultConfig = yaml.safeDump(site.defaultConfig);
  }

  if (object.demoConfig) {
    object.demoConfig = yaml.safeDump(site.demoConfig);
  }

  if (object.previewConfig) {
    object.previewConfig = yaml.safeDump(site.previewConfig);
  }

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
