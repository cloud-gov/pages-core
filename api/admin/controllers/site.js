const { Op } = require('sequelize');
const siteSerializer = require('../../serializers/site');
const { Site } = require('../../models');

const sendJSON = (site, res) => siteSerializer
  .serialize(site)
  .then(siteJSON => res.json(siteJSON));

module.exports = {
  findAllSites: async (req, res) => {
    const { limit = 25, offset = 0, q } = req.query;

    const query = {
      order: ['repository'],
      limit,
      offset,
    };

    if (q) {
      const num = parseInt(q, 10);
      if (Number.isNaN(num)) {
        query.where = {
          [Op.or]: [
            { owner: { [Op.substring]: q } },
            { repository: { [Op.substring]: q } },
          ],
        };
      } else {
        query.where = { id: num };
      }
    }

    try {
      const sites = await Site.findAll(query);

      return sendJSON(sites, res);
    } catch (error) {
      return res.error(error);
    }
  },
};
