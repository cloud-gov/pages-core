const validTargetTypes = ['site', 'user'];
const associate = ({ User, UserAction, ActionType }) => {
  UserAction.belongsTo(User, {
    foreignKey: 'userId',
  });
  UserAction.belongsTo(User, {
    as: 'actionTarget',
    foreignKey: 'targetId',
    unique: false,
  });
  UserAction.belongsTo(ActionType, {
    foreignKey: 'actionId',
    as: 'actionType',
  });
};

const toJSON = function json() {
  const record = this.get({
    plain: true,
  });

  record.createdAt = record.createdAt.toISOString();
  record.updatedAt = record.updatedAt.toISOString();

  return record;
};

const tableOptions = {
  tableName: 'user_action',
  classMethods: {
    associate,
  },
  instanceMethods: {
    toJSON,
  },
};

module.exports = (sequelize, DataTypes) => {
  const UserAction = sequelize.define('UserAction', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    targetType: {
      type: DataTypes.ENUM,
      values: validTargetTypes,
      validate: {
        isIn: validTargetTypes,
      },
      allowNull: false,
    },
    actionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, tableOptions);

  return UserAction;
};
