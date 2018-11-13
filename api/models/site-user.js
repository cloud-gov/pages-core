const associate = ({ User, Site, SiteUser }) => {
  SiteUser.belongsTo(Site, {
    foreignKey: 'site_users',
    targetKey: 'id',
  });
  SiteUser.belongsTo(User, {
    foreignKey: 'user_sites',
    targetKey: 'id',
  });
};

function toJSON() {
  const object = Object.assign({}, this.get({
    plain: true,
  }));

  object.user_id = object.user_sites;
  object.site_id = object.site_users;

  object.user_sites = null;
  object.site_users = null;

  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key];
    }
  });

  return object;
}

module.exports = (sequelize, DataTypes) => {
  const SiteUser = sequelize.define('SiteUser', {
    buildNotificationSettings: {
      type: DataTypes.ENUM,
      values: ['none', 'builds', 'site'],
      defaultValue: 'site',
    },
  }, {
    tableName: 'site_users__user_sites',
    classMethods: { associate },
    instanceMethods: { toJSON },
    timestamps: false,
  });
  return SiteUser;
};
