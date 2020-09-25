const { types, labels } = require('../utils/event');

const associate = () => {};

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    type: {
      type: DataTypes.ENUM,
      values: Object.values(types),
      allowNull: false,
    },
    label: {
      type: DataTypes.ENUM,
      values: Object.values(labels),
      allowNull: false,
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
