const { User } = require('../../models');
const { paginate, wrapHandlers } = require('../../utils');
const { fetchModelById } = require('../../utils/queryDatabase');
const userSerializer = require('../../serializers/user');

module.exports = wrapHandlers({
  async me(req, res) {
    res.json(userSerializer.toJSON(req.user));
  },

  async list(req, res) {
    const {
      limit, page,
    } = req.query;

    const serialize = users => userSerializer.serializeMany(users, true);

    const pagination = await paginate(User, serialize, { limit, page });

    const json = {
      meta: {},
      ...pagination,
    };

    return res.json(json);
  },

  async findById(req, res) {
    const {
      params: { id },
    } = req;

    const user = await fetchModelById(id, User);
    if (!user) {
      return res.notFound();
    }

    const userJSON = userSerializer.toJSON(user, true);

    return res.json(userJSON);
  },
});
