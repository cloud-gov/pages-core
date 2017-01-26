const associate = ({ User, Build, Site }) => {
  User.hasMany(Build, {
    foreignKey: "user",
  })
  User.belongsToMany(Site, {
    through: "site_users__user_sites",
    foreignKey: "user_sites",
    timestamps: false,
  })
}

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    githubAccessToken: {
      type: DataTypes.STRING,
    },
    githubUserId: {
      type: DataTypes.STRING,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, {
    tableName: "user",
    classMethods: {
      associate,
    },
  })

  return User
}
