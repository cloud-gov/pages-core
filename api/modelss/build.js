const crypto = require("crypto")
const URLSafeBase64 = require('urlsafe-base64')

const afterCreate = (build) => {
  const { Site, User, Build } = build.sequelize.models

  return Build.findOne({
    where: { id: build.id },
    include: [ User, Site ]
  }).then(build => {
    SQS.sendBuildMessage(build)
  })
}

const associate = ({ Build, BuildLog, Site, User }) => {
  Build.hasMany(BuildLog, {
    foreignKey: "build",
  })
  Build.belongsTo(Site, {
    foreignKey: "site",
    allowNull: false,
  })
  Build.belongsTo(User, {
    foreignKey: "user",
    allowNull: false,
  })
}

const beforeValidate = (build) => {
  build.token = build.token || generateToken()
}

const completeJob = function(err) {
  if (err) {
    return this.update({
      state: "error",
      error: completeJobErrorMessage(err),
      completedAt: new Date(),
    })
  } else {
    return this.update({
      state: "success",
      error: "",
      completedAt: new Date(),
    })
  }
}

const completeJobErrorMessage = (err) => {
  let message
  if (err) {
    message = err.message || err
  } else {
    message = "An unknown error occured"
  }
  return sanitizeCompleteJobErrorMessage(message)
}

const generateToken = () => {
  return URLSafeBase64.encode(crypto.randomBytes(32))
}

const sanitizeCompleteJobErrorMessage = (message) => {
  return message.replace(/\/\/(.*)@github/g, '//[token_redacted]@github')
}

const toJSON = function() {
  const object = this.get({
    plain: true,
  })
  object.createdAt = object.createdAt.toISOString()
  object.updatedAt = object.updatedAt.toISOString()
  if (object.completedAt) {
    object.completedAt = object.completedAt.toISOString()
  }
  Object.keys(object).forEach(key => {
    if (object[key] === null) {
      delete object[key]
    }
  })
  return object
}

module.exports = (sequelize, DataTypes) => {
  const Build = sequelize.define("Build", {
    branch: {
      type: DataTypes.STRING,
    },
    completedAt: {
      type: DataTypes.DATE,
    },
    error: {
      type: DataTypes.STRING,
    },
    source: {
      type: DataTypes.JSON,
    },
    state: {
      type: DataTypes.ENUM,
      values: ["error", "processing", "skipped", "success"],
      defaultValue: "processing",
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    site: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: "build",
    classMethods: {
      associate,
    },
    instanceMethods: {
      completeJob,
      toJSON,
    },
    hooks: {
      afterCreate,
      beforeValidate,
    },
  })

  return Build
}
