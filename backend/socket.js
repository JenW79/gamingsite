// backend/socket.js
const { Server } = require("socket.io");
const { Message } = require("./db/models");

let messageHistory = [];

function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173", // match your frontend
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(" User connected:", socket.id);

    // Send message history
    socket.emit("chat history", messageHistory);

    // Receive message
    socket.on("chat message", ({ text, username, avatarUrl }) => {
      const newMsg = {
        text,
        username: username || "Anonymous",
        avatarUrl: avatarUrl || null,
        timestamp: new Date().toISOString(),
      };
      messageHistory.push(newMsg);
      if (messageHistory.length > 20) messageHistory.shift();

      io.emit("chat message", newMsg);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = setupSockets;
