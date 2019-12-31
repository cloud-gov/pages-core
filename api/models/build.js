const crypto = require('crypto');
const URLSafeBase64 = require('urlsafe-base64');
const SQS = require('../services/SQS');

const { branchRegex, shaRegex } = require('../utils/validators');

const afterCreate = (build) => {
  const { Site, User, Build } = build.sequelize.models;

  return Build.findOne({
    where: { id: build.id },
    include: [User, Site],
  }).then((foundBuild) => {
    Build.count({
      where: { site: foundBuild.site },
    }).then(count => SQS.sendBuildMessage(foundBuild, count));
  });
};

const associate = ({
  Build,
  BuildLog,
  Site,
  User,
}) => {
  Build.hasMany(BuildLog, {
    foreignKey: 'build',
  });
  Build.belongsTo(Site, {
    foreignKey: 'site',
    allowNull: false,
  });
  Build.belongsTo(User, {
    foreignKey: 'user',
    allowNull: false,
  });
};

const generateToken = () => URLSafeBase64.encode(crypto.randomBytes(32));

const beforeValidate = (build) => {
  build.token = build.token || generateToken(); // eslint-disable-line no-param-reassign
};

const sanitizeCompleteJobErrorMessage = message => message.replace(/\/\/(.*)@github/g, '//[token_redacted]@github');

const jobErrorMessage = ({ message = 'An unknown error occurred' }) => sanitizeCompleteJobErrorMessage(message);

const jobStateUpdate = (buildStatus, build, completedAt) => {
  if (buildStatus.status === 'error') {
    return build.update({
      state: 'error',
      error: jobErrorMessage(buildStatus),
      completedAt,
    });
  } else if (buildStatus.status === 'processing') {
    return build.update({
      state: 'processing',
    });
  }
  return build.update({
    state: 'success',
    completedAt,
  });
};

const completeJobSiteUpdate = (build, completedAt) => {
  const { Site } = build.sequelize.models;

  if (build.state === 'success') {
    return Site.update(
      { publishedAt: completedAt },
      { where: { id: build.site } }
    );
  }
  return Promise.resolve();
};

function updateJobStatus(buildStatus) {
  const completedAt = new Date();

  return jobStateUpdate(buildStatus, this, completedAt)
    .then(build => completeJobSiteUpdate(build, completedAt)
      .then(() => build));
}

module.exports = (sequelize, DataTypes) => {
  const Build = sequelize.define('Build', {
    branch: {
      type: DataTypes.STRING,
      validate: {
        is: branchRegex,
      },
    },
    commitSha: {
      type: DataTypes.STRING,
      validate: {
        is: shaRegex,
      },
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
      values: ['error', 'processing', 'skipped', 'success', 'queued'],
      defaultValue: 'queued',
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
    tableName: 'build',
    hooks: {
      afterCreate,
      beforeValidate,
    },
  });

  Build.associate = associate;
  Build.prototype.updateJobStatus = updateJobStatus;

  return Build;
};
