const { Sequelize, DataTypes } = require('sequelize');
const { postgres } = require('../../config');
const { databaseLogger } = require('../../winston');

const {
  database, host, password, port, ssl, user: username,
} = postgres;

const sequelize = new Sequelize(database, username, password, {
  dialect: 'postgres',
  dialectOptions: { ssl },
  host,
  port,
  logging: databaseLogger.info.bind(databaseLogger),
});

require('./build')(sequelize, DataTypes);
require('./build-log')(sequelize, DataTypes);
require('./site')(sequelize, DataTypes);
require('./site-user')(sequelize, DataTypes);
require('./user')(sequelize, DataTypes);
require('./user-action')(sequelize, DataTypes);
require('./action-type')(sequelize, DataTypes);
require('./user-environment-variable')(sequelize, DataTypes);
require('./event')(sequelize, DataTypes);
require('./role')(sequelize, DataTypes);
require('./organization')(sequelize, DataTypes);
require('./organization-role')(sequelize, DataTypes);
require('./uaa-identity')(sequelize, DataTypes);

Object
  .keys(sequelize.models)
  .map(key => sequelize.models[key])
  .filter(model => model.associate)
  .forEach(model => model.associate(sequelize.models));

module.exports = { sequelize, ...sequelize.models };
