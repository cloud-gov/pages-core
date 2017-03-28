const config = require("../../config")

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
  } else {
    return `${s3Root}/preview/${this.owner}/${this.repository}/${branch}`
  }
}

module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define("Site", {
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
    publicPreview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    }
  })

  return Site
}
