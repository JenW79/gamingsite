'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; 
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "Users",
      "location",
      {
        type: Sequelize.STRING,
        allowNull: true,
      },
      options
    );
    await queryInterface.addColumn(
      "Users",
      "age",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      options
    );
    await queryInterface.addColumn(
      "Users",
      "sex",
      {
        type: Sequelize.STRING,
        allowNull: true,
      },
      options
    );
    await queryInterface.addColumn(
      "Users",
      "relationshipStatus",
      {
        type: Sequelize.STRING,
        allowNull: true,
      },
      options
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "location", options);
    await queryInterface.removeColumn("Users", "age", options);
    await queryInterface.removeColumn("Users", "sex", options);
    await queryInterface.removeColumn("Users", "relationshipStatus", options);
  },
};
