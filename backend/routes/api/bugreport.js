// backend/routes/api/bugreport.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth.js");
const { BugReport, User } = require("../../db/models");

// Submit a bug report
router.post("/", requireAuth, async (req, res) => {
  const { userId, description } = req.body;
  const bug = await BugReport.create({ userId, description });
  res.json(bug);
});

// Resolve and reward
router.put("/:id/reward", requireAuth, async (req, res) => {
  const bug = await BugReport.findByPk(req.params.id);
  if (bug && !bug.rewardGiven) {
    bug.resolved = true;
    bug.rewardGiven = true;
    await bug.save();

    const user = await User.findByPk(bug.userId);
    user.coins += 10; // Reward 10 coins
    await user.save();

    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Already rewarded or not found" });
  }
});

module.exports = router;
