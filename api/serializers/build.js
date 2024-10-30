const {
  Build,
  Domain,
  Site,
  SiteBranchConfig,
  User,
  BuildTask,
  BuildTaskType,
} = require('../models');
const siteSerializer = require('./site');
const userSerializer = require('./user');

const toJSON = (build) => {
  const object = build.get({
    plain: true,
  });

  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();
  if (object.completedAt) {
    object.completedAt = object.completedAt.toISOString();
  }
  if (object.startedAt) {
    object.startedAt = object.startedAt.toISOString();
  }

  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key];
    }
  });
  delete object.token;
  delete object.logsS3Key;
  // only return first 80 chars in case it's long
  if (object.error) {
    object.error = object.error.slice(0, 80);
  }
  return object;
};

function serializeObject(build) {
  const json = toJSON(build);
  if (build.User) {
    json.user = userSerializer.toJSON(build.User);
    delete json.User;
  }
  if (build.Site) {
    json.site = siteSerializer.toJSON(build.Site);
    delete json.Site;
  }
  return json;
}

const serialize = async (serializable) => {
  if (serializable.length !== undefined) {
    const buildIds = serializable.map((build) => build.id);
    const query = Build.findAll({
      where: {
        id: buildIds,
      },
      order: [['createdAt', 'DESC']],
      include: [
        User,
        {
          model: Site,
          required: true,
          include: [SiteBranchConfig, Domain],
        },
        {
          model: BuildTask,
          required: false,
          include: [BuildTaskType],
        },
      ],
    });

    return query.then((builds) => builds.map(serializeObject));
  }

  return Build.findByPk(serializable.id, {
    include: [
      User,
      {
        model: Site,
        required: true,
        include: [SiteBranchConfig, Domain],
      },
    ],
  }).then(serializeObject);
};

module.exports = {
  serialize,
  serializeObject,
  toJSON,
};
