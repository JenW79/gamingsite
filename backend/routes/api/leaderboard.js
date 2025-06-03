const express = require('express');
const router = express.Router();
const { User } = require('../../db/models');

router.get('/', async (req, res, next) => {
  try {
    const topPlayers = await User.findAll({
      order: [['wins', 'DESC']],
      limit: 10,
      attributes: [
        'id',
        'username',
        'level',
        'wins',
        'losses',
        'avatarUrl',
        'energy',
        'cash'
      ],
    });

    res.json({ leaderboard: topPlayers });
  } catch (error) {
    next(error);
  }
});

module.exports = router;