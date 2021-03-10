const { Organization, Site, User } = require('../../models');
const { paginate, wrapHandlers } = require('../../utils');
const { fetchModelById } = require('../../utils/queryDatabase');
const userSerializer = require('../../serializers/user');

module.exports = wrapHandlers({
  async me(req, res) {
    res.json(userSerializer.toJSON(req.user));
  },

  async list(req, res) {
    const {
      limit, page, organization, search, site,
    } = req.query;

    const serialize = users => userSerializer.serializeMany(users, true);

    const scopes = [];

    if (search) {
      scopes.push(User.searchScope(search));
    }

    if (site) {
      scopes.push(User.siteScope(site));
    }

    if (organization) {
      scopes.push(User.orgScope(organization));
    }

    const [pagination, orgs, sites] = await Promise.all([
      paginate(User.scope(scopes), serialize, { limit, page }),
      Organization.findAll({ attributes: ['id', 'name'], raw: true }),
      Site.findAll({ attributes: ['id', 'owner', 'repository'], raw: true }),
    ]);

    const json = {
      meta: { orgs, sites },
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
