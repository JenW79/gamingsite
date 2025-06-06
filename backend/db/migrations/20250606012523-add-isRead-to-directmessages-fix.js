"use strict";

let options = {};
if (process.env.NODE_ENV === "production" && process.env.SCHEMA) {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return await queryInterface.addColumn(
      "DirectMessages",
      "isRead",
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      options
    );
  },

  async down(queryInterface, Sequelize) {
    return await queryInterface.removeColumn("DirectMessages", "isRead", options);
  },
};
