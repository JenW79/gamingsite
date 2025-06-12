/// backend/routes/api/index.js
const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const profilesRouter = require('./profiles.js');
const leaderboardRouter = require('./leaderboard');
const gameRouter = require('./game');
const combatRouter = require("./combat.js");
const inventoryRouter = require("./inventory.js");
const storeRouter = require("./store.js");
const uploadRouter = require("./upload.js");
const dmsRouter = require("./dms.js");
const bugReportRouter = require("./bugreport.js");




const { restoreUser } = require("../../utils/auth.js");

// Connect restoreUser middleware to the API router
  // If current user session is valid, set req.user to the user in the database
  // If current user session is not valid, set req.user to null
router.use(restoreUser);

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.use('/profiles', profilesRouter);

router.use('/leaderboard', leaderboardRouter);

router.use('/game', gameRouter);

router.use("/combat", combatRouter); 

router.use("/inventory", inventoryRouter); 

router.use("/store", storeRouter); 

router.use('/upload', uploadRouter);

router.use('/dms', dmsRouter);

router.use('/bugreport', bugReportRouter);

router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

router.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

module.exports = router;