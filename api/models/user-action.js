const validTargetTypes = [['site', 'user']];

const associate = ({ User, UserAction, ActionType, Site }) => {
  UserAction.belongsTo(User, {
    as: 'initiator',
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
  UserAction.belongsTo(Site, {
    foreignKey: 'siteId',
  });
};

const schema = (DataTypes) => ({
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
  siteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = (sequelize, DataTypes) => {
  const findAllBySite = (siteId) =>
    sequelize.models.UserAction.findAll({
      where: { siteId },
      attributes: ['id', 'targetType', 'siteId', 'createdAt'],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: sequelize.models.User,
          as: 'actionTarget',
          attributes: ['id', 'username', 'email', 'createdAt'],
        },
        {
          model: sequelize.models.User,
          as: 'initiator',
          attributes: ['id', 'username', 'email', 'createdAt'],
        },
        {
          model: sequelize.models.ActionType,
          as: 'actionType',
          attributes: ['action'],
        },
      ],
    });

  const UserAction = sequelize.define('UserAction', schema(DataTypes), {
    tableName: 'user_action',
  });

  UserAction.associate = associate;
  UserAction.findAllBySite = findAllBySite;

  return UserAction;
};
