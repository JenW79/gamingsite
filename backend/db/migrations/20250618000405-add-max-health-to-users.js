'use strict';

let options = {};
if (process.env.NODE_ENV === 'production' && process.env.SCHEMA) {
  options.schema = process.env.SCHEMA; // Enable Postgres schema for production
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    await queryInterface.addColumn(
      options,
      'maxHealth',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    options.tableName = 'Users';
    await queryInterface.removeColumn(options, 'maxHealth');
  },
};
