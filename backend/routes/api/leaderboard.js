const express = require('express');
const router = express.Router();
const { User } = require('../../db/models');

// Get top players sorted by experience (or level, if preferred)
router.get('/', async (req, res, next) => {
  try {
    const topPlayers = await User.findAll({
      order: [['experience', 'DESC']], // change to 'level' if you prefer
      limit: 10, // top 10 players
      attributes: ['id', 'username', 'level', 'experience', 'energy', 'cash']
    });
    res.json({ leaderboard: topPlayers });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
