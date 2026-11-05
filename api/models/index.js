const { Sequelize, DataTypes } = require('sequelize');
const { postgres } = require('../../config');
const { databaseLogger } = require('../../winston');

const { database, host, password, port, ssl, user: username, retry } = postgres;

const sequelize = new Sequelize(database, username, password, {
  dialect: 'postgres',
  dialectOptions: { ssl },
  host,
  port,
  logging: databaseLogger.info.bind(databaseLogger),
  retry,
});

// Add a permanent global hook to prevent unknowingly hitting this Sequelize bug:
//   https://github.com/sequelize/sequelize/issues/10557#issuecomment-481399247
sequelize.addHook('beforeCount', function (options) {
  if (this._scope.include && this._scope.include.length > 0) {
    options.distinct = true;
    options.col = this._scope.col || options.col || `"${this.options.name.singular}".id`;
  }

  // @ts-expect-error
  if (options.include && options.include.length > 0) {
    options.include = null;
  }
});

require('./build')(sequelize, DataTypes);
require('./build-log')(sequelize, DataTypes);
require('./build-task-type')(sequelize, DataTypes);
require('./build-task')(sequelize, DataTypes);
require('./file-storage-domain')(sequelize, DataTypes);
require('./file-storage-file')(sequelize, DataTypes);
require('./file-storage-service')(sequelize, DataTypes);
require('./file-storage-user-action')(sequelize, DataTypes);
require('./site')(sequelize, DataTypes);
require('./site-branch-config')(sequelize, DataTypes);
require('./site-build-task')(sequelize, DataTypes);
require('./user')(sequelize, DataTypes);
require('./user-action')(sequelize, DataTypes);
require('./action-type')(sequelize, DataTypes);
require('./user-environment-variable')(sequelize, DataTypes);
require('./event')(sequelize, DataTypes);
require('./role')(sequelize, DataTypes);
require('./organization')(sequelize, DataTypes);
require('./organization-role')(sequelize, DataTypes);
require('./uaa-identity')(sequelize, DataTypes);
require('./domain')(sequelize, DataTypes);

Object.keys(sequelize.models)
  .map((key) => sequelize.models[key])
  // @ts-expect-error
  .filter((model) => model.associate)
  // @ts-expect-error
  .forEach((model) => model.associate(sequelize.models));

/* eslint-disable max-len */
/**
 * @typedef {object} Models
 * @property {ReturnType<typeof import('./build')>} Build
 * @property {ReturnType<typeof import('./build-log')>} BuildLog
 * @property {ReturnType<typeof import('./build-task-type')>} BuildTaskType
 * @property {ReturnType<typeof import('./build-task')>} BuildTask
 * @property {ReturnType<typeof import('./file-storage-domain')>} FileStorageDomain
 * @property {ReturnType<typeof import('./file-storage-file')>} FileStorageFile
 * @property {ReturnType<typeof import('./file-storage-service')>} FileStorageService
 * @property {ReturnType<typeof import('./file-storage-user-action')>} FileStorageUserAction
 * @property {ReturnType<typeof import('./site')>} Site
 * @property {ReturnType<typeof import('./site-branch-config')>} SiteBranchConfig
 * @property {ReturnType<typeof import('./site-build-task')>} SiteBuildTask
 * @property {ReturnType<typeof import('./user')>} User
 * @property {ReturnType<typeof import('./user-action')>} UserAction
 * @property {ReturnType<typeof import('./action-type')>} ActionType
 * @property {ReturnType<typeof import('./user-environment-variable')>} UserEnvironmentVariable
 * @property {ReturnType<typeof import('./event')>} Event
 * @property {ReturnType<typeof import('./role')>} Role
 * @property {ReturnType<typeof import('./organization')>} Organization
 * @property {ReturnType<typeof import('./organization-role')>} OrganizationRole
 * @property {ReturnType<typeof import('./uaa-identity')>} UAAIdentity
 * @property {ReturnType<typeof import('./domain')>} Domain
 */
/* eslint-enable max-len */

const {
  Build,
  BuildLog,
  BuildTaskType,
  BuildTask,
  FileStorageDomain,
  FileStorageFile,
  FileStorageService,
  FileStorageUserAction,
  Site,
  SiteBranchConfig,
  SiteBuildTask,
  User,
  UserAction,
  ActionType,
  UserEnvironmentVariable,
  Event,
  Role,
  Organization,
  OrganizationRole,
  UAAIdentity,
  Domain,
} = /** @type {Models} */ (/** @type {unknown} */ (sequelize.models));

module.exports = {
  sequelize,
  ...sequelize.models,
  Build,
  BuildLog,
  BuildTaskType,
  BuildTask,
  FileStorageDomain,
  FileStorageFile,
  FileStorageService,
  FileStorageUserAction,
  Site,
  SiteBranchConfig,
  SiteBuildTask,
  User,
  UserAction,
  ActionType,
  UserEnvironmentVariable,
  Event,
  Role,
  Organization,
  OrganizationRole,
  UAAIdentity,
  Domain,
};
