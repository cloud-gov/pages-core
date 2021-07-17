const defaultTypes = ['add', 'remove', 'update'];

const associate = ({ ActionType, UserAction }) => {
  ActionType.hasMany(UserAction, {
    foreignKey: 'actionId',
  });
};

module.exports = (sequelize, DataTypes) => {
  const createDefaultActionTypes = () => Promise.all(
    defaultTypes.map(type => sequelize.models.ActionType.create({ action: type }))
  );

  const ActionType = sequelize.define('ActionType', {
    action: {
      type: DataTypes.STRING,
      length: 20,
      allowNull: false,
    },
  }, {
    tableName: 'action_type',
    timestamps: false,
  });

  ActionType.associate = associate;
  ActionType.createDefaultActionTypes = createDefaultActionTypes;

  return ActionType;
};
