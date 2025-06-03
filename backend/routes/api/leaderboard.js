router.get('/', async (req, res, next) => {
  try {
    const topPlayers = await User.findAll({
      order: [['wins', 'DESC']], // or use 'level' or 'experience' if preferred
      limit: 10,
      attributes: [
        'id',
        'username',
        'level',
        'wins',
        'losses',
        'avatarUrl',
        'energy'
      ],
    });

    res.json({ leaderboard: topPlayers });
  } catch (error) {
    next(error);
  }
});
