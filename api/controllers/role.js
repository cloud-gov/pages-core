const roleSerializer = require('../serializers/role');
const { Role } = require('../models');
const { wrapHandlers } = require('../utils');

module.exports = wrapHandlers({
  async findAll(_req, res) {
    const roles = await Role.findAll();

    const json = roleSerializer.serializeMany(roles);
    return res.json(json);
  },
});
