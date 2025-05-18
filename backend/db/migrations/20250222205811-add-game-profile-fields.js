'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; 
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Users',
      'level',
      {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      options 
    );

    await queryInterface.addColumn(
      'Users',
      'experience',
      {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      options
    );

    await queryInterface.addColumn(
      'Users',
      'energy',
      {
        type: Sequelize.INTEGER,
        defaultValue: 100,
        allowNull: false,
      },
      options
    );

    await queryInterface.addColumn(
      'Users',
      'cash',
      {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.0,
        allowNull: false,
      },
      options
    );

    await queryInterface.addColumn(
      'Users',
      'health',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
      },
      options
    );

    await queryInterface.addColumn(
      'Users',
      'attack',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      options
    );

    await queryInterface.addColumn(
      'Users',
      'defense',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      options
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'level', options);
    await queryInterface.removeColumn('Users', 'experience', options);
    await queryInterface.removeColumn('Users', 'energy', options);
    await queryInterface.removeColumn('Users', 'cash', options);
    await queryInterface.removeColumn('Users', 'health', options);
    await queryInterface.removeColumn('Users', 'attack', options);
    await queryInterface.removeColumn('Users', 'defense', options);
  },
};
