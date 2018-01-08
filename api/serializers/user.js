const { Build, User, Site } = require('../models');

const serializeObject = (user) => {
  const json = user.toJSON();
  json.sites = user.Sites.map(site => site.toJSON());
  json.builds = user.Builds.map(build => build.toJSON());
  delete json.Sites;
  delete json.Builds;
  return json;
};

const serialize = (serializable) => {
  if (serializable.length !== undefined) {
    const userIds = serializable.map(user => user.id);
    const query = User.findAll({ where: { id: userIds }, include: [Site, Build] });

    return query.then(users => users.map(serializeObject));
  }
  const user = serializable;
  const query = User.findById(user.id, { include: [Site, Build] });

  return query.then(serializeObject);
};


module.exports = { serialize };
