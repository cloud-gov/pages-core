const { Op } = require('sequelize');
const { Site, Event } = require('../../models');
const SiteDestroyer = require('../../services/SiteDestroyer');
const { fetchModelById } = require('../../utils/queryDatabase');
const { pick, toInt, wrapHandlers } = require('../../utils');
const { serializeNew, serializeMany } = require('../../serializers/site');
const EventCreator = require('../../services/EventCreator');

const updateableAttrs = [
  'containerConfig',
];

module.exports = wrapHandlers({
  findAllSites: async (req, res) => {
    const { limit = 25, offset = 0, q } = req.query;

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
    let site;
    const { id } = req.params;

    try {
      site = await fetchModelById(id, Site);
      await SiteDestroyer.destroySite(site);
      return res.json(serializeNew(site, true));
    } catch (error) {
      const errorBody = {
        request: {
          params: req.params,
          path: req.patth,
        },
        error: error.stack,
        message: 'Error encountered while destroying site',
      };
      EventCreator.error(Event.labels.ADMIN, errorBody);
      return res.error(error);
    }
  },
});
