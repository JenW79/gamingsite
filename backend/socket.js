const { Server } = require("socket.io");
const { Message, DirectMessage, User } = require("./db/models");

const onlineUsers = {};

function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    console.log("🟢 User connected:", socket.id);

    // 🔹 Lobby Chat
    const recentMessages = await Message.findAll({
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    const plainMessages = await Promise.all(
      recentMessages.reverse().map(async (msg) => {
        let avatarUrl = msg.avatarUrl;

        // If missing, try to pull from User table
        if (!avatarUrl && msg.username) {
          const user = await User.findOne({
            where: { username: msg.username },
          });
          avatarUrl = user?.avatarUrl || null;
        }

        return {
          text: msg.text,
          username: msg.username,
          avatarUrl,
          timestamp: msg.createdAt,
        };
      })
    );

    socket.emit("chat history", plainMessages);

    socket.on("chat message", async ({ text, username }) => {
      const user = await User.findOne({ where: { username } });

      const newMsg = await Message.create({
        text,
        username,
        avatarUrl: user?.avatarUrl || null,
      });

      io.emit("chat message", {
        text: newMsg.text,
        username: newMsg.username,
        avatarUrl: user?.avatarUrl || null,
        timestamp: newMsg.createdAt,
      });
    });

    // 🔹 User Registration (for combat & DMs)
    socket.on("register", (userId) => {
      onlineUsers[userId] = socket.id;
      socket.join(`user:${userId}`); // Join a room for private messages
      console.log(`🧩 Registered user ${userId} on socket ${socket.id}`);
    });

    // 🔹 Direct Messages
    socket.on("private message", async ({ senderId, receiverId, text }) => {
      const msg = await DirectMessage.create({ senderId, receiverId, text });

      // Fetch full message with Sender and Receiver info
      const fullMsg = await DirectMessage.findByPk(msg.id, {
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
      });
      console.log("📤 Emitting to sender:", `user:${senderId}`);
      console.log("📤 Emitting to receiver:", `user:${receiverId}`);
      console.log("📤 Full message:", fullMsg);

      io.to(`user:${senderId}`).emit("private message", fullMsg);
      io.to(`user:${receiverId}`).emit("private message", fullMsg);

      console.log(` DM from ${senderId} ➡️ ${receiverId}: ${text}`);
    });

    // 🔹 Typing indicators
    socket.on("typing", ({ toUserId, fromUserId }) => {
      io.to(`user:${toUserId}`).emit("typing", { fromUserId });
    });

    socket.on("stop typing", ({ toUserId, fromUserId }) => {
      io.to(`user:${toUserId}`).emit("stop typing", { fromUserId });
    });

    // 🔹 Combat
    socket.on("startFight", ({ attackerId, defenderId, fightId }) => {
      const defenderSocket = onlineUsers[defenderId];
      if (defenderSocket) {
        io.to(defenderSocket).emit("fightRequested", { attackerId, fightId });
        console.log(
          `⚔️ Fight started by ${attackerId} targeting ${defenderId}`
        );
      }
    });

    socket.on("attackMove", ({ attackerId, defenderId, damage }) => {
      const defenderSocket = onlineUsers[defenderId];
      const attackerSocket = onlineUsers[attackerId];

      if (attackerSocket) {
        io.to(attackerSocket).emit("attackConfirmed", { damage });
      }
      if (defenderSocket) {
        io.to(defenderSocket).emit("receiveAttack", { attackerId, damage });
      }

      // Optional: Persist damage here
    });

    socket.on("healMove", ({ userId, targetId, healAmount, type }) => {
      const targetSocket = onlineUsers[targetId];
      const healerSocket = onlineUsers[userId];

      if (type === "manual") {
        if (healerSocket) {
          io.to(healerSocket).emit("manualHealConfirmed", { healAmount });
        }
        if (targetSocket && userId !== targetId) {
          io.to(targetSocket).emit("opponentHealed", { userId, healAmount });
        }
      }

      // Add item-based healing logic if needed
    });

    // 🔹 Cleanup on disconnect
    socket.on("disconnect", () => {
      for (const userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
          console.log(` User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

module.exports = setupSockets;
