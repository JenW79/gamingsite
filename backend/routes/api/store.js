const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User, Inventory } = require("../../db/models");

// ✅ Get All Store Items
router.get("/", async (req, res) => {
  try {
    const items = await Inventory.findAll({
      attributes: ["id", "name", "type", "price", "healAmount"],
    });

    res.json(items);
  } catch (error) {
    console.error("Store Error:", error);
    res.status(500).json({ message: "Error fetching store items." });
  }
});

// ✅ Buy an Item
router.post("/buy", requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found." });

    const item = await Inventory.findByPk(itemId);
    if (!item) return res.status(404).json({ message: "Item not found." });

    if (user.cash < item.price) {
      return res.status(400).json({ message: "Not enough cash to buy this item." });
    }

    // ✅ Deduct Cash & Add Item to Player's Inventory
    user.cash -= item.price;
    await user.save();

    await Inventory.create({
      userId: user.id,
      name: item.name,
      type: item.type,
      price: item.price,
      healAmount: item.healAmount,
    });

    res.json({ message: `You bought ${item.name}!`, newCash: user.cash });
  } catch (error) {
    console.error("Purchase Error:", error);
    res.status(500).json({ message: "Error buying item." });
  }
});

module.exports = router;
