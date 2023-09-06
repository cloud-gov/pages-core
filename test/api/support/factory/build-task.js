const buildFactory = require('./build');
const buildTaskTypeFactory = require('./build-task-type');
const { BuildTask } = require('../../../../api/models');

// eslint-disable-next-line no-underscore-dangle
const _attributes = ({
  build,
  buildTaskType,
  name,
  artifact,
} = {}) => ({
  buildId: build || buildFactory(),
  buildTaskTypeId: buildTaskType || buildTaskTypeFactory(),
  name: name || 'build task name',
  artifact: artifact || 'build task artifact',
});

const buildTask = overrides => Promise.props(_attributes(overrides))
  .then((attributes) => {
    Object.keys(attributes).forEach((key) => {
      if (attributes[key].sequelize) {
        // eslint-disable-next-line no-param-reassign
        attributes[key] = attributes[key].id;
      }
    });
    return BuildTask.create(attributes);
  });

module.exports = buildTask;
