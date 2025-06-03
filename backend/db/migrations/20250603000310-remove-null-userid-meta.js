'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DELETE FROM "SequelizeMeta"
      WHERE name = '99999999999999-allow-null-userid-in-inventory.js';
    `);
  },

  async down() {
    // Nothing to undo here
  },
};
