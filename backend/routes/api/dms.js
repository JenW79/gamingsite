// routes/api/dms.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { DirectMessage, User } = require("../../db/models");
const { Op } = require("sequelize");

router.get("/:userId", async (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = parseInt(req.params.userId);

  const messages = await DirectMessage.findAll({
    where: {
      [Op.or]: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    },
    include: [
      { model: User, as: "Sender", attributes: ["id", "username", "avatarUrl"] },
      { model: User, as: "Receiver", attributes: ["id", "username", "avatarUrl"] },
    ],
    order: [["createdAt", "ASC"]],
  });

  res.json(messages);
});

// Create a new direct message
router.post("/", requireAuth, async (req, res) => {
  const { receiverId, text } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !text) {
    return res.status(400).json({ error: "Receiver ID and text are required." });
  }

  try {
    const message = await DirectMessage.create({
      senderId,
      receiverId,
      text,
    });

    const sender = await User.findByPk(senderId, {
      attributes: ["id", "username", "avatarUrl"],
    });

    const receiver = await User.findByPk(receiverId, {
      attributes: ["id", "username", "avatarUrl"],
    });

    res.status(201).json({
      ...message.toJSON(),
      Sender: sender,
      Receiver: receiver,
    });
  } catch (error) {
    console.error("Error creating direct message:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

module.exports = router;