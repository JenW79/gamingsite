"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Combat extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Combat.belongsTo(models.User, {
        as: "attacker",
        foreignKey: "attackerId",
      });
      Combat.belongsTo(models.User, {
        as: "defender",
        foreignKey: "defenderId",
      });
    }
  }
  Combat.init(
    {
      attackerId: DataTypes.INTEGER,
      defenderId: DataTypes.INTEGER,
      attackerHP: DataTypes.INTEGER,
      defenderHP: DataTypes.INTEGER,
      attackerXP: DataTypes.INTEGER,
      defenderXP: DataTypes.INTEGER,
      log: DataTypes.JSONB,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Combat",
      schema:
        process.env.NODE_ENV === "production" ? process.env.SCHEMA : undefined,
    }
  );
  return Combat;
};
