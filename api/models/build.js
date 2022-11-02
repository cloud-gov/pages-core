const { Op, Sequelize } = require('sequelize');
const crypto = require('crypto');
const URLSafeBase64 = require('urlsafe-base64');
const SiteBuildQueue = require('../services/SiteBuildQueue');

const { branchRegex, shaRegex, isEmptyOrUrl } = require('../utils/validators');
const { buildUrl } = require('../utils/build');
const { buildEnum } = require('../utils');

const States = buildEnum([
  'created',
  'queued',
  'tasked',
  'error',
  'processing',
  'skipped', // remove?
  'success',
]);

const associate = ({
  Build,
  BuildLog,
  Organization,
  Site,
  User,
  OrganizationRole,
}) => {
  // Associations
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

  // Scopes
  Build.addScope('byOrg', id => ({
    include: [{
      model: Site,
      include: [{
        model: Organization,
        where: { id },
      }],
    }],
  }));
  Build.addScope('bySite', id => ({
    include: [{
      model: Site,
      where: { id },
    }],
  }));
  Build.addScope('forSiteUser', user => ({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { '$Site.Users.id$': { [Op.not]: null } },
            { '$Site.organizationId$': { [Op.not]: null } },
          ],
        },
        {
          [Op.or]: [
            { '$Site.Users.id$': user.id },
            { '$Site.Organization.OrganizationRoles.userId$': user.id },
          ],
        },
      ],
    },
    include: [{
      model: Site,
      required: true,
      include: [
        {
          model: User,
          required: false,
        },
        {
          model: Organization,
          required: false,
          include: [{
            model: OrganizationRole,
          }],
        },
      ],
    }],
  }));
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
      include: [UserEnvironmentVariable, User],
    }],
  });

  const count = await Build.count({
    where: { site: foundBuild.site },
  });

  try {
    await SiteBuildQueue.sendBuildMessage(foundBuild, count);
    await build.updateJobStatus({ status: States.Queued });
  } catch (err) {
    const errMsg = `There was an error, adding the job to SiteBuildQueue: ${err}`;
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
      allowNull: false,
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
      values: States.values,
      defaultValue: States.Created,
      allowNull: false,
      validate: {
        isIn: [States.values],
      },
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
  Build.orgScope = id => ({ method: ['byOrg', id] });
  Build.siteScope = id => ({ method: ['bySite', id] });
  Build.forSiteUser = user => Build.scope({ method: ['forSiteUser', user] });
  return Build;
};
