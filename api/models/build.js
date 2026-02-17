const crypto = require('crypto');
const { Op } = require('sequelize');
const URLSafeBase64 = require('urlsafe-base64');
const QueueJobs = require('../queue-jobs');
const { isEmptyOrBranch, isEmptyOrUrl, shaRegex } = require('../utils/validators');
const { buildUrl } = require('../utils/build');
const { buildEnum } = require('../utils');
const { createQueueConnection } = require('../utils/queues');

const connection = createQueueConnection();
const queue = new QueueJobs(connection);

const States = buildEnum([
  'created',
  'queued',
  'tasked',
  'error',
  'invalid',
  'processing',
  'skipped', // remove?
  'success',
]);

const associate = ({ Build, BuildLog, BuildTask, Organization, Site, User }) => {
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
  Build.hasMany(BuildTask, {
    foreignKey: 'buildId',
  });

  // Scopes
  Build.addScope('byOrg', (id) => ({
    include: [
      {
        model: Site,
        required: true,
        include: [
          {
            model: Organization,
            required: true,
            where: { id },
          },
        ],
      },
    ],
  }));
  Build.addScope('bySite', (id) => ({
    include: [
      {
        model: Site,
        where: { id },
      },
    ],
  }));
  // this name is a relic from when Site's had Users, now it describes Users
  // with access to the Site via an Organization
  Build.addScope('forSiteUser', (user) => ({
    where: {
      '$Site.Organization.OrganizationRoles.userId$': user.id,
    },
    include: Site.scope('withOrgUsers'),
  }));
};

async function getSiteOrgUsers() {
  const build = this;

  const { Site } = build.sequelize.models;

  if (!build.Site) {
    await build.reload({ include: Site });
  }

  return build.Site.getOrgUsers();
}

const generateToken = () => URLSafeBase64.encode(crypto.randomBytes(32));

const beforeValidate = (build) => {
  const { token, username } = build;
  build.token = token || generateToken();
  build.username = username && username.toLowerCase();
};

const sanitizeCompleteJobErrorMessage = (message) =>
  // eslint-disable-next-line sonarjs/slow-regex
  message.replace(/\/\/(.*)@github/g, '//[token_redacted]@github');

async function beforeCreate(build) {
  const { Site, SiteBranchConfig, Domain } = this.sequelize.models;
  const site = await Site.findByPk(build.site, { include: [SiteBranchConfig, Domain] });
  build.url = buildUrl(build, site);

  try {
    isEmptyOrBranch(build.branch);
  } catch (e) {
    build.error = e.message;
    build.state = States.Invalid;
    build.completedAt = null;
    build.startedAt = null;
  }
}

async function beforeUpdate(build) {
  if (build._previousDataValues.state === States.Invalid) {
    build.state = build._previousDataValues.state;
    build.error = build._previousDataValues.error;
    build.completedAt = null;
    build.startedAt = null;
  }
}

const jobErrorMessage = (message = 'An unknown error occurred') =>
  sanitizeCompleteJobErrorMessage(message);

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

  if (build.canStart(buildStatus.status)) {
    atts.startedAt = timestamp;
  }

  return build.update(atts);
};

// eslint-disable-next-line sonarjs/no-invariant-returns
async function enqueue() {
  const build = this;

  if (build.state === States.Invalid) {
    return build;
  }

  const { Site, Build } = build.sequelize.models;

  const foundBuild = await Build.findOne({
    where: { id: build.id },
    include: [Site],
  });

  // Set job priority
  const { count: priority } = await Build.findAndCountAll({
    where: {
      [Op.and]: [
        {
          '$Build.site$': foundBuild.Site.id,
        },
        {
          state: {
            [Op.notIn]: [Build.States.Error, Build.States.Success],
          },
        },
      ],
    },
  });

  try {
    await queue.startSiteBuild(foundBuild, priority);
    await build.updateJobStatus({
      status: States.Queued,
    });
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
  const { SiteBranchConfig } = this.sequelize.models;
  const site = await this.getSite({
    include: [SiteBranchConfig],
  });
  const build = await jobStateUpdate(buildStatus, this, site, timestamp);
  if (build.state === States.Success) {
    await site.update({
      publishedAt: timestamp,
    });
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
  return [States.Created, States.Queued, States.Tasked, States.Processing].includes(
    this.state,
  );
}

function canStart(state) {
  return (
    [States.Created, States.Queued, States.Tasked].includes(this.state) &&
    state === States.Processing
  );
}

module.exports = (sequelize, DataTypes) => {
  const Build = sequelize.define(
    'Build',
    {
      branch: {
        type: DataTypes.STRING,
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
      metrics: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'build',
      hooks: {
        beforeValidate,
        beforeCreate,
        beforeUpdate,
      },
      paranoid: true,
    },
  );

  Build.generateToken = generateToken;
  Build.associate = associate;
  Build.prototype.enqueue = enqueue;
  Build.prototype.updateJobStatus = updateJobStatus;
  Build.prototype.canComplete = canComplete;
  Build.prototype.isComplete = isComplete;
  Build.prototype.isInProgress = isInProgress;
  Build.prototype.canStart = canStart;
  Build.prototype.getSiteOrgUsers = getSiteOrgUsers;
  Build.States = States;
  Build.orgScope = (id) => ({
    method: ['byOrg', id],
  });
  Build.siteScope = (id) => ({
    method: ['bySite', id],
  });
  Build.forSiteUser = (user) =>
    Build.scope({
      method: ['forSiteUser', user],
    });
  return Build;
};
