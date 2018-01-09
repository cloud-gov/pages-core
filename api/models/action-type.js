const associate = ({ ActionType, UserAction }) => {
  ActionType.hasMany(UserAction, {
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
    timestamps: false,
  });

  return ActionType;
};
