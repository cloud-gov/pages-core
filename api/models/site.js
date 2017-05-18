const url = require("url")
const config = require("../../config")

const afterValidate = (site) => {
  if (site.defaultBranch == site.demoBranch) {
    const error = new Error("Default branch and demo branch cannot be the same")
    error.status = 403
    throw error
  }
  if (site.domain && site.domain == site.demoDomain) {
    const error = new Error("Domain and demo domain cannot be the same")
    error.status = 403
    throw error
  }
}

const associate = ({ Site, Build, User }) => {
  Site.hasMany(Build, {
    foreignKey: "site",
  })
  Site.belongsToMany(User, {
    through: "site_users__user_sites",
    foreignKey: "site_users",
    timestamps: false,
  })
}

const beforeValidate = (site) => {
  if (site.repository) {
    site.repository = site.repository.toLowerCase()
  }
  if (site.owner) {
    site.owner = site.owner.toLowerCase()
  }
}

const toJSON = function() {
  const object = Object.assign({}, this.get({
    plain: true,
  }))

  object.createdAt = object.createdAt.toISOString()
  object.updatedAt = object.updatedAt.toISOString()

  const s3Config = config.s3
  object.siteRoot = `http://${s3Config.bucket}.s3-website-${s3Config.region}.amazonaws.com`
  object.viewLink = object.domain || [object.siteRoot, 'site', object.owner, object.repository].join('/')
  if (object.demoBranch) {
    object.demoViewLink = object.demoDomain || [object.siteRoot, 'demo', object.owner, object.repository].join('/')
  }

  Object.keys(object).forEach(key => {
    if (object[key] === null) {
      delete object[key]
    }
  })

  return object
}

const viewLinkForBranch = function(branch) {
  const s3Root = `http://${config.s3.bucket}.s3-website-${config.s3.region}.amazonaws.com`

  if (branch === this.defaultBranch && this.domain) {
    return this.domain
  } else if (branch === this.defaultBranch) {
    return `${s3Root}/site/${this.owner}/${this.repository}`
  } else if (branch === this.demoBranch && this.demoDomain) {
    return this.demoDomain
  } else if (branch === this.demoBranch) {
    return `${s3Root}/demo/${this.owner}/${this.repository}`
  } else {
    return url.resolve(config.app.preview_hostname, `/preview/${this.owner}/${this.repository}/${branch}`)
  }
}

module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define("Site", {
    demoBranch: {
      type: DataTypes.STRING,
    },
    demoDomain: {
      type: DataTypes.STRING,
    },
    config: {
      type: DataTypes.STRING,
    },
    defaultBranch: {
      type: DataTypes.STRING,
      defaultValue: "master",
    },
    domain: {
      type: DataTypes.STRING,
    },
    engine: {
      type: DataTypes.ENUM,
      values: ["jekyll", "hugo", "static"],
      defaultValue: "static",
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    previewConfig: {
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
    tableName: "site",
    classMethods: {
      associate,
    },
    instanceMethods: {
      toJSON,
      viewLinkForBranch,
    },
    hooks: {
      beforeValidate,
      afterValidate,
    }
  })

  return Site
}
