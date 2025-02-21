const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { check, validationResult } = require('express-validator');
const { Sequelize, Image, Spot } = require('../../db/models');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

// Delete a spot image
router.delete('/:spotImageId', requireAuth, async (req, res, next) => {
  const { spotImageId } = req.params;

  const image = await Image.findByPk(spotImageId);

  if (!image) {
    const err = new Error("Spot image couldn't be found");
    err.status = 404;
    return next(err);
  }

  const spot = await Spot.findByPk(image.spotId);

  if (!spot || spot.ownerId !== req.user.id) {
    const err = new Error('Unauthorized');
    err.status = 403;
    return next(err);
  }

  await image.destroy();
  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
