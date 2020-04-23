const siteSerializer = require('../../serializers/site');
const { Site } = require('../../models');

const sendJSON = (site, res) => siteSerializer
  .serialize(site)
  .then(siteJSON => res.json(siteJSON));

module.exports = {
  findAllSites: async (req, res) => {
    const { limit = 25, offset = 0 } = req.query;

    try {
      const sites = await Site.findAll({
        order: ['repository'],
        limit,
        offset,
      });

      return sendJSON(sites, res);
    } catch (error) {
      return res.error(error);
    }
  },
};
