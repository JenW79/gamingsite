const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User, Inventory, Combat } = require("../../db/models");
const { Op } = require("sequelize");

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
    const baseDamage = 1;
    const statDifference = Math.floor((attacker.attack - defender.defense) / 3);
    const randomBonus = Math.floor(Math.random() * 2);
    const damage = Math.max(baseDamage, statDifference + randomBonus);

    // Update defender health
    defender.health = Math.max(0, defender.health - damage);
    await defender.save();

    // Find or create combat
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

    // Update combat state
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

    // If defender is defeated
    if (defender.health <= 0) {
      combat.completed = true;

      // Win/loss
      attacker.wins += 1;
      defender.losses += 1;

      // XP + Level-up
      attacker.experience += 15;

      let leveledUp = false;
      while (
        attacker.level < 99 &&
        attacker.experience >=
          Math.floor(50 * Math.pow(attacker.level + 1, 1.5))
      ) {
        attacker.level += 1;
        attacker.attack += 1;
        attacker.defense += 1;
        attacker.maxHealth += 10;
        attacker.health = Math.min(attacker.health + 10, attacker.maxHealth);
        leveledUp = true;
      }

      // Combat rewards
      attacker.coins += 1;

      await attacker.save();
      await defender.save();

      combat.attackerXP = attacker.experience;
      combat.defenderXP = defender.experience;

      combat.log.push({
        action: "defeat",
        defeated: defender.username,
        by: attacker.username,
        xpEarned: 15,
        coinsEarned: 1,
        level: attacker.level,
        time: new Date().toISOString(),
      });

      if (leveledUp) {
        combat.log.push({
          action: "level-up",
          user: attacker.username,
          newLevel: attacker.level,
          gainedStats: {
            attack: "+1",
            defense: "+1",
            health: "+10",
          },
          time: new Date().toISOString(),
        });
      }
    }

    await combat.save();

    const io = req.app.get("io");

    if (combat.completed) {
      // Notify both players that combat ended
      io.to(`user:${attacker.id}`).emit("combatOver", {
        winnerId: attacker.id,
        loserId: defender.id,
        rewards: { xp: 15, coins: 1 },
      });

      io.to(`user:${defender.id}`).emit("combatOver", {
        winnerId: attacker.id,
        loserId: defender.id,
        wasDefeated: true,
      });
    }

    return res.json({
      message: `${attacker.username} attacked ${defender.username} for ${damage} damage!`,
      defenderHealth: defender.health,
      attackerXP: attacker.experience,
      attackerLevel: attacker.level,
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

router.post("/use-item", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const { itemId, targetId } = req.body;

    const item = await Inventory.findOne({
      where: { id: itemId, userId: user.id },
    });

    if (!item)
      return res
        .status(404)
        .json({ message: "Item not found in your inventory." });

    if (item.quantity < 1)
      return res
        .status(400)
        .json({ message: "You have no more of this item." });

    const target = await User.findByPk(targetId);
    if (!target)
      return res.status(404).json({ message: "Target player not found." });

    const combat = await Combat.findOne({
      where: {
        completed: false,
        [Op.or]: [
          { attackerId: user.id, defenderId: targetId },
          { attackerId: targetId, defenderId: user.id },
        ],
      },
    });

    const now = new Date().toISOString();
    let actionMessage = "";

    // OUT-OF-COMBAT HEALING SUPPORT
    if (!combat && item.type === "potion") {
      const healed = item.healAmount;
      const prevHealth = user.health;
      user.health = Math.min(user.health + healed, 100);
      await user.save();

      if (item.quantity > 1) {
        item.quantity -= 1;
        await item.save();
      } else {
        await item.destroy();
      }

      return res.json({
        message: `You used ${item.name} and healed ${healed} HP (out of combat).`,
        newHealth: user.health,
      });
    }

    if (!combat) {
      return res.status(404).json({ message: "No active combat found." });
    }

    //  Healing in combat
    if (item.type === "potion") {
      const healed = item.healAmount;
      const prevHealth = user.health;
      user.health = Math.min(user.health + healed, 100);
      await user.save();

      combat.log.push({
        action: "item-heal",
        user: user.username,
        item: item.name,
        amount: healed,
        before: prevHealth,
        after: user.health,
        time: now,
      });

      if (combat.attackerId === user.id) combat.attackerHP = user.health;
      else combat.defenderHP = user.health;

      actionMessage = `You used ${item.name} and healed ${healed} HP.`;
    }
    //  Damage items
    else if (item.damage > 0) {
      const prevHealth = target.health;
      target.health = Math.max(0, target.health - item.damage);
      await target.save();

      combat.log.push({
        action: "item-attack",
        user: user.username,
        target: target.username,
        item: item.name,
        damage: item.damage,
        before: prevHealth,
        after: target.health,
        time: now,
      });

      if (combat.attackerId === target.id) combat.attackerHP = target.health;
      else combat.defenderHP = target.health;

      actionMessage = `You used ${item.name} and dealt ${item.damage} damage.`;
    }
    //  Unsupported item
    else {
      return res
        .status(400)
        .json({ message: "This item cannot be used in combat." });
    }

    // Consume item
    if (item.quantity > 1) {
      item.quantity -= 1;
      await item.save();
    } else {
      await item.destroy();
    }

    await combat.save();

    return res.json({ message: actionMessage, updatedCombat: combat });
  } catch (error) {
    console.error("Item Use Error:", error);
    res.status(500).json({ message: "Error using item." });
  }
});

module.exports = router;
