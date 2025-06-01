const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User, Inventory, Combat } = require("../../db/models");
const { Op } = require("sequelize");

// -----------------------------------
// Heal with item (booster logic)
// -----------------------------------
router.post("/heal", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const { itemId } = req.body;
    const item = await Inventory.findOne({
      where: { id: itemId, userId: user.id },
    });

    if (!item)
      return res.status(404).json({ message: "Healing item not found." });

    if (item.type !== "potion")
      return res.status(400).json({ message: "This item is not for healing." });

    const maxHealth = 100;
    const healedAmount = item.healAmount;
    const prevHealth = user.health;
    user.health = Math.min(user.health + healedAmount, maxHealth);
    await user.save();

    // Update item quantity or delete it
    if (item.quantity > 1) {
      item.quantity -= 1;
      await item.save();
    } else {
      await item.destroy();
    }

    // Optional: record in combat log if there's an active combat
    const combat = await Combat.findOne({
      where: {
        completed: false,
        [Op.or]: [{ attackerId: user.id }, { defenderId: user.id }],
      },
    });

    if (combat) {
      if (combat.attackerId === user.id) {
        combat.attackerHP = user.health;
      } else {
        combat.defenderHP = user.health;
      }

      combat.log.push({
        action: "item-heal",
        user: user.username,
        amount: healedAmount,
        before: prevHealth,
        after: user.health,
        time: new Date().toISOString(),
      });

      await combat.save();
    }

    res.json({
      message: `You used ${item.name} and restored ${healedAmount} HP!`,
      newHealth: user.health,
    });
  } catch (error) {
    console.error("Healing Error:", error);
    res.status(500).json({ message: "An error occurred while healing." });
  }
});

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

// -----------------------------------
// Persistent combat attack
// -----------------------------------
router.post("/attack", requireAuth, async (req, res) => {
  try {
    const attackerId = req.user.id;
    const { defenderId } = req.body;

    if (attackerId === parseInt(defenderId))
      return res.status(400).json({ message: "You can't fight yourself!" });

    const attacker = await User.findByPk(attackerId);
    const defender = await User.findByPk(defenderId);

    if (!attacker || !defender)
      return res.status(404).json({ message: "User not found." });

    if (attacker.health <= 0)
      return res.status(400).json({ message: "You are too weak to fight!" });

    if (defender.health <= 0)
      return res
        .status(400)
        .json({ message: "This player is already defeated!" });

    // Damage calculation
    const baseDamage = Math.floor(Math.random() * 10) + 5;
    const attackPower = attacker.attack + baseDamage;
    const defensePower = defender.defense;
    const damage = Math.max(1, attackPower - defensePower);

    // Update defender health
    defender.health = Math.max(0, defender.health - damage);
    await defender.save();

    // Find or create combat session
    let combat = await Combat.findOne({
      where: {
        completed: false,
        [Op.or]: [
          { attackerId, defenderId },
          { attackerId: defenderId, defenderId: attackerId },
        ],
      },
    });

    if (!combat) {
      combat = await Combat.create({
        attackerId,
        defenderId,
        attackerHP: attacker.health,
        defenderHP: defender.health,
        attackerXP: 0,
        defenderXP: 0,
        log: [],
        completed: false,
      });
    }

    // Update log and HP state
    combat.defenderHP = defender.health;
    combat.log = [
      ...(combat.log || []),
      {
        turn: new Date().toISOString(),
        action: "attack",
        attacker: attacker.username,
        damage,
      },
    ];

    if (defender.health <= 0) {
      combat.completed = true;

      // Update win/loss record
      attacker.wins += 1;
      defender.losses += 1;

      // Optional rewards
      attacker.experience += 15;
      attacker.cash = parseFloat(attacker.cash) + 50.0;

      // Save user updates
      await attacker.save();
      await defender.save();

      // Log outcome
      combat.log.push({
        action: "defeat",
        defeated: defender.username,
        by: attacker.username,
        time: new Date().toISOString(),
        xpEarned: 15,
        cashEarned: 50,
      });
    }

    await combat.save();

    return res.json({
      message: `${attacker.username} attacked ${defender.username} for ${damage} damage!`,
      defenderHealth: defender.health,
    });
  } catch (error) {
    console.error("Attack Error:", error);
    return res
      .status(500)
      .json({ message: "An error occurred during combat." });
  }
});

// -----------------------------------
// Resume fight if in progress
// -----------------------------------
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const combat = await Combat.findOne({
      where: {
        completed: false,
        [Op.or]: [{ attackerId: userId }, { defenderId: userId }],
      },
      include: [
        {
          model: User,
          as: "attacker",
          attributes: ["id", "username", "avatarUrl", "health"],
        },
        {
          model: User,
          as: "defender",
          attributes: ["id", "username", "avatarUrl", "health"],
        },
      ],
    });

    if (!combat) {
      return res.status(404).json({ message: "No active combat found." });
    }

    res.json(combat);
  } catch (err) {
    console.error("Error loading combat:", err);
    res.status(500).json({ message: "Failed to load combat." });
  }
});

router.post("/manual-heal", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const healAmount = 10; // base recovery
    const maxHealth = 100;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.health = Math.min(user.health + healAmount, maxHealth);
    await user.save();

    const combat = await Combat.findOne({
      where: {
        completed: false,
        [Op.or]: [{ attackerId: userId }, { defenderId: userId }],
      },
    });

    if (combat) {
      // Update combat state
      if (combat.attackerId === userId) {
        combat.attackerHP = user.health;
      } else {
        combat.defenderHP = user.health;
      }

      combat.log.push({
        turn: new Date().toISOString(),
        action: "heal",
        user: user.username,
        amount: healAmount,
      });

      await combat.save();
    }

    return res.json({
      message: `You recovered ${healAmount} HP!`,
      newHealth: user.health,
    });
  } catch (error) {
    console.error("Manual Heal Error:", error);
    return res.status(500).json({ message: "Failed to heal." });
  }
});

module.exports = router;
