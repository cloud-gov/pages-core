const buildSerializer = require('../../serializers/build');
const { Build } = require('../../models');

module.exports = {
  findAllBuilds: async (req, res) => {
    const { limit = 50, offset = 0 } = req.query;

    try {
      const builds = await Build.findAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      const buildJSON = await buildSerializer.serialize(builds);
      return res.json(buildJSON);
    } catch (error) {
      return res.error(error);
    }
  },
};
