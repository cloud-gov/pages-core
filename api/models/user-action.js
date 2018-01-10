const validTargetTypes = [['site', 'user']];

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

const schema = DataTypes => ({
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
});

module.exports = (sequelize, DataTypes) => {
  const findAllBySite = siteId =>
    sequelize.models.UserAction.findAll({
      where: { siteId },
      attributes: ['id', 'targetType', 'siteId', 'createdAt'],
      include: [{
        model: sequelize.models.User,
        as: 'actionTarget',
        attributes: ['id', 'username', 'email', 'createdAt'],
      },
      {
        model: sequelize.models.ActionType,
        as: 'actionType',
        attributes: ['action'],
      }],
    });

  const UserAction = sequelize.define('UserAction', schema(DataTypes), {
    tableName: 'user_action',
    classMethods: {
      associate,
      findAllBySite,
    },
    instanceMethods: { toJSON },
  });

  return UserAction;
};
