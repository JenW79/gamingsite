const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { User } = require("../../db/models");

// Get the current user's profile
router.get("/profile", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }, // Exclude sensitive fields
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.get("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "email",
        "avatarUrl",
        "location",
        "age",
        "sex",
        "relationshipStatus",
        "health",
        "level",
        "attack",
        "defense",
        "energy",
        "cash",
      ],
      exclude: ["hashedPassword"],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, avatarUrl } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate and update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (avatarUrl) user.avatarUrl = avatarUrl;

    await user.save();
    res.json({ message: "Profile updated successfully!", user });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
