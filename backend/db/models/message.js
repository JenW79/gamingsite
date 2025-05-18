'use strict';

module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      schema: process.env.NODE_ENV === 'production' ? process.env.SCHEMA : undefined,
    }
  );

  return Message;
};
