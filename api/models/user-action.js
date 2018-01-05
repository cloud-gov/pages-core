const validTargetTypes = [['site', 'user']];

const findAllBySite = ({ UserAction, User, ActionType }, siteId) =>
  UserAction.findAll({
    where: {
      siteId,
    },
    attributes: ['id', 'targetType', 'siteId', 'createdAt'],
    include: [{
      model: User,
      as: 'actionTarget',
      attributes: ['id', 'username', 'email', 'createdAt'],
    },
    {
      model: ActionType,
      as: 'actionType',
      attributes: ['action'],
    }],
  });

const associate = ({ User, UserAction, ActionType, Site }) => {
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
  UserAction.belongsTo(Site, {
    foreignKey: 'siteId',
  });
};

const toJSON = function json() {
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
    findAllBySite,
  },
  instanceMethods: {
    toJSON,
  },
};

module.exports = (sequelize, DataTypes) => {
  const UserAction = sequelize.define('UserAction', {
    userId: {
      type: DataTypes.INTEGER, allowNull: false },
    targetId: {
      type: DataTypes.INTEGER, allowNull: false },
    targetType: {
      type: DataTypes.ENUM,
      values: validTargetTypes,
      validate: {
        isIn: validTargetTypes,
      },
      allowNull: false,
    },
    actionId: {
      type: DataTypes.INTEGER, allowNull: false },
    siteId: {
      type: DataTypes.INTEGER, allowNull: false },
  }, tableOptions);

  return UserAction;
};
