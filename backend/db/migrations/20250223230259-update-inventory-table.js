"use strict";
let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn(
      "Inventories",
      "price",
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      options
    );

    await queryInterface.addColumn(
      "Inventories",
      "healAmount",
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      options
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("Inventories", "price", options);
    await queryInterface.removeColumn("Inventories", "healAmount", options);
  },
};
