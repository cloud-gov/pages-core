const associate = ({ Site, Build, User }) => {
  Site.hasMany(Build, {
    foreignKey: "site",
  })
  Site.belongsToMany(User, {
    through: "site_users__user_sites",
    foreignKey: "site_users",
    timestamps: false,
  })
}

module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define("Site", {
    config: {
      type: DataTypes.STRING,
    },
    defaultBranch: {
      type: DataTypes.STRING,
      defaultValue: "master",
    },
    domain: {
      type: DataTypes.STRING,
    },
    engine: {
      type: DataTypes.ENUM,
      values: ["jekyll", "hugo", "static"],
      defaultValue: "static",
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    publicPreview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    repository: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: "site",
    classMethods: {
      associate,
    },
  })

  return Site
}
