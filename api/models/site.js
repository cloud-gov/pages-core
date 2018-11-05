const validator = require('validator');
const config = require('../../config');

const { branchRegex, isValidYaml } = require('../utils/validators');

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

const associate = ({ Site, Build, User, UserAction, SiteUser }) => {
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
};

const beforeValidate = (site) => {
  if (site.repository) {
    site.repository = site.repository.toLowerCase(); // eslint-disable-line no-param-reassign
  }
  if (site.owner) {
    site.owner = site.owner.toLowerCase(); // eslint-disable-line no-param-reassign
  }
};

function domainWithSlash(url) {
  if (url) {
    if (!url.endsWith('/')) {
      return `${url}/`;
    }
  }
  return url;
}

function siteUrl() {
  if (this.domain) {
    return domainWithSlash(this.domain);
  }
  return `${config.app.preview_hostname}/site/${this.owner}/${this.repository}/`;
}

function demoUrl() {
  if (this.demoDomain) {
    return domainWithSlash(this.demoDomain);
  }
  return `${config.app.preview_hostname}/demo/${this.owner}/${this.repository}/`;
}

function branchPreviewUrl(branch = null) {
  let url = `${config.app.preview_hostname}/preview/${this.owner}/${this.repository}/`;
  if (branch) {
    url = `${url}${branch}/`;
  }
  return url;
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

  object.previewLink = this.branchPreviewUrl();

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

function isEmptyOrBranch(value) {
  if (value && value.length && !branchRegex.test(value)) {
    throw new Error('Invalid branch name — branches can only contain alphanumeric characters, underscores, and hyphens.');
  }
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
    config: {
      type: DataTypes.STRING,
      validate: {
        isValidYaml,
      },
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
      values: ['hugo', 'jekyll', 'script only', 'static'],
      defaultValue: 'static',
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    previewConfig: {
      type: DataTypes.STRING,
      validate: {
        isValidYaml,
      },
    },
    demoConfig: {
      type: DataTypes.STRING,
      validate: {
        isValidYaml,
      },
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
    paranoid: true,
  });

  Site.withUsers = id => Site.findById(id, { include: [sequelize.models.User] });

  return Site;
};
