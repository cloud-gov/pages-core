const associate = ({ BuildLog, Build }) => {
  BuildLog.belongsTo(Build, {
    foreignKey: "build",
    allowNull: false,
  })
}

module.exports = (sequelize, DataTypes) => {
  const BuildLog = sequelize.define("BuildLog", {
    output: {
      type: DataTypes.STRING,
    },
    source: {
      type: DataTypes.STRING,
    },
  }, {
    tableName: "buildlog",
    classMethods: {
      associate,
    },
  })

  return BuildLog
}
