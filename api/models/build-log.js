const config = require('../../config');

const associate = ({ BuildLog, Build }) => {
  BuildLog.belongsTo(Build, {
    foreignKey: 'build',
    allowNull: false,
  });
};

const sanitizeBuildSecrets = (buildLog) => {
  const models = buildLog.sequelize.models;
  return models.Build.findOne({
    where: { id: buildLog.build },
    include: [models.User],
  }).then((build) => {
    const secrets = [
      config.s3.accessKeyId,
      config.s3.secretAccessKey,
      config.build.token,
      build ? build.User.githubAccessToken : undefined,
    ];
    secrets.forEach((secret) => {
      buildLog.output = buildLog.output.replace(secret, '[FILTERED]'); // eslint-disable-line no-param-reassign
    });
  });
};

const afterValidate = buildLog => sanitizeBuildSecrets(buildLog);

function toJSON() {
  const object = this.get({
    plain: true,
  });
  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();
  return object;
}

module.exports = (sequelize, DataTypes) => {
  const BuildLog = sequelize.define('BuildLog', {
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
    },
  }, {
    tableName: 'buildlog',
    classMethods: {
      associate,
    },
    instanceMethods: {
      toJSON,
    },
    hooks: {
      afterValidate,
    },
  });

  return BuildLog;
};
