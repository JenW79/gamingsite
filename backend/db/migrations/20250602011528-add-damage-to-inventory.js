'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'Inventories',
      'damage',
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      options
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Inventories', 'damage', options);
  },
};
