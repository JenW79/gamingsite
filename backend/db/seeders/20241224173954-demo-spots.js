'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; 
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     */
    options.tableName = 'Spots';
    await queryInterface.bulkInsert(
      options,
      [
        {
          ownerId: 1,
          address: '123 Ocean Drive',
          name: 'Beautiful Beach House',
          description: 'A lovely beach house with a stunning ocean view and private access to the beach.',
          city: 'Miami',
          state: 'Florida',
          country: 'USA',
          price: 200.52,
          lat: 25.7617,
          lng: -80.1918,
          avgRating: 4.5,
          previewImage: 'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_185652_xvldh4.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          ownerId: 2,
          address: '456 Mountain Road',
          name: 'Cozy Mountain Cabin',
          description: 'A warm and rustic cabin nestled in the Rocky Mountains, perfect for a weekend getaway.',
          city: 'Denver',
          state: 'Colorado',
          country: 'USA',
          price: 150.45,
          lat: 39.7392,
          lng: -104.9903,
          avgRating: 4.8,
          previewImage: 'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_185855_shmknn.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          ownerId: 3,
          address: '789 Fifth Avenue',
          name: 'Modern City Apartment',
          description: 'A sleek and modern apartment located in downtown Manhattan, close to all the attractions.',
          city: 'New York',
          state: 'New York',
          country: 'USA',
          price: 300.99,
          lat: 40.7128,
          lng: -74.0060,
          avgRating: 4.2,
          previewImage: 'https://res.cloudinary.com/dhxnqjcvf/image/upload/v1739062883/Screenshot_2025-02-08_190005_el8lbn.png',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     */
    options.tableName = 'Spots'; 
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        name: {
          [Op.in]: [
            'Beautiful Beach House',
            'Cozy Mountain Cabin',
            'Modern City Apartment',
          ],
        },
      },
      {}
    );
  },
};
