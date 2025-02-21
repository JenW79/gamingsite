'use strict';
const { Op } = require('sequelize');
let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // Specify schema in production
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    options.tableName = 'Images';
    await queryInterface.bulkInsert(
      options,
      [
        {
          userId: 1,
          spotId: 1,
          reviewId: null,
          url: 'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_185652_xvldh4.png',
          status: 'active',
          preview: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 2,
          spotId: 2,
          reviewId: null,
          url: 'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_185855_shmknn.png',
          status: 'active',
          preview: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: 3,
          spotId: 3,
          reviewId: null,
          url: 'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_190005_el8lbn.png',
          status: 'active',
          preview: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Images';
    await queryInterface.bulkDelete(options, {
      url: {
        [Op.in]: [
          'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_185652_xvldh4.png',
          'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_190005_el8lbn.png',
          'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_185855_shmknn.png',
        ],
      },
    });
  }
};
