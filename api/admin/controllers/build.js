const buildSerializer = require('../../serializers/build');
const { Build } = require('../../models');
const { buildWhereQuery } = require('../../utils/queryDatabase');

module.exports = {
  findAllBuilds: async (req, res) => {
    const { limit = 50, offset = 0, ...options } = req.query;

    const query = {
      where: {},
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    };

    const queryFields = Object.keys(Build.rawAttributes);
    const where = buildWhereQuery(options, queryFields);
    query.where = where;

    try {
      const builds = await Build.findAll(query);

      const buildJSON = await buildSerializer.serialize(builds);
      return res.json(buildJSON);
    } catch (error) {
      return res.error(error);
    }
  },
};
