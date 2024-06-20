const { BuildTaskType } = require('../../../../api/models');

// eslint-disable-next-line no-underscore-dangle
const _attributes = ({
  name, description, metadata, runner, startsWhen,
} = {}) => ({
  name: name || 'build task type name',
  description: description || 'build task type description',
  metadata: metadata || { appName: 'a11y' }, // we need a default appName for matching scan rules
  runner: runner || 'cf_task',
  startsWhen: startsWhen || 'complete',
});

const buildTaskType = overrides => Promise.props(_attributes(overrides))
  .then((attributes) => {
    Object.keys(attributes).forEach((key) => {
      if (attributes[key].sequelize) {
        // eslint-disable-next-line no-param-reassign
        attributes[key] = attributes[key].id;
      }
    });
    return BuildTaskType.create(attributes);
  });

module.exports = buildTaskType;
