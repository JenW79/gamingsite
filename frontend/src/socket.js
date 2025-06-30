// src/socket.js
import { io } from "socket.io-client";

let socket;

export function initSocket(userId) {
  if (!socket || !socket.connected) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
      if (userId) {
        socket.emit("register", userId);
      }
    });

    socket.on("disconnect", () => {
      console.warn("🔌 Socket disconnected.");
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🧹 Socket manually disconnected.");
  }
}
