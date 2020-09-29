module.exports = (sequelize, DataTypes) => {

  const types = {
    ERROR: 'error',
    AUDIT: 'audit',
  };

  const labels = {
    TIMING: 'timing',
    ADDED: 'added',
    REMOVED: 'removed',
    UPDATED: 'updated',
    AUTHENTICATION: 'authentication',
  };

  const modelNames = [
    'Build', 'Site', 'BuildLog', 'User',
    'UserEnvironmentVariable', 'SiteUser',
  ];

  function isValidType(value) {
    if (!Object.values(types).includes(value)) {
      throw new Error(`Invalid event type: ${value}`);
    }
  }

  function isValidLabel(value) {
    if (!Object.values(labels).includes(value)) {
      throw new Error(`Invalid event label: ${value}`);
    }
  }

  function isValidModel(value) {
    if (!Object.keys(sequelize.models).includes(value)) {
      throw new Error(`Invalid event model: ${value}`);
    }
  }

  const associate = () => {};

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
      type: DataTypes.STRING,
      validate: {
        isValidModel,
      },
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
  Event.labels = labels;
  Event.types = types;
  return Event;
};
