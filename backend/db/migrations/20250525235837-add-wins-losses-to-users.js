'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     * */
    await queryInterface.addColumn(
      'Users',
      'wins',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      options
    );

     await queryInterface.addColumn(
      'Users',
      'losses',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      options
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Users', 'wins', options);
    await queryInterface.removeColumn('Users', 'losses', options);
  }
};
