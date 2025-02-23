'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('Users', 'level', {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    });
    await queryInterface.addColumn('Users', 'experience', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    });
    await queryInterface.addColumn('Users', 'energy', {
      type: Sequelize.INTEGER,
      defaultValue: 100,
      allowNull: false,
    });
    await queryInterface.addColumn('Users', 'cash', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0.00,
      allowNull: false,
    });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Users', 'level');
    await queryInterface.removeColumn('Users', 'experience');
    await queryInterface.removeColumn('Users', 'energy');
    await queryInterface.removeColumn('Users', 'cash');
  }
};
