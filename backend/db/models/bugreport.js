// backend/db/models/bugreport.js
module.exports = (sequelize, DataTypes) => {
  const BugReport = sequelize.define("BugReport", {
    userId: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rewardGiven: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
  BugReport.associate = (models) => {
    BugReport.belongsTo(models.User, { foreignKey: "userId" });
  };
  return BugReport;
};
