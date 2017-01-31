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
    })
  } else {
    return this.update({
      state: "success",
      error: "",
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
    },
    hooks: {
      afterCreate,
      beforeValidate,
    },
  })

  return Build
}
