const { Op } = require('sequelize');
const { branchRegex } = require('../utils/validators');

function associate({ Domain, SiteBranchConfig, Site }) {
  // Associations
  SiteBranchConfig.belongsTo(Site, {
    foreignKey: 'siteId',
    allowNull: false,
  });
  SiteBranchConfig.hasMany(Domain, {
    foreignKey: 'siteBranchConfigId',
  });

  // Scopes
  SiteBranchConfig.addScope('bySite', id => ({
    include: [
      {
        model: Site,
        where: { id },
      },
    ],
  }));
}

function define(sequelize, DataTypes) {
  const SiteBranchConfig = sequelize.define(
    'SiteBranchConfig',
    {
      branch: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: branchRegex,
        },
      },
      s3Key: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      context: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'preview',
      },
    },
    {
      tableName: 'site_branch_config',
      paranoid: true,
      indexes: [
        {
          name: 'site_branch_config_unique_site_id_branch_index',
          unique: true,
          fields: ['siteId', 'branch'],
        },
      ],
      validate: {
        nonPreviewBranchDefined() {
          if (this.context !== 'preview' && !this.branch) {
            throw new Error(
              'Branch attribute cannot be null when context attribute is not preview'
            );
          }
        },
        nonPreviewS3KeyDefined() {
          if (this.context !== 'preview' && !this.s3Key) {
            throw new Error(
              'The s3Key attribute cannot be null when context attribute is not preview'
            );
          }
        },
        isValidConfig() {},
      },
    }
  );

  SiteBranchConfig.associate = associate;
  SiteBranchConfig.siteScope = siteId => SiteBranchConfig.scope({ method: ['bySite', siteId] });
  SiteBranchConfig.getConfig = async (siteId, branch) => {
    const configs = await SiteBranchConfig.findAll({
      where: {
        siteId,
        [Op.or]: [
          {
            branch,
          },
          {
            context: 'preview',
          },
        ],
      },
    });

    return (
      configs.find(c => c.branch === branch)
      || configs.find(c => c.context === 'preview')
      || null
    );
  };

  return SiteBranchConfig;
}

module.exports = define;
