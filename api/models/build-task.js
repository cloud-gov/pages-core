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

const associate = ({ BuildTask, Build }) => {
  BuildTask.belongsTo(Build, {
    foreignKey: 'buildId',
    allowNull: false,
  });
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

  return BuildTask;
};
