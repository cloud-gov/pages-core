const config = require('../../config');

const associate = ({ BuildLog, Build }) => {
  BuildLog.belongsTo(Build, {
    foreignKey: 'build',
    allowNull: false,
  });
};

const sanitizeBuildSecrets = (buildLog) => {
  const { models } = buildLog.sequelize;
  return models.Build.findOne({
    where: { id: buildLog.build },
    include: [models.User],
  }).then((build) => {
    const secrets = [
      config.build.token,
      build ? build.User.githubAccessToken : undefined,
    ];
    secrets.forEach((secret) => {
      buildLog.output = buildLog.output.replace(secret, '[FILTERED]'); // eslint-disable-line no-param-reassign
    });
  });
};

const afterValidate = buildLog => sanitizeBuildSecrets(buildLog);

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
    hooks: {
      afterValidate,
    },
  });

  BuildLog.associate = associate;

  return BuildLog;
};
