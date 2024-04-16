const crypto = require('crypto');
const { Op } = require('sequelize');

const URLSafeBase64 = require('urlsafe-base64');

const { buildEnum } = require('../utils');
const BuildTaskQueue = require('../services/BuildTaskQueue');

const Statuses = buildEnum([
  'created',
  'queued',
  'error',
  'processing',
  'success',
]);

const associate = ({
  BuildTask,
  Build,
  BuildTaskType,
  Site,
}) => {
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
      BuildTaskType,
      {
        model: Build,
        required: true,
        include: [
          { model: Site, required: true },
        ],
      },
    ],
  }));
  BuildTask.addScope('byStartsWhen', startsWhen => ({
    where: {
      '$BuildTaskType.startsWhen$': startsWhen,
    },
    include: BuildTaskType,
  }));
};

const generateToken = () => URLSafeBase64.encode(crypto.randomBytes(32));

const beforeValidate = (buildTask) => {
  const { token } = buildTask;
  buildTask.token = token || generateToken(); // eslint-disable-line no-param-reassign
};

async function enqueue() {
  const buildTask = this;
  const {
    BuildTask,
    BuildTaskType,
    Build,
    Site,
  } = this.sequelize.models;

  const fullBuildTask = await BuildTask.findByPk(buildTask.id, {
    include: [
      { model: BuildTaskType, required: true },
      { model: Build, required: true, include: [{ model: Site, required: true }] },
    ],
  });

  // higher number priority (lower actual priority) is given to tasks whose site
  // has more running (non-error/success) tasks already
  // https://docs.bullmq.io/guide/jobs/prioritized
  const { count: priority } = await BuildTask.findAndCountAll({
    where: {
      [Op.and]: [
        { '$Build.site$': fullBuildTask.Build.Site.id },
        {
          status: {
            [Op.notIn]: [
              BuildTask.Statuses.Error,
              BuildTask.Statuses.Success,
            ],
          },
        },
      ],
    },
    include: { model: Build, required: true },
  });

  await BuildTaskQueue.sendTaskMessage(fullBuildTask, priority);
  await this.update({ status: Statuses.Queued });
}

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
    },
    {
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
  BuildTask.Statuses = Statuses;
  BuildTask.siteScope = id => ({ method: ['bySite', id] });
  BuildTask.byStartsWhen = startsWhen => BuildTask.scope({ method: ['byStartsWhen', startsWhen] });
  BuildTask.prototype.enqueue = enqueue;
  return BuildTask;
};
