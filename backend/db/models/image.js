'use strict';
const { Model } = require('sequelize');

const { Image } = require('../models');

module.exports = (sequelize, DataTypes) => {
  class Image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Image.belongsTo(models.Spot, {
        foreignKey: 'spotId',
      });
      Image.belongsTo(models.Review, {
        foreignKey: 'reviewId',
        as: 'ReviewImages',
        onDelete: 'CASCADE',
      });
      Image.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'UserImages',
      });
    };
  }
  Image.init({
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    preview: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
  },
  {
    sequelize,
    modelName: 'Image',
    hooks: {
      beforeValidate(image) {
        if ((!image.spotId && !image.reviewId) || (image.spotId && image.reviewId)) {
          throw new Error('Image must belong to either a spot or a review, but not both.');
        }
      },
    },
    schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined,
  });

return Image;
};