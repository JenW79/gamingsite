"use strict";
const { Model, Validator } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
    }
  }

  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [4, 30],
          isNotEmail(value) {
            if (Validator.isEmail(value)) {
              throw new Error("Cannot be an email.");
            }
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 256],
          isEmail: true,
        },
      },
      hashedPassword: {
        type: DataTypes.STRING.BINARY,
        allowNull: false,
        validate: {
          len: [60, 60],
        },
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Game-specific profile fields:
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      energy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      health: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
      attack: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
      defense: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },

      cash: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      coins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50,
      },

      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true, // Allow profile pictures
      },
      avatarPublicId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      age: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sex: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      relationshipStatus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      wins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      losses: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      maxHealth: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "User",
      defaultScope: {
        attributes: {
          exclude: ["hashedPassword", "email", "createdAt", "updatedAt"],
        },
      },
      schema:
        process.env.NODE_ENV === "production" ? process.env.SCHEMA : undefined,
    }
  );
  return User;
};
