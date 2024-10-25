const { BuildTaskType } = require('../../../../api/models');

const _attributes = ({
  name, description, metadata, runner, startsWhen,
} = {}) => ({
  name: name || 'build task type name',
  description: description || 'build task type description',
  metadata: metadata || { appName: 'a11y' },
  runner: runner || 'cf_task',
  startsWhen: startsWhen || 'complete',
});

const buildTaskType = overrides => Promise.props(_attributes(overrides))
  .then((attributes) => {
    Object.keys(attributes).forEach((key) => {
      if (attributes[key].sequelize) {
        attributes[key] = attributes[key].id;
      }
    });
    return BuildTaskType.create(attributes);
  });

module.exports = buildTaskType;
