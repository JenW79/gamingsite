'use strict';
const {
  Model
} = require('sequelize');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}


module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {
      Spot.hasMany(models.Image, { 
        foreignKey: 'spotId', 
        as: 'SpotImages', 
        onDelete: 'CASCADE', 
        hooks: true 
      });
      Spot.hasMany(models.Review, { 
        foreignKey: 'spotId', 
        onDelete: 'CASCADE', 
        as: 'Reviews',
        hooks: true 
      });
      Spot.belongsTo(models.User, { 
        foreignKey: 'ownerId', 
        as: 'Owner' 
      });
      }
    }

  Spot.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50],
        },
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lat: {
        type: DataTypes.FLOAT, 
        allowNull: true
      },
      lng: {
        type: DataTypes.FLOAT, 
        allowNull: true
      },
      description: DataTypes.TEXT,
      price: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      avgRating: {
        type: DataTypes.VIRTUAL,
        get() {
          const reviews = this.Reviews || [];
          if (reviews.length === 0) return null;
          return reviews.reduce((sum, review) => sum + review.stars, 0) / reviews.length;
        },
      },
      previewImage: {
        type: DataTypes.VIRTUAL,
        get() {
          const images = this.Images || [];
          const preview = images.find((image) => image.status === 'preview');
          return preview ? preview.url : null;
        },
      },
    }, 
    
    {
    sequelize,
    modelName: 'Spot',
    schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined,
  });
  return Spot;
};