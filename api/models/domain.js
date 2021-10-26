const { Op } = require('sequelize');
const { toInt } = require('../utils');
const { isDelimitedFQDN } = require('../utils/validators');

function associate({ Domain, Site }) {
  // Associations
  Domain.belongsTo(Site, {
    foreignKey: 'siteId',
  });

  // Scopes
  Domain.addScope('byIdOrText', (search) => {
    const query = {};

    const id = toInt(search);
    if (id) {
      query.where = { id };
    } else {
      query.where = {
        [Op.or]: [
          { names: { [Op.substring]: search } },
          { serviceName: { [Op.substring]: search } },
        ],
      };
    }
    return query;
  });

  Domain.addScope('bySite', id => ({
    include: [{
      model: Site,
      where: { id },
    }],
  }));

  Domain.addScope('withSite', {
    include: [{
      model: Site,
      required: true,
    }],
  });
}

function define(sequelize, DataTypes) {
  const Domain = sequelize.define('Domain', {
    names: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isDelimitedFQDN,
      },
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    origin: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    serviceName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.ENUM,
      values: ['pending', 'provisioning', 'failed', 'created', 'deprovisioning'],
      defaultValue: 'pending',
      allowNull: false,
    },
  }, {
    tableName: 'domain',
    paranoid: true,
  });

  Domain.associate = associate;
  Domain.prototype.isPending = function isPending() { return this.state === 'pending'; };
  Domain.prototype.isProvisioning = function isProvisioning() { return this.state === 'provisioning'; };
  Domain.searchScope = search => ({ method: ['byIdOrText', search] });
  Domain.siteScope = siteId => ({ method: ['bySite', siteId] });
  return Domain;
}

module.exports = define;
