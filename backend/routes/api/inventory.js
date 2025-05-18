const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User, Inventory } = require("../../db/models");

//Get ALL healing items
router.get("/healing-items", requireAuth, async (req, res) => {
  try {
    const healingItems = await Inventory.findAll({
      where: { userId: req.user.id, type: "potion" },
      attributes: ["id", "name", "healAmount", "quantity"],
    });

    res.json(healingItems);
  } catch (error) {
    console.error("Inventory Error:", error);
    res.status(500).json({ message: "Error fetching healing items." });
  }
});


//  Use a Healing Item
router.post("/use", requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found." });

    const item = await Inventory.findOne({ where: { id: itemId, userId: user.id } });
    if (!item) return res.status(404).json({ message: "Item not found in inventory." });

    if (item.type !== "potion" && item.healAmount <= 0) {
      return res.status(400).json({ message: "This item cannot be used for healing." });
    }

    //  Heal the Player (Up to Max HP)
    const maxHealth = 100;
    user.health = Math.min(user.health + item.healAmount, maxHealth);

    await user.save();

    //  Remove the Item from Inventory After Use
    if (item.quantity > 1) {
      item.quantity -= 1;
      await item.save();
    } else {
      await item.destroy();
    }

    res.json({ message: `You used ${item.name} and restored ${item.healAmount} HP!`, newHealth: user.health });
  } catch (error) {
    console.error("Healing Error:", error);
    res.status(500).json({ message: "Error using item." });
  }
});

module.exports = router;
