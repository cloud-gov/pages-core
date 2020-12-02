const crypto = require('crypto');
const URLSafeBase64 = require('urlsafe-base64');
const SQS = require('../services/SQS');
const { logger } = require('../../winston');

const { branchRegex, shaRegex, isEmptyOrUrl } = require('../utils/validators');
const { buildUrl } = require('../utils/build');

const States = (function createStates() {
  const values = {
    Created: 'created',
    Queued: 'queued',
    Tasked: 'tasked',
    Error: 'error',
    Processing: 'processing',
    Skipped: 'skipped', // remove?
    Success: 'success',
  };

  return {
    ...values,
    values() {
      return Object.values(values);
    },
  };
}());

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
  const { token, username } = build;
  build.token = token || generateToken(); // eslint-disable-line no-param-reassign
  build.username = username && username.toLowerCase(); // eslint-disable-line no-param-reassign
};

const sanitizeCompleteJobErrorMessage = message => message.replace(/\/\/(.*)@github/g, '//[token_redacted]@github');

const jobErrorMessage = (message = 'An unknown error occurred') => sanitizeCompleteJobErrorMessage(message);

const jobStateUpdate = (buildStatus, build, site, timestamp) => {
  const atts = {
    state: buildStatus.status,
  };

  if (buildStatus.commitSha && buildStatus.commitSha !== build.clonedCommitSha) {
    atts.clonedCommitSha = buildStatus.commitSha;
  }

  if (buildStatus.status === States.Error) {
    atts.error = jobErrorMessage(buildStatus.message);
  }

  if (build.canComplete(buildStatus.status)) {
    atts.completedAt = timestamp;
  }

  if (buildStatus.status === States.Success) {
    atts.url = buildUrl(build, site);
  }

  if (build.canStart(buildStatus.status)) {
    atts.startedAt = timestamp;
  }

  return build.update(atts);
};

async function enqueue() {
  const build = this;

  const {
    Site, User, Build, UserEnvironmentVariable,
  } = build.sequelize.models;

  const foundBuild = await Build.findOne({
    where: { id: build.id },
    include: [User, {
      model: Site,
      required: true,
      include: [UserEnvironmentVariable],
    }],
  });

  const count = await Build.count({
    where: { site: foundBuild.site },
  });

  try {
    await SQS.sendBuildMessage(foundBuild, count);
    await build.updateJobStatus({ status: States.Queued });
  } catch (err) {
    const errMsg = `There was an error, adding the job to SQS: ${err}`;
    logger.error(errMsg);
    await build.updateJobStatus({
      status: States.Error,
      message: errMsg,
    });
  }

  return build;
}

async function updateJobStatus(buildStatus) {
  const timestamp = new Date();
  const site = await this.getSite();
  const build = await jobStateUpdate(buildStatus, this, site, timestamp);
  if (build.state === States.Success) {
    await site.update({ publishedAt: timestamp });
  }
  return build;
}

function canComplete(state) {
  return [States.Error, States.Success].includes(state);
}

function isComplete() {
  return [States.Error, States.Success].includes(this.state);
}

function isInProgress() {
  return [States.Created, States.Queued, States.Tasked, States.Processing].includes(this.state);
}

function canStart(state) {
  return [States.Created, States.Queued, States.Tasked].includes(this.state)
    && state === States.Processing;
}

module.exports = (sequelize, DataTypes) => {
  const Build = sequelize.define('Build', {
    branch: {
      type: DataTypes.STRING,
      validate: {
        is: branchRegex,
      },
    },
    requestedCommitSha: {
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
      values: States.values(),
      defaultValue: States.Created,
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
    },
    startedAt: {
      type: DataTypes.DATE,
    },
    url: {
      type: DataTypes.STRING,
      validate: isEmptyOrUrl,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    logsS3Key: {
      type: DataTypes.STRING,
    },
    clonedCommitSha: {
      type: DataTypes.STRING,
      validate: {
        is: shaRegex,
      },
    },
  }, {
    tableName: 'build',
    hooks: {
      beforeValidate,
    },
    scopes: {
      forSiteUser: (user, Site, User) => ({
        include: [{
          model: Site,
          required: true,
          include: [{
            model: User,
            where: {
              id: user.id,
            },
          }],
        }],
      }),
    },
  });

  Build.generateToken = generateToken;
  Build.associate = associate;
  Build.prototype.enqueue = enqueue;
  Build.prototype.updateJobStatus = updateJobStatus;
  Build.prototype.canComplete = canComplete;
  Build.prototype.isComplete = isComplete;
  Build.prototype.isInProgress = isInProgress;
  Build.prototype.canStart = canStart;
  Build.States = States;
  return Build;
};
