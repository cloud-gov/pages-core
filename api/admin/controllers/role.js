const { serializeMany } = require('../../serializers/role');
const { paginate, wrapHandlers } = require('../../utils');
const { Role } = require('../../models');

module.exports = wrapHandlers({
  async list(_req, res) {
    const pagination = await paginate(Role, serializeMany, {});

    const json = {
      meta: {},
      ...pagination,
    };

    return res.json(json);
  },
});
