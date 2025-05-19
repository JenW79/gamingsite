const { Server } = require("socket.io");
const { Message } = require("./db/models");

const onlineUsers = {}; // Track who is online by user ID

function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    console.log(" User connected:", socket.id);

    // Chat system
    const recentMessages = await Message.findAll({
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    const plainMessages = recentMessages.reverse().map((msg) => ({
      text: msg.text,
      username: msg.username,
      avatarUrl: msg.avatarUrl,
      timestamp: msg.createdAt,
    }));

    socket.emit("chat history", plainMessages);

    socket.on("chat message", async ({ text, username, avatarUrl }) => {
      const newMsg = await Message.create({
        text,
        username: username || "Anonymous",
        avatarUrl: avatarUrl || null,
      });

      io.emit("chat message", {
        text: newMsg.text,
        username: newMsg.username,
        avatarUrl: newMsg.avatarUrl,
        timestamp: newMsg.createdAt,
      });
    });

    // Combat system
    socket.on("register", (userId) => {
      onlineUsers[userId] = socket.id;
      console.log(`User ${userId} registered on socket ${socket.id}`);
    });

    socket.on("startFight", ({ attackerId, defenderId, fightId }) => {
      const defenderSocket = onlineUsers[defenderId];
      if (defenderSocket) {
        io.to(defenderSocket).emit("fightRequested", { attackerId, fightId });
        console.log(`⚔️ Fight started by ${attackerId} targeting ${defenderId}`);
      }
    });

    socket.on("attackMove", ({ attackerId, defenderId, damage }) => {
  const defenderSocket = onlineUsers[defenderId];
  const attackerSocket = onlineUsers[attackerId];

  // Notify the attacker — always
  if (attackerSocket) {
    io.to(attackerSocket).emit("attackConfirmed", { damage });
  }

  // Notify the defender — only if online
  if (defenderSocket) {
    io.to(defenderSocket).emit("receiveAttack", { attackerId, damage });
  }

  // Optional: Save damage to DB if you want offline HP persistence
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

      // You can add "item" logic here later
    });

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

