const validTargetTypes = ['site', 'user'];
const associate = ({ User, UserAction }) => {
  UserAction.belongsTo(User, {
    foreignKey: 'userId',
  });
};

const toJSON = () => {
  const record = this.get({
    plain: true,
  });

  record.createdAt = record.createdAt.toISOString();

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
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('NOW()'),
    },
  }, tableOptions);

  return UserAction;
};
