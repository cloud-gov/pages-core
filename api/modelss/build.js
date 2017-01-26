const associate = ({ Build, BuildLog, Site, User }) => {
  Build.hasMany(BuildLog, {
    foreignKey: "build",
  })
  Build.belongsTo(Site, {
    foreignKey: "site",
    allowNull: false,
  })
  Build.belongsTo(User, {
    foreignKey: "user",
    allowNull: false,
  })
}

module.exports = (sequelize, DataTypes) => {
  const Build = sequelize.define("Build", {
    branch: {
      type: DataTypes.STRING,
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
      values: ["error", "processing", "skipped", "success"],
      defaultValue: "processing",
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: "build",
    classMethods: {
      associate,
    },
  })

  return Build
}
