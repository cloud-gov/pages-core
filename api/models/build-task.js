const { buildEnum } = require('../utils');

const Statuses = buildEnum([
  'created',
  'queued',
  'tasked',
  'error',
  'processing',
  'skipped', // remove?
  'success',
]);

module.exports = (sequelize, DataTypes) => {
  // eslint-disable-next-line sonarjs/prefer-immediate-return
  const BuildTask = sequelize.define(
    'BuildTask',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      artifact: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.ENUM,
        values: Statuses.values,
        defaultValue: Statuses.Created,
        allowNull: false,
        validate: {
          isIn: [Statuses.values],
        },
      },
    }
  );

  return BuildTask;
};
