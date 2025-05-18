import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";
import "./ChatPage.css";

const socket = io("http://localhost:8000", {
  withCredentials: true,
});



export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const user = useSelector((state) => state.session.user);

  useEffect(() => {
    socket.on("chat history", (history) => setMessages(history));
    socket.on("chat message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off("chat history");
      socket.off("chat message");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit("chat message", {
        text: input,
        username: user?.username || "Guest",
        avatarUrl: user?.avatarUrl || null,
      });
      setInput("");
    }
  };

 return (
  <div className="chat-container">
    <h2>💬 Lobby Chat</h2>
    <div className="chat-messages">
      {messages.map((msg, idx) => (
        <div key={idx} className="chat-message">
          {msg.avatarUrl ? (
            <img src={msg.avatarUrl} alt="avatar" className="chat-avatar" />
          ) : (
            <div className="chat-avatar placeholder">👤</div>
          )}
          <div className="chat-message-content">
            <strong>{msg.username}</strong> at{" "}
            {new Date(msg.timestamp).toLocaleTimeString()}:
            <div>{msg.text}</div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
    <form onSubmit={handleSubmit} className="chat-form">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button type="submit">Send</button>
    </form>
  </div>
);
}
