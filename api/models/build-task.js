const crypto = require('crypto');
const URLSafeBase64 = require('urlsafe-base64');

const { buildEnum } = require('../utils');

const Statuses = buildEnum([
  'created',
  'queued',
  'tasked',
  'error',
  'processing',
  'skipped', // remove?
  'success',
]);

const associate = ({ BuildTask, Build, BuildTaskType }) => {
  BuildTask.belongsTo(Build, {
    foreignKey: 'buildId',
    allowNull: false,
  });
  BuildTask.belongsTo(BuildTaskType, {
    foreignKey: 'buildTaskTypeId',
    allowNull: false,
  });
  BuildTask.addScope('bySite', id => ({
    where: {
      '$Build.site$': id,
    },
    include: [
      {
        model: Build,
      },
      models.BuildTaskType
    ],
  }));
};

const generateToken = () => URLSafeBase64.encode(crypto.randomBytes(32));

const beforeValidate = (buildTask) => {
  const { token } = buildTask;
  buildTask.token = token || generateToken(); // eslint-disable-line no-param-reassign
};

module.exports = (sequelize, DataTypes) => {
  const BuildTask = sequelize.define(
    'BuildTask',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      artifact: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.ENUM,
        values: Statuses.values,
        defaultValue: Statuses.Created,
        allowNull: false,
        validate: {
          isIn: [Statuses.values],
        },
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
      },
      count: {
        type: DataTypes.INTEGER,
      },
    }, {
    tableName: 'build_task',
    paranoid: true,
    indexes: [
      {
        name: 'build_task_build_id_type_index',
        unique: true,
        fields: ['buildId', 'buildTaskTypeId'],
      },
    ],
    hooks: {
      beforeValidate,
    },
  }
  );

  BuildTask.generateToken = generateToken;
  BuildTask.associate = associate;
  BuildTask.siteScope = id => ({ method: ['bySite', id] });
  return BuildTask;
};
