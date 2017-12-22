const associate = ({ ActionType, UserAction }) => {
  ActionType.belongsTo(UserAction, {
    foreignKey: 'actionId',
  });
};

module.exports = (sequelize, DataTypes) => {
  const ActionType = sequelize.define('ActionType', {
    action: {
      type: DataTypes.STRING,
      length: 20,
      allowNull: false,
    },
  }, {
    tableName: 'action_type',
    classMethods: {
      associate,
    },
  });

  return ActionType;
};
