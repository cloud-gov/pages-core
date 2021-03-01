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
      limit, page, organization, q, site,
    } = req.query;

    const serialize = users => userSerializer.serializeMany(users, true);

    const scopes = [];

    let query = {};

    if (site) {
      scopes.push({ method: ['bySite', site ] });
      // query = {
      //   include: [{
      //     model: Site,
      //     where: {
      //       id: site,
      //     },
      //   }],
      // };
    }

    if (organization) {
      scopes.push({ method: ['byOrg',organization ] });
      // query = {
      //   include: [{
      //     model: Organization,
      //     where: {
      //       id: organization,
      //     },
      //   }],
      // };
    }

    const [pagination, orgs, sites] = await Promise.all([
      paginate(User.scope(scopes), serialize, { limit, page }, query),
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
