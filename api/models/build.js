const crypto = require('crypto');
const URLSafeBase64 = require('urlsafe-base64');
const validator = require('validator');
const SQS = require('../services/SQS');

const { branchRegex, shaRegex } = require('../utils/validators');

const afterCreate = (build) => {
  const { Site, User, Build } = build.sequelize.models;

  return Build.findOne({
    where: { id: build.id },
    include: [User, Site],
  })
    .then((foundBuild) => {
      Build.count({
        where: { site: foundBuild.site },
      }).then(count => SQS.sendBuildMessage(foundBuild, count));
    });
};

const beforeCreate = async (build) => {
  const site = await build.getSite();
  const domain = getDomain(site);
  const path = getPath(build, site);
  const url = `${[domain, path].join('')}`;
  build.url = url;
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

const jobErrorMessage = (message = 'An unknown error occurred') => sanitizeCompleteJobErrorMessage(message);

const jobStateUpdate = (buildStatus, build, timestamp) => {
  const atts = {
    state: buildStatus.status,
  };

  if (buildStatus.status === 'error') {
    atts.error = jobErrorMessage(buildStatus.message);
  }

  if (['error', 'success'].includes(buildStatus.status)) {
    atts.completedAt = timestamp;
  }

  if (build.state === 'queued' && buildStatus.status === 'processing') {
    atts.startedAt = timestamp;
  }

  return build.update(atts);
};

const completeJobSiteUpdate = (build, completedAt) => {
  const { Site } = build.sequelize.models;
  return Site.update(
    { publishedAt: completedAt },
    { where: { id: build.site } }
  );
};

const getDomain = (site) => `${site.awsBucketName}.app.cloud.gov`;

const getPath = (build, site) => {
  if (build.branch === site.defaultBranch) {
    return `/site/${site.owner}/${site.repository}`;
  }
  if (build.branch === site.demoBranch) {
    return `/demo/${site.owner}/${site.repository}`;
  }
  return `/preview/${site.owner}/${site.repository}/${build.branch}`;
};

function urlWithSlash(rawUrl) {
  if (rawUrl && !rawUrl.endsWith('/')) {
    return `${rawUrl}/`;
  }
  return rawUrl;
}

function urlWithProtocol(rawUrl) {
    if (rawUrl && (!rawUrl.startsWith('https://') || !rawUrl.startsWith('http://'))) {
      rawUrl = `https://${rawUrl}`;
    }
  return rawUrl;
}
const viewLink = (build, site) => new Promise((resolve, reject) => {
  try {
    let link = build.url;
    if ((build.branch === site.defaultBranch) && site.domain) {
      link = site.domain;
    } else if ((build.branch === site.demoBranch) && site.demoDomain) {
     link = site.demoDomain;
    }

    link = urlWithSlash(link);
    link = urlWithProtocol(link);

    resolve(link);
  } catch (e) {
    reject(e);
  }
});

async function updateJobStatus(buildStatus) {
  const timestamp = new Date();
  const build = await jobStateUpdate(buildStatus, this, timestamp);
  if (build.state === 'success') {
    await completeJobSiteUpdate(build, timestamp);
  }
  return build;
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
    startedAt: {
      type: DataTypes.DATE,
    },
    url: {
      type: DataTypes.STRING,
      validate: validator.isURL,
    },
  }, {
    tableName: 'build',
    hooks: {
      afterCreate,
      beforeValidate,
      beforeCreate,
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

  Build.associate = associate;
  Build.prototype.updateJobStatus = updateJobStatus;
  Build.prototype.viewLink = viewLink;
  Build.viewLink = viewLink;
  return Build;
};
