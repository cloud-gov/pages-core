const { Op } = require('sequelize');
const { buildEnum, toInt } = require('../utils');
const { isDelimitedFQDN } = require('../utils/validators');

const States = buildEnum(['pending', 'provisioning', 'failed', 'provisioned', 'deprovisioning']);
const Contexts = buildEnum(['site', 'demo']);

function associate({ Domain, Site, Organization }) {
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

  Domain.addScope('byState', state => ({
    where: {
      state,
    },
  }));

  Domain.addScope('byOrg', id => ({
    include: [{
      model: Site,
      required: true,
      include: [{
        model: Organization,
        required: true,
        where: { id },
      }],
    }],
  }));

  Domain.addScope('provisionedWithSiteAndOrganization', {
    where: { state: 'provisioned' },
    include: [{
      model: Site,
      include: [
        { model: Organization },
      ],
    }],
    order: [
      [Site, Organization, 'name', 'ASC'],
      [Site, 'repository', 'ASC'],
    ],
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
    context: {
      type: DataTypes.ENUM,
      values: Contexts.values,
      allowNull: false,
      validate: {
        isIn: [Contexts.values],
      },
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
      values: States.values,
      defaultValue: States.Pending,
      allowNull: false,
      validate: {
        isIn: [States.values],
      },
    },
  }, {
    tableName: 'domain',
    paranoid: true,
  });

  Domain.associate = associate;
  Domain.searchScope = search => ({ method: ['byIdOrText', search] });
  Domain.siteScope = siteId => ({ method: ['bySite', siteId] });
  Domain.orgScope = orgId => ({ method: ['byOrg', orgId] });
  Domain.stateScope = state => ({ method: ['byState', state] });
  Domain.States = States;
  Domain.Contexts = Contexts;
  Domain.prototype.isPending = function isPending() {
    return this.state === Domain.States.Pending;
  };
  Domain.prototype.isProvisioning = function isProvisioning() {
    return this.state === Domain.States.Provisioning;
  };
  Domain.prototype.namesArray = function namesArray() {
    return this.names.split(',');
  };
  Domain.prototype.firstName = function firstName() {
    return this.namesArray()[0];
  };
  return Domain;
}

module.exports = define;
