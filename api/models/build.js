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
    SQS.sendBuildMessage(foundBuild);
  });
};

const associate = ({ Build, BuildLog, Site, User }) => {
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

const completeJobErrorMessage = (err) => {
  let message = 'An unknown error occurred';
  if (err) {
    message = err.message || err;
  }
  return sanitizeCompleteJobErrorMessage(message);
};

const completeJobStateUpdate = (err, build, completedAt) => {
  if (err) {
    return build.update({
      state: 'error',
      error: completeJobErrorMessage(err),
      completedAt,
    });
  }
  return build.update({
    state: 'success',
    error: '',
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

function completeJob(err) {
  const completedAt = new Date();

  return completeJobStateUpdate(err, this, completedAt)
    .then(build => completeJobSiteUpdate(build, completedAt)
    .then(() => build));
}

function toJSON() {
  const object = Object.assign({}, this.get({
    plain: true,
  }));

  object.createdAt = object.createdAt.toISOString();
  object.updatedAt = object.updatedAt.toISOString();
  if (object.completedAt) {
    object.completedAt = object.completedAt.toISOString();
  }
  Object.keys(object).forEach((key) => {
    if (object[key] === null) {
      delete object[key];
    }
  });
  delete object.token;
  return object;
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
      values: ['error', 'processing', 'skipped', 'success'],
      defaultValue: 'processing',
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
  });

  return Build;
};
