const { wrapHandlers, DEFAULT_SCAN_RULES } = require('../utils');
const { BuildTaskType } = require('../models');
const buildTaskTypeSerializer = require('../serializers/build-task-type');

function configToRuleArray(config) {
  // in our internal config, the rules are stored as arrays on an object with their TaskType
  return Object.keys(config).map(type => config[type].map(rule => ({ ...rule, type }))).flat();
}

module.exports = wrapHandlers({
  list: async (req, res) => {
    const taskTypes = await BuildTaskType.findAll();
    const taskTypesJSON = buildTaskTypeSerializer.serializeMany(taskTypes);

    return res.json(taskTypesJSON);
  },

  getDefaultRules: async (req, res) => res.json(configToRuleArray(DEFAULT_SCAN_RULES)),
});
