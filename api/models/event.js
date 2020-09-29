const { isValidType, isValidLabel } = require('../utils/event');

const associate = () => {};

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidType,
      },
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidLabel,
      },
    },
    modelId: {
      type: DataTypes.INTEGER,
    },
    model: {
      type: DataTypes.ENUM,
      values: Object.keys(sequelize.models),
    },
    body: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'event',
    timestamps: true,
    updatedAt: false,
  });

  Event.associate = associate;
  return Event;
};
