const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Spot, Image } = require('../../db/models');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const validateImage = [
  check('url')
    .exists({ checkFalsy: true })
    .withMessage('Image URL is required.'),
  check('preview')
    .isBoolean()
    .withMessage('Preview must be a boolean value.'),
  handleValidationErrors,
];

const router = express.Router();




// Delete an image (authenticated)
router.delete('/:id', requireAuth, async (req, res, next) => {
  const { id } = req.params;

  const image = await Image.findByPk(id);

  if (!image) {
    const err = new Error("Image couldn't be found");
    err.status = 404;
    return next(err);
  }

  if (image.userId !== req.user.id) {
    const err = new Error('Unauthorized');
    err.status = 403;
    return next(err);
  }

  await image.destroy();
  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
