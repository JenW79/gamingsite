const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Booking, Spot, User, Image } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const Sequelize = require('sequelize');

const router = express.Router();

// Get all bookings for the current user
router.get('/current', requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: {
        model: Spot,
        attributes: [
          'id',
          'ownerId',
          'address',
          'city',
          'state',
          'country',
          'lat',
          'lng',
          'name',
          'price',
        ],
        include: [
          {
            model: Image,
            as: 'SpotImages',
            attributes: ['url'], 
            where: { preview: true },
            required: false, 
          },
        ],
      },
    });

    // Format the response to match API docs
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      spotId: booking.spotId,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      Spot: {
        id: booking.Spot.id,
        ownerId: booking.Spot.ownerId,
        address: booking.Spot.address,
        city: booking.Spot.city,
        state: booking.Spot.state,
        country: booking.Spot.country,
        lat: booking.Spot.lat,
        lng: booking.Spot.lng,
        name: booking.Spot.name,
        price: booking.Spot.price,
        previewImage: booking.Spot.SpotImages[0]?.url || null,
      },
    }));

    res.json({ bookings: formattedBookings });
  } catch (err) {
    next(err);
  }
});

// Update an existing booking
router.put('/:bookingId', requireAuth, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { startDate, endDate } = req.body;

    // Find the booking by ID
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      const err = new Error("Booking couldn't be found");
      err.status = 404;
      return next(err);
    }

    // Check if the booking belongs to the current user
    if (booking.userId !== req.user.id) {
      const err = new Error('Unauthorized');
      err.status = 403;
      return next(err);
    }

    // Check if the booking is in the past
    const today = new Date();
    if (new Date(booking.endDate) < today) {
      const err = new Error('Past bookings cannot be modified');
      err.status = 400;
      return next(err);
    }

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
      where: {
        spotId: booking.spotId,
        id: { [Sequelize.Op.ne]: bookingId }, // Exclude the current booking
        [Sequelize.Op.or]: [
          {
            startDate: {
              [Sequelize.Op.between]: [startDate, endDate],
            },
          },
          {
            endDate: {
              [Sequelize.Op.between]: [startDate, endDate],
            },
          },
          {
            [Sequelize.Op.and]: [
              { startDate: { [Sequelize.Op.lte]: startDate } },
              { endDate: { [Sequelize.Op.gte]: endDate } },
            ],
          },
        ],
      },
    });

    if (overlappingBooking) {
      const err = new Error('Booking dates overlap with an existing booking');
      err.status = 403;
      return next(err);
    }

    // Update the booking
    booking.startDate = startDate;
    booking.endDate = endDate;
    await booking.save();

    // Return the updated booking
    res.json({
      id: booking.id,
      userId: booking.userId,
      spotId: booking.spotId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});


// Delete a booking
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the booking by ID
    const booking = await Booking.findByPk(id, {
      include: {
        model: Spot,
        attributes: ['ownerId'], // Include ownerId of the spot
      },
    });

    if (!booking) {
      const err = new Error("Booking couldn't be found");
      err.status = 404;
      return next(err);
    }

    const today = new Date();

    // Check if the booking is already started or in the past
    if (new Date(booking.startDate) <= today) {
      const err = new Error("Bookings that have started or are in the past cannot be deleted");
      err.status = 400;
      return next(err);
    }

    // Check if the user is authorized (owner of the booking or the spot)
    if (booking.userId !== req.user.id && booking.Spot.ownerId !== req.user.id) {
      const err = new Error('Unauthorized');
      err.status = 403;
      return next(err);
    }

    // Delete the booking
    await booking.destroy();
    res.json({ message: 'Successfully deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
