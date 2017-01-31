const associate = ({ BuildLog, Build }) => {
  BuildLog.belongsTo(Build, {
    foreignKey: "build",
    allowNull: false,
  })
}

const beforeValidate = (buildLog) => {
  return sanitizeBuildSecrets(buildLog)
}

const sanitizeBuildSecrets = (buildLog) => {
  const models = buildLog.sequelize.models
  return models.Build.findOne({
    where: { id: buildLog.build },
    include: [ models.User ],
  }).then(build => {
    secrets = [
      sails.config.s3.accessKeyId,
      sails.config.s3.secretAccessKey,
      sails.config.build.token,
      build ? build.User.githubAccessToken : undefined,
    ]
    secrets.forEach(secret => {
      buildLog.output = buildLog.output.replace(secret, "[FILTERED]")
    })
  })
}

module.exports = (sequelize, DataTypes) => {
  const BuildLog = sequelize.define("BuildLog", {
    output: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    build: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    tableName: "buildlog",
    classMethods: {
      associate,
    },
    hooks: {
      beforeValidate,
    },
  })

  return BuildLog
}
