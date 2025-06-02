// routes/api/dms.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { DirectMessage, User } = require("../../db/models");
const { Op } = require("sequelize");

router.get("/:userId", requireAuth, async (req, res) => {
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
      {
        model: User,
        as: "Sender",
        attributes: ["id", "username", "avatarUrl"],
      },
      {
        model: User,
        as: "Receiver",
        attributes: ["id", "username", "avatarUrl"],
      },
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
    return res
      .status(400)
      .json({ error: "Receiver ID and text are required." });
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

// GET /api/dms — Get recent convos for logged-in user
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const messages = await DirectMessage.findAll({
    where: {
      [Op.or]: [{ senderId: userId }, { receiverId: userId }],
    },
    include: [
      {
        model: User,
        as: "Sender",
        attributes: ["id", "username", "avatarUrl"],
      },
      {
        model: User,
        as: "Receiver",
        attributes: ["id", "username", "avatarUrl"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Group by otherUserId to get the latest message per thread
  const seen = new Set();
  const latestThreads = [];

  for (const msg of messages) {
    const otherUser = msg.senderId === userId ? msg.Receiver : msg.Sender;
    
    if (!seen.has(otherUser.id)) {
      seen.add(otherUser.id);
      latestThreads.push({ ...msg.toJSON(), otherUser });
    }
  }

  res.json(latestThreads);
});

// DELETE /api/dms/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const messageId = parseInt(req.params.id);

  const msg = await DirectMessage.findByPk(messageId);

  if (!msg) return res.status(404).json({ error: "Message not found." });
  console.log("Trying to delete msg:", {
      msgId: msg.id,
      msgSenderId: msg.senderId,
      currentUserId: userId,
    });

  // Only allow sender or receiver to delete
  if (msg.senderId !== userId && msg.receiverId !== userId) {
    return res
      .status(403)
      .json({ error: "Not authorized to delete this message." });
  }

  await msg.destroy();
  res.json({ message: "Message deleted." });
});

module.exports = router;
