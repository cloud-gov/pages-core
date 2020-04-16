const { wrapHandlers } = require('../utils');
const { serialize, serializeMany } = require('../serializers/user-environment-variable');
const { ValidationError } = require('../utils/validators');
const { Site, UserEnvironmentVariable } = require('../models');

function encrypt(value) {
  return value;
}

function validate({ name, value }) {
  if (name && name.length && value && value.length) {
    return { name, value };
  }

  throw new ValidationError('name or value is not valid.');
}

module.exports = wrapHandlers({
  async find(req, res) {
    const { params, user } = req;
    const { site_id: siteId } = params;

    const userEnvVars = await UserEnvironmentVariable
      .forSiteUser(user)
      .findAll({ where: { siteId } });

    const json = serializeMany(userEnvVars);

    res.ok(json);
  },

  async create(req, res) {
    const { body, params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    const { name, value } = validate(body);

    const hint = value.slice(-4);
    const cipher = encrypt(value);

    const userEnvVar = await UserEnvironmentVariable
      .create({
        site, name, cipher, hint,
      });

    const json = serialize(userEnvVar);

    return res.ok(json);
  },

  async destroy(req, res) {
    const { params, user } = req;
    const { id, site_id: siteId } = params;

    const userEnvVar = await UserEnvironmentVariable
      .forSiteUser(user)
      .findOne({
        where: {
          id, siteId,
        },
      });

    if (!userEnvVar) {
      return res.notFound();
    }

    await userEnvVar.destroy();

    return res.ok();
  },
});
