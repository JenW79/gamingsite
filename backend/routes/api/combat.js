const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User, Inventory } = require("../../db/models");

const MAX_HEAL_USES = 2; //  Limit healing per fight
const HEAL_COOLDOWN = 2; // Turns before healing can be used again

const fightState = {};


router.post("/heal", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const { itemId, fightId } = req.body;
    const item = await Inventory.findOne({ where: { id: itemId, userId: user.id } });

    if (!item) return res.status(404).json({ message: "Healing item not found." });
    if (item.type !== "potion") return res.status(400).json({ message: "This item is not for healing." });

    // Initialize fight state if not tracked yet
    if (!fightState[fightId]) {
      fightState[fightId] = { healUses: 0, healCooldown: 0 };
    }

    // ✅ Check if healing is allowed
    if (fightState[fightId].healUses >= MAX_HEAL_USES) {
      return res.status(400).json({ message: "You've already used all healing charges in this fight!" });
    }

    if (fightState[fightId].healCooldown > 0) {
      return res.status(400).json({ message: `You must wait ${fightState[fightId].healCooldown} more turns before healing again.` });
    }

    // ✅ Apply Healing
    const maxHealth = 100;
    const healedAmount = item.healAmount;
    user.health = Math.max(1, Math.min(user.health + healedAmount, maxHealth));
    await user.save();

    // ✅ Deduct item quantity or remove if it's the last one
    if (item.quantity > 1) {
      item.quantity -= 1;
      await item.save();
    } else {
      await item.destroy();
    }

    // ✅ Update Fight State
    fightState[fightId].healUses += 1;
    fightState[fightId].healCooldown = HEAL_COOLDOWN; // Set cooldown turns

    res.json({
      message: `You used ${item.name} and restored ${item.healAmount} HP!`,
      newHealth: user.health,
      remainingHeals: MAX_HEAL_USES - fightState[fightId].healUses,
      healCooldown: fightState[fightId].healCooldown,
    });
  } catch (error) {
    console.error("Healing Error:", error);
    res.status(500).json({ message: "An error occurred while healing." });
  }
});

// ✅ Reduce Healing Cooldown Each Turn
router.post("/turn-end", requireAuth, async (req, res) => {
  try {
    const { fightId } = req.body;

    if (fightState[fightId] && fightState[fightId].healCooldown > 0) {
      fightState[fightId].healCooldown -= 1;
    }

    res.json({ message: "Turn ended. Cooldowns updated." });
  } catch (error) {
    console.error("Turn End Error:", error);
    res.status(500).json({ message: "Error updating turn state." });
  }
});



router.post("/attack", requireAuth, async (req, res) => {
  try {
    const attackerId = req.user.id;
    const { defenderId } = req.body;

    const attacker = await User.findByPk(attackerId);
    const defender = await User.findByPk(defenderId);

    if (!defender) {
      return res.status(404).json({ message: "Defender not found." });
    }

    if (attacker.health <= 0) {
      return res.status(400).json({ message: "You are too weak to fight!" });
    }

    if (defender.health <= 0) {
      return res.status(400).json({ message: "This player is already defeated!" });
    }

    //  Damage Calculation
    const baseDamage = Math.floor(Math.random() * 10) + 5;
    const attackPower = attacker.attack + baseDamage;
    const defensePower = defender.defense;
    let damage = attackPower - defensePower;
    damage = damage > 0 ? damage : 1;

    // Apply Damage
    defender.health -= damage;
    await defender.save();

    return res.json({
      message: `${attacker.username} attacked ${defender.username} for ${damage} damage!`,
      defenderHealth: defender.health,
    });

  } catch (error) {
    console.error("Attack Error:", error);
    return res.status(500).json({ message: "An error occurred during combat." });
  }
});

module.exports = router;
