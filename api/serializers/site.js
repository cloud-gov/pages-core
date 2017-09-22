const { Site, User } = require('../models');

const serializeObject = (site) => {
  const json = site.toJSON();

  if (json.Users) {
    json.users = site.Users.map(u => u.toJSON());
    delete json.Users;
  }

  return json;
};

const serialize = (serializable) => {
  const include = [User];

  if (serializable.length !== undefined) {
    const siteIds = serializable.map(site => site.id);
    const query = Site.findAll({ where: { id: siteIds }, include });
    return query.then(sites => sites.map(site => serializeObject(site)));
  }

  const query = Site.findById(serializable.id, { include });
  return query.then(serializeObject);
};

module.exports = { serialize };
