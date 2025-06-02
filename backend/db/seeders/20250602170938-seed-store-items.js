'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const options = { tableName: 'Inventories' };
    if (process.env.NODE_ENV === 'production') {
      options.schema = process.env.SCHEMA;
    }

    const items = [
      {
        userId: null,
        name: 'Iron Sword',
        type: 'weapon',
        quantity: 9999,
        damage: 35,
        price: 50,
        healAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: null,
        name: 'Health Potion',
        type: 'potion',
        quantity: 9999,
        damage: 0,
        price: 10,
        healAmount: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: null,
        name: 'Steel Shield',
        type: 'armor',
        quantity: 9999,
        damage: 0,
        price: 40,
        healAmount: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

  },

  async down(queryInterface, Sequelize) {
    const options = { tableName: 'Inventories' };
    if (process.env.NODE_ENV === 'production') {
      options.schema = process.env.SCHEMA;
    }

    return queryInterface.bulkDelete(options, { userId: null });
  },
};

