const { userEnvVar } = require('../../config');
const { wrapHandlers } = require('../utils');
const { serialize, serializeMany } = require('../serializers/user-environment-variable');
const { encrypt } = require('../services/Encryptor');
const { ValidationError } = require('../utils/validators');
const { Site, UserEnvironmentVariable } = require('../models');

function validate({ name, value }) {
  if (name && name.length && value && (value.length >= 4)) {
    return { name, value };
  }

  throw new ValidationError('name or value is not valid.');
}

module.exports = wrapHandlers({
  async find(req, res) {
    const { params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    const uevs = await UserEnvironmentVariable
      .forSiteUser(user)
      .findAll({ where: { siteId } });

    const json = serializeMany(uevs);

    return res.ok(json);
  },

  async create(req, res) {
    const { body, params, user } = req;
    const { site_id: siteId } = params;

    const site = await Site.forUser(user).findByPk(siteId);

    if (!site) {
      return res.notFound();
    }

    const { name, value } = validate(body);
    const { ciphertext, hint } = encrypt(value, userEnvVar.key);

    try {
      const uev = await UserEnvironmentVariable
        .create({
          siteId: site.id, name, ciphertext, hint,
        });

      const json = serialize(uev);

      return res.ok(json);
    } catch (error) {
      if (error.name !== 'SequelizeUniqueConstraintError') {
        throw error;
      }
      return res.badRequest({
        message: `A user environment variable with name: "${name}" already exists for this site.`,
      });
    }
  },

  async destroy(req, res) {
    const { params, user } = req;
    const { id, site_id: siteId } = params;

    const uev = await UserEnvironmentVariable
      .forSiteUser(user)
      .findOne({
        where: {
          id, siteId,
        },
      });

    if (!uev) {
      return res.notFound();
    }

    await uev.destroy();

    return res.ok({});
  },
});
