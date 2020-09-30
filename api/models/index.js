const { Sequelize, DataTypes } = require('sequelize');
const { postgres } = require('../../config');
const { databaseLogger } = require('../../winston');

const {
  database, host, password, port, user: username,
} = postgres;

const sequelize = new Sequelize(database, username, password, {
  dialect: 'postgres',
  host,
  port,
  logging: databaseLogger.info.bind(databaseLogger),
});

/* eslint-disable no-unused-vars */
const Build = require('./build')(sequelize, DataTypes);
const BuildLog = require('./build-log')(sequelize, DataTypes);
const Site = require('./site')(sequelize, DataTypes);
const SiteUser = require('./site-user')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);
const UserAction = require('./user-action')(sequelize, DataTypes);
const ActionType = require('./action-type')(sequelize, DataTypes);
const UserEnvironmentVariable = require('./user-environment-variable')(sequelize, DataTypes);
const Event = require('./event')(sequelize, DataTypes);
/* eslint-enable no-unused-vars */

Object
  .keys(sequelize.models)
  .forEach(key => sequelize.models[key].associate(sequelize.models));

Site.forUser = user => Site.scope({ method: ['forUser', user, User] });

Build.forSiteUser = user => Build
  .scope({ method: ['forSiteUser', user, Site, User] });

UserEnvironmentVariable.forSiteUser = user => UserEnvironmentVariable
  .scope({ method: ['forSiteUser', user, Site, User] });

module.exports = { sequelize, ...sequelize.models };
