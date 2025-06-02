const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User, Inventory } = require("../../db/models");

// Get player's game stats and inventory
router.get("/:userId", requireAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "level",
        "experience",
        "energy",
        "cash",
        "health",
        "attack",
        "defense",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const inventory = await Inventory.findAll({
      where: { userId },
      attributes: ["id", "name", "type", "quantity", "healAmount", "damage"],
    });

    res.json({ stats: user, inventory });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
