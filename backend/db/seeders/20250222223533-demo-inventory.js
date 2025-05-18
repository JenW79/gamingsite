'use strict';

const { User } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const options = { tableName: 'Inventories' };
    if (process.env.NODE_ENV === 'production') {
      options.schema = process.env.SCHEMA;
    }

    const demoUser = await User.findOne({ where: { username: 'Demo-lition' } });
    const user2 = await User.findOne({ where: { username: 'FakeUser2' } });

    if (!demoUser || !user2) {
      throw new Error("Required users not found. Seed users before inventories.");
    }

    return queryInterface.bulkInsert(
      options,
      [
        {
          userId: demoUser.id,
          name: 'Iron Sword',
          type: 'weapon',
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: demoUser.id,
          name: 'Health Potion',
          type: 'potion',
          quantity: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: user2.id,
          name: 'Steel Shield',
          type: 'armor',
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    const options = { tableName: 'Inventories' };
    if (process.env.NODE_ENV === 'production') {
      options.schema = process.env.SCHEMA;
    }

    return queryInterface.bulkDelete(options, null, {});
  },
};