const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Sequelize, Image, Review } = require('../../db/models');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

// Delete a review image
router.delete('/:reviewImageId', requireAuth, async (req, res, next) => {
  const { reviewImageId } = req.params;

  // Find the image by ID
  const image = await Image.findByPk(reviewImageId);

  if (!image) {
    const err = new Error("Review image couldn't be found");
    err.status = 404;
    return next(err);
  }

  // Find the associated review
  const review = await Review.findByPk(image.reviewId);

  if (!review || review.userId !== req.user.id) {
    const err = new Error('Unauthorized');
    err.status = 403;
    return next(err);
  }

  // Delete the image
  await image.destroy();
  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
