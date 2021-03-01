const { Op } = require('sequelize');
const { Organization, Site } = require('../../models');
const SiteDestroyer = require('../../services/SiteDestroyer');
const { fetchModelById } = require('../../utils/queryDatabase');
const { pick, toInt, wrapHandlers } = require('../../utils');
const { serializeNew, serializeMany } = require('../../serializers/site');

const updateableAttrs = [
  'containerConfig',
];

module.exports = wrapHandlers({
  findAllSites: async (req, res) => {
    const {
      limit = 25, offset = 0, q, organization,
    } = req.query;

    const query = {
      order: ['repository'],
      limit,
      offset,
    };

    if (q) {
      const num = toInt(q);
      if (num) {
        query.where = { id: num };
      } else {
        query.where = {
          [Op.or]: [
            { owner: { [Op.substring]: q } },
            { repository: { [Op.substring]: q } },
          ],
        };
      }
    }

    if (organization) {
      query.include = [{
        model: Organization,
        where: {
          id: organization,
        },
      }];
    }

    const sites = await Site.findAll(query);
    res.json(serializeMany(sites, true));
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
    await SiteDestroyer.destroySite(site);
    return res.json(serializeNew(site, true));
  },
});
