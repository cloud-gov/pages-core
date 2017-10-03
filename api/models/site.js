const validator = require('validator');

const config = require('../../config');

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

const associate = ({ Site, Build, User }) => {
  Site.hasMany(Build, {
    foreignKey: 'site',
  });
  Site.belongsToMany(User, {
    through: 'site_users__user_sites',
    foreignKey: 'site_users',
    timestamps: false,
  });
};

const beforeValidate = (site) => {
  if (site.repository) {
    site.repository = site.repository.toLowerCase(); // eslint-disable-line no-param-reassign
  }
  if (site.owner) {
    site.owner = site.owner.toLowerCase(); // eslint-disable-line no-param-reassign
  }
};


function siteUrl() {
  return this.domain || `${config.app.preview_hostname}/site/${this.owner}/${this.repository}/`;
}

function demoUrl() {
  return this.demoDomain || `${config.app.preview_hostname}/demo/${this.owner}/${this.repository}/`;
}

function branchPreviewUrl(branch) {
  return `${config.app.preview_hostname}/preview/${this.owner}/${this.repository}/${branch}/`;
}

function toJSON() {
  const object = Object.assign({}, this.get({
    plain: true,
  }));

  delete object.site_users__user_sites;

  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();

  object.viewLink = this.siteUrl();

  if (object.demoBranch) {
    object.demoViewLink = this.demoUrl();
  }

  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key];
    }
  });

  return object;
}

function viewLinkForBranch(branch) {
  if (branch === this.defaultBranch) {
    return this.siteUrl();
  } else if (branch === this.demoBranch) {
    return this.demoUrl();
  }

  return this.branchPreviewUrl(branch);
}

function isEmptyOrUrl(value) {
  const validUrlOptions = {
    require_protocol: true,
    protocols: ['https'],
  };

  if (value && value.length && !validator.isURL(value, validUrlOptions)) {
    throw new Error('URL must start with https://');
  }
}

module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define('Site', {
    demoBranch: {
      type: DataTypes.STRING,
    },
    demoDomain: {
      type: DataTypes.STRING,
      validate: {
        isEmptyOrUrl,
      },
    },
    config: {
      type: DataTypes.STRING,
    },
    defaultBranch: {
      type: DataTypes.STRING,
      defaultValue: 'master',
    },
    domain: {
      type: DataTypes.STRING,
      validate: {
        isEmptyOrUrl,
      },
    },
    engine: {
      type: DataTypes.ENUM,
      values: ['jekyll', 'hugo', 'static'],
      defaultValue: 'static',
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    previewConfig: {
      type: DataTypes.STRING,
    },
    demoConfig: {
      type: DataTypes.STRING,
    },
    publishedAt: {
      type: DataTypes.DATE,
    },
    repository: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'site',
    classMethods: {
      associate,
    },
    instanceMethods: {
      toJSON,
      viewLinkForBranch,
      siteUrl,
      demoUrl,
      branchPreviewUrl,
    },
    hooks: {
      beforeValidate,
      afterValidate,
      validationFailed,
    },
  });

  return Site;
};
