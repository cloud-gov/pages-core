const { UserEnvironmentVariable } = require('../../models');
const { wrapHandlers } = require('../../utils');
const { serializeMany } = require('../../serializers/user-environment-variable');

module.exports = wrapHandlers({
  async list(req, res) {
    const {
      site: siteId,
    } = req.query;

    const uevs = await UserEnvironmentVariable
      .findAll({ where: { siteId } });

    const json = serializeMany(uevs);

    return res.ok(json);
  },
});
