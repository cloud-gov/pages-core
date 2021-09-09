const { Op } = require('sequelize');
const moment = require('moment');
const { toInt } = require('../utils');
const { sandboxDays } = require('../../config').app;

const associate = ({
  Organization,
  OrganizationRole,
  Role,
  Site,
  User,
}) => {
  // Associations
  Organization.belongsToMany(User, {
    through: OrganizationRole,
    foreignKey: 'organizationId',
    otherKey: 'userId',
  });
  Organization.hasMany(OrganizationRole, {
    foreignKey: 'organizationId',
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

  Organization.addScope('forUser', user => ({
    include: [
      {
        model: User,
        required: true,
        where: {
          id: user.id,
        },
      },
      {
        model: OrganizationRole,
        required: true,
        where: {
          userId: user.id,
        },
      },
    ],
  }));

  Organization.addScope('forManagerRole', user => ({
    include: [{
      model: OrganizationRole,
      required: true,
      where: {
        userId: user.id,
      },
      include: [{
        model: Role,
        required: true,
        where: {
          name: 'manager',
        },
      }],
    }],
  }));
};

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isSandbox: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sandboxNextCleaningAt: {
      type: DataTypes.DATE,
    },
    daysUntilSandboxCleaning: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.isSandbox || !this.sandboxNextCleaningAt) {
          return null;
        }
        const start = moment(this.sandboxNextCleaningAt).endOf('day');
        const diff = start.diff(moment().endOf('day'));
        return moment.duration(diff).asDays();
      },
    },
  }, {
    paranoid: true,
    tableName: 'organization',
  });

  Organization.associate = associate;
  Organization.searchScope = search => ({ method: ['byIdOrName', search] });
  Organization.forUser = user => Organization.scope({ method: ['forUser', user] });
  Organization.forManagerRole = user => Organization.scope({ method: ['forManagerRole', user] });
  return Organization;
};
