const associate = ({
  Scan,
  Site,
  User,
}) => {
  Scan.belongsTo(User);
  Scan.belongsTo(Site)
};

const afterCreate = (scan) => {
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

module.exports = (sequelize, DataTypes) => {
  const Scan = sequelize.define('Scan', {
    site: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'siteAndDate',
    },
    user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    scannedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      unique: 'siteAndDate',
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    issueId: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: 'scan',
    hooks: {
      afterCreate,
    },
    indexes: [
      { unique: true, fields: ['((data#>>\'{TargetId,ScanId}\'))'] },
    ],
    paranoid: true,
  });

  Scan.associate = associate;
  return Scan;
};
