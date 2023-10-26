const { wrapHandlers } = require('../utils');
const { BuildTaskType } = require('../models');

module.exports = wrapHandlers({
  list: async (req, res) => {
    const taskTypes = await BuildTaskType.findAll({
      attributes: { exclude: ['metadata', 'createdAt', 'updatedAt', 'runner', 'url'] },
    });

    return res.json(taskTypes);
  },
});
