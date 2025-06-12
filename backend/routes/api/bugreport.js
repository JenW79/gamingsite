const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth.js");
const { BugReport, User } = require("../../db/models");
const { Op } = require("sequelize");

// 🔧 Submit a bug report — auto rewards, limits to 1/day, filters junk
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { description } = req.body;

    // Basic gibberish / junk filter
    if (!description || description.length < 10 || /^[^a-zA-Z0-9\s]+$/.test(description)) {
      return res.status(400).json({ error: "Please enter a clear bug description." });
    }

    // Enforce 1 bug report per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const alreadySubmitted = await BugReport.findOne({
      where: {
        userId,
        createdAt: {
          [Op.gte]: startOfDay
        }
      }
    });
    if (alreadySubmitted) {
      return res.status(429).json({ error: "You've already submitted a bug today." });
    }

    // Create the report
    const bug = await BugReport.create({
      userId,
      description,
      resolved: false,
      rewardGiven: true
    });

    // Reward coins
    const user = await User.findByPk(userId);
    user.coins += 20;
    await user.save();

    res.json({ message: "Thanks for reporting! You earned 20 coins.", bug });
  } catch (err) {
    console.error("Bug report error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// 🛠 Admin tool — mark bug resolved and reward (if not already)
router.put("/:id/reward", requireAuth, async (req, res) => {
  try {
    const bug = await BugReport.findByPk(req.params.id);
    if (!bug || bug.rewardGiven) {
      return res.status(400).json({ error: "Already rewarded or not found." });
    }

    bug.resolved = true;
    bug.rewardGiven = true;
    await bug.save();

    const user = await User.findByPk(bug.userId);
    user.coins += 10;
    await user.save();

    res.json({ message: "Bug marked resolved. Coins rewarded again." });
  } catch (err) {
    console.error("Reward error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
