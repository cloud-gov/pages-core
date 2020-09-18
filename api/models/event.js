const config = require('../../config');

const type = {
  ERROR: 'error',
  AUDIT: 'audit',
  REQUEST: 'request',
};
const categories = {
  BUILD: 'build',
  SITE: 'site',
  USER: 'user',
  INFRASTRUCTURE: 'infrastructure',
  ANALYTICS: 'analytics',
  QUERY_TIMING: 'query_timing',
};
const names = {
  TIMING: 'timing',
  REMOVED: 'removed', // ie: site/site-user/infrastructure removed
  DISABLED: 'disabled', // ie: sites not build/visible, user cannot login/removed Federalist users
  ADDED: 'added',
  UPDATED: 'updated', // ie: site settings updated, build status change,
  AUTHENTICATED: 'authenticated', // ie: everytime user authenticated

};
const models = {
  SITE: 'site',
  BUILD: 'build',
  USER: 'user',
  BUILD_LOG: 'build_log',
  SITE_USER: 'site_user',
  USER_ENVIRONMENT_VARIABLE: 'user_environment_variable',
  ACTION_TYPE: 'action_type',
};

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    category: {
      type: DataTypes.ENUM,
      values: Object.values(categories),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM,
      values: Object.values(types),
      allowNull: false,
    },
    name: {
      type: DataTypes.ENUM,
      values: Object.values(names),
      allowNull: false,
    },
    modelId: {
      type: DataTypes.INTEGER,
    },
    model: {
      type: DataTypes.ENUM,
      values: Object.values(models),
    },
    body: {
      type: DataTypes.JSONB,
    },
    hiddenAt: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'event',
  });
  Event.categories = categories;
  Event.types = types;
  Event.names = names;
  Event.models = models;
  return Event;
};
