'use strict';
let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Combats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      attackerId: {
        type: Sequelize.INTEGER
      },
      defenderId: {
        type: Sequelize.INTEGER
      },
      attackerHP: {
        type: Sequelize.INTEGER
      },
      defenderHP: {
        type: Sequelize.INTEGER
      },
      attackerXP: {
        type: Sequelize.INTEGER
      },
      defenderXP: {
        type: Sequelize.INTEGER
      },
      log: {
        type: Sequelize.JSONB
      },
      completed: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }
    , options);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Combats', options);
  }
};