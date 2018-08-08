const { Build, User, Site } = require('../models');

function serializeObject(build) {
  const json = build.toJSON();
  json.user = build.User.toJSON();
  json.site = build.Site.toJSON();
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
  const query = Build.findById(serializable.id, { include: [User, Site] });

  return query.then(serializeObject);
};

module.exports = { serialize };
