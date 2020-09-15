const { Op } = require('sequelize');
const { Site } = require('../../models');
const Features = require('../../features');
const ProxyDataSync = require('../../services/ProxyDataSync');
const S3SiteRemover = require('../../services/S3SiteRemover');
const { pick, wrapHandlers } = require('../../utils');
const { serializeNew, serializeMany } = require('../../serializers/site');
const { logger } = require('../../../winston');

function toInt(val) {
  const result = /^\d+$/.exec(val);
  return result ? parseInt(result[0], 10) : null;
}

async function fetchSiteById(id) {
  const numId = toInt(id);
  return numId ? Site.findByPk(numId) : null;
}

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

    const site = await fetchSiteById(id);
    if (!site) return res.notFound();

    return res.json(serializeNew(site, true));
  },

  update: async (req, res) => {
    const {
      params: { id },
      body,
    } = req;

    const site = await fetchSiteById(id);
    if (!site) return res.notFound();

    await site.update(pick(updateableAttrs, body));

    return res.json(serializeNew(site, true));
  },

  destroy: async (req, res) => {
    let site;
    const { id } = req.params;

    try {
      site = await fetchSiteById(id);
      await S3SiteRemover.removeSite(site);
      await S3SiteRemover.removeInfrastructure(site);

      if (Features.enabled(Features.Flags.FEATURE_PROXY_EDGE_DYNAMO)) {
        await ProxyDataSync.removeSite(site);
      }

      await site.destroy();
      return res.json(serializeNew(site, true));
    } catch (error) {
      logger.error([`site@id=${site.id}`, error.message, error.stack].join('\n\n'));
      return res.error(error);
    }
  },
});
