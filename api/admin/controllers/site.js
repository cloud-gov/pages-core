const { Organization, Site } = require('../../models');
const SiteDestroyer = require('../../services/SiteDestroyer');
const { fetchModelById } = require('../../utils/queryDatabase');
const { paginate, pick, wrapHandlers } = require('../../utils');
const { serializeNew, serializeMany } = require('../../serializers/site');

const updateableAttrs = [
  'containerConfig',
  'isActive',
];

module.exports = wrapHandlers({
  listRaw: async (req, res) => {
    const sites = await Site.findAll({ attributes: ['id', 'owner', 'repository'], raw: true });
    return res.json(sites);
  },

  list: async (req, res) => {
    const {
      limit, page, organization, search,
    } = req.query;

    const query = { order: ['owner', 'repository'] };

    const serialize = sites => serializeMany(sites, true);

    const scopes = [];

    if (search) {
      scopes.push(Site.searchScope(search));
    }

    if (organization) {
      scopes.push(Site.orgScope(organization));
    }

    const [pagination, orgs] = await Promise.all([
      paginate(Site.scope(scopes), serialize, { limit, page }, query),
      Organization.findAll({ attributes: ['id', 'name'], raw: true }),
    ]);

    const json = {
      meta: { orgs },
      ...pagination,
    };

    return res.json(json);
  },

  findById: async (req, res) => {
    const {
      params: { id },
    } = req;

    const site = await fetchModelById(id, Site);
    if (!site) return res.notFound();

    return res.json(serializeNew(site, true));
  },

  update: async (req, res) => {
    const {
      params: { id },
      body,
    } = req;

    const site = await fetchModelById(id, Site);
    if (!site) return res.notFound();

    await site.update(pick(updateableAttrs, body));

    return res.json(serializeNew(site, true));
  },

  destroy: async (req, res) => {
    const { id } = req.params;

    const site = await fetchModelById(id, Site);

    // This will not remove the webhook since we don't have permissions
    await SiteDestroyer.destroySite(site);
    return res.json({});
  },
});
