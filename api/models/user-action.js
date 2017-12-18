const associate = ({ User, UserAction }) => {
  UserAction.belongsTo(UserAction, {
    foreignKey: 'userId'
  });
};

const toJSON = () => {
  const record = this.get({
    plain: true,
  });

  record.createdAt = record.createdAt.toISOString();

  return record;
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
    targetTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    actionTypeID: {
      type: DataTypes.INTEGER
      //values: ['zadd', 'remove', 'update'],
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.TIMESTAMP,
      allowNull: false
    }
  }, {
    tableName: 'user_action',
    classMethods: {
      associate,
    },
    instanceMethods: {
      toJSON,
    }
  });

  return UserAction;
};
