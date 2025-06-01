"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class DirectMessage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DirectMessage.belongsTo(models.User, {
        foreignKey: "senderId",
        as: "Sender",
      });
      DirectMessage.belongsTo(models.User, {
        foreignKey: "receiverId",
        as: "Receiver",
      });
    }
  }
  DirectMessage.init(
    {
      senderId: DataTypes.INTEGER,
      receiverId: DataTypes.INTEGER,
      text: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "DirectMessage",
      schema:
        process.env.NODE_ENV === "production" ? process.env.SCHEMA : undefined,
    }
  );
  return DirectMessage;
};
