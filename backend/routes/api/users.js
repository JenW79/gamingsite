// backend/routes/api/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const jwt = require('jsonwebtoken');
const transporter = require('../../utils/mailer');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router()

const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email.'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.'),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  check('firstName')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('First Name is required.'),
  check('lastName')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Last Name is required.'),
  handleValidationErrors
];

//Signup
router.post(
  '/',
  validateSignup,
  async (req, res, next) => {
    const { firstName, lastName, email, username, password } = req.body;

    try {
      const hashedPassword = bcrypt.hashSync(password);

      const user = await User.create({
        firstName,
        lastName,
        email,
        username,
        hashedPassword
      });

      const safeUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      };

      await setTokenCookie(res, safeUser);

      return res.status(201).json({
        user: safeUser
      });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(500).json({
          message: 'User already exists',
          errors: {
            email: 'User with that email already exists',
            username: 'Username must be unique.'
          }
        });
      }
      next(err);
    }
  }
);
// PATCH /api/users/change-password
router.patch('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.scope(null).findByPk(req.user.id); // bypass defaultScope to get hashedPassword

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.hashedPassword.toString()
  );

  if (!isPasswordCorrect) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  const hashedNewPassword = bcrypt.hashSync(newPassword);
  user.hashedPassword = hashedNewPassword;
  await user.save();

  return res.json({ message: 'Password updated successfully' });
});

// POST /api/users/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.unscoped().findOne({ where: { email } });

  if (!user) {
    return res.status(200).json({ message: 'If that email exists, a reset link was sent.' }); // Don't reveal user presence
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Reset your password',
    html: `<p>Click the link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
  });

  return res.json({ message: 'If that email exists, a reset link was sent.' });
});

// POST /api/users/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.unscoped().findByPk(decoded.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    user.hashedPassword = bcrypt.hashSync(newPassword);
    await user.save();

    res.json({ message: 'Password reset successful. You may now log in.' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
});


module.exports = router;