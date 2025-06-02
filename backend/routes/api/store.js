const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User, Inventory } = require("../../db/models");

//  Get All Store Items
router.get("/", async (req, res) => {
  try {
    const items = await Inventory.findAll({
      where: { userId: null },
      attributes: ["id", "name", "type", "price", "healAmount"],
    });

    res.json(items);
  } catch (error) {
    console.error("Store Error:", error);
    res.status(500).json({ message: "Error fetching store items." });
  }
});

router.post("/buy", requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    //  Find item in store (must be store-owned)
    const item = await Inventory.findOne({
      where: { id: itemId, userId: null },
    });

    if (!item) return res.status(404).json({ message: "Item not found in store." });

    //  Check coin balance
    if (user.coins < item.price) {
      return res.status(400).json({ message: "Not enough coins to buy this item." });
    }

    //  Deduct coins
    user.coins -= item.price;
    await user.save();

    //  Check if user already has item
    const [ownedItem, created] = await Inventory.findOrCreate({
      where: {
        userId: user.id,
        name: item.name,
        type: item.type,
      },
      defaults: {
        quantity: 1,
        price: item.price,
        damage: item.damage,
        healAmount: item.healAmount,
      },
    });

    if (!created) {
      ownedItem.quantity += 1;
      await ownedItem.save();
    }

    return res.json({
      message: `You bought ${item.name}!`,
      newCoins: user.coins,
    });
  } catch (error) {
    console.error("Purchase Error:", error);
    res.status(500).json({ message: "Error processing purchase." });
  }
});


module.exports = router;
