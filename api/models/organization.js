const { Op } = require('sequelize');
const { toInt } = require('../utils');

const associate = ({
  Organization,
  OrganizationRole,
  Site,
  User,
}) => {
  // Associations
  Organization.belongsToMany(User, {
    through: OrganizationRole,
    foreignKey: 'organizationId',
    otherKey: 'userId',
  });
  Organization.hasMany(Site, {
    foreignKey: 'organizationId',
  });

  // Scopes
  Organization.addScope('byIdOrName', (search) => {
    const query = {};

    const id = toInt(search);
    if (id) {
      query.where = { id };
    } else {
      query.where = {
        name: { [Op.substring]: search },
      };
    }
    return query;
  });
};

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    paranoid: true,
    tableName: 'organization',
  });

  Organization.associate = associate;
  Organization.searchScope = search => ({ method: ['byIdOrName', search] });
  return Organization;
};
