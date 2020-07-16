const { branchRegex, parseSiteConfigs, isEmptyOrUrl } = require('../utils/validators');

const afterValidate = (site) => {
  if (site.defaultBranch === site.demoBranch) {
    const error = new Error('Default branch and demo branch cannot be the same');
    error.status = 403;
    throw error;
  }
  if (site.domain && site.domain === site.demoDomain) {
    const error = new Error('Domain and demo domain cannot be the same');
    error.status = 403;
    throw error;
  }
};

const validationFailed = (site, options, validationError) => {
  const messages = validationError.errors.map(err => `${err.path}: ${err.message}`);

  const error = new Error(messages.join('\n'));
  error.status = 403;
  throw error;
};

const associate = ({
  Site,
  Build,
  User,
  UserAction,
  SiteUser,
  UserEnvironmentVariable,
}) => {
  Site.hasMany(Build, {
    foreignKey: 'site',
  });
  Site.belongsToMany(User, {
    through: SiteUser,
    foreignKey: 'site_users',
    timestamps: false,
  });
  Site.hasMany(UserAction, {
    as: 'userActions',
    foreignKey: 'siteId',
  });
  Site.hasMany(UserEnvironmentVariable, {
    foreignKey: 'siteId',
  });
};

const beforeValidate = (site) => {
  if (site.repository) {
    site.repository = site.repository.toLowerCase(); // eslint-disable-line no-param-reassign
  }
  if (site.owner) {
    site.owner = site.owner.toLowerCase(); // eslint-disable-line no-param-reassign
  }

  const siteConfigs = {
    defaultConfig: { value: site.defaultConfig, label: 'Site configuration' },
    demoConfig: { value: site.demoConfig, label: 'Demo configuration' },
    previewConfig: { value: site.previewConfig, label: 'Preview configuration' },
  };

  Object.assign(site, parseSiteConfigs(siteConfigs));
};

function isEmptyOrBranch(value) {
  if (value && value.length && !branchRegex.test(value)) {
    throw new Error('Invalid branch name — branches can only contain alphanumeric characters, underscores, and hyphens.');
  }
}

module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define('Site', {
    demoBranch: {
      type: DataTypes.STRING,
      validate: {
        isEmptyOrBranch,
      },
    },
    demoDomain: {
      type: DataTypes.STRING,
      validate: {
        isEmptyOrUrl,
      },
    },
    defaultConfig: {
      type: DataTypes.JSONB,
    },
    defaultBranch: {
      type: DataTypes.STRING,
      defaultValue: 'master',
      validate: {
        isEmptyOrBranch,
      },
    },
    domain: {
      type: DataTypes.STRING,
      validate: {
        isEmptyOrUrl,
      },
    },
    engine: {
      type: DataTypes.ENUM,
      values: ['hugo', 'jekyll', 'node.js', 'static'],
      defaultValue: 'static',
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    previewConfig: {
      type: DataTypes.JSONB,
    },
    demoConfig: {
      type: DataTypes.JSONB,
    },
    publishedAt: {
      type: DataTypes.DATE,
    },
    repository: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    repoLastVerified: {
      type: DataTypes.DATE,
    },
    buildStatus: {
      type: DataTypes.ENUM,
      values: ['active', 'inactive'],
      defaultValue: 'active',
    },
    s3ServiceName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    awsBucketName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    awsBucketRegion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    subdomain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'site',
    hooks: {
      beforeValidate,
      afterValidate,
      validationFailed,
    },
    paranoid: true,

    getterMethods: {
      basicAuth() {
        return this.config.basicAuth || {};
      },
    },
    scopes: {
      forUser: (user, User) => ({
        include: [{
          model: User,
          required: true,
          where: {
            id: user.id,
          },
        }],
      }),
    },
  });

  Site.associate = associate;

  Site.withUsers = id => Site.findByPk(id, { include: [sequelize.models.User] });

  return Site;
};
