const { Server } = require("socket.io");
const { Message } = require("./db/models");

function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // match your frontend
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.id);

    // Fetch last 20 messages from DB
    const recentMessages = await Message.findAll({
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    // Convert to plain objects with clean timestamp
    const plainMessages = recentMessages.reverse().map((msg) => ({
      text: msg.text,
      username: msg.username,
      avatarUrl: msg.avatarUrl,
      timestamp: msg.createdAt,
    }));

    // Send to client
    socket.emit("chat history", plainMessages);
    console.log("📦 Emitting chat history to", socket.id, plainMessages);

    // Handle incoming chat messages
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

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = setupSockets;
