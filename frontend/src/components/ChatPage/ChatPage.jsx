import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initSocket, getSocket, disconnectSocket } from "../../socket";
import ProfileModal from "../ProfileModal/ProfileModal";
import { fetchProfiles } from "../../store/profiles";
import { FaUserCircle } from "react-icons/fa";
import "./ChatPage.css";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modalUser, setModalUser] = useState(null);
  const messagesEndRef = useRef(null);
  const dispatch = useDispatch();

  const user = useSelector((state) => state.session.user);
  const profiles = useSelector((state) => state.profiles.list);

  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;

    const socket = initSocket(user.id);

    socket.on("chat history", (history) => setMessages(history));
    socket.on("chat message", (msg) => setMessages((prev) => [...prev, msg]));

    return () => disconnectSocket();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const socket = getSocket();
    socket?.emit("chat message", {
      text: input,
      username: user?.username || "Guest",
      avatarUrl: user?.avatarUrl || null,
    });

    setInput("");
  };

  const openUserModal = async (msg) => {
    let match =
      profiles.find((p) => p.username === msg.username) ||
      (user?.username === msg.username ? user : null);

    if (!match && msg.username) {
      try {
        const res = await fetch(`/api/profiles/username/${msg.username}`);
        if (res.ok) match = await res.json();
      } catch (e) {
        console.warn("Profile fetch failed", e);
      }
    }

    setModalUser({
      id: match?.id || 0,
      username: match?.username || msg.username,
      avatarUrl: match?.avatarUrl || msg.avatarUrl || null,
      level: match?.level ?? 1,
      energy: match?.energy ?? 100,
      cash: match?.cash ?? 0,
    });
  };

  if (!user) return <div className="chat-loading">Loading chat...</div>;

  return (
    <div className="chat-container">
      <h2>💬 Lobby Chat</h2>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message">
            {msg.avatarUrl ? (
              <img
                src={msg.avatarUrl}
                alt="avatar"
                className="chat-avatar"
                onClick={() => openUserModal(msg)}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <FaUserCircle
                className="chat-avatar"
                onClick={() => openUserModal(msg)}
                style={{ cursor: "pointer", fontSize: "2.5rem", color: "#ccc" }}
              />
            )}

            <div className="chat-message-content">
              <strong>{msg.username}</strong> at{" "}
              {msg.timestamp
                ? new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Just now"}
              :<div>{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {modalUser && (
        <ProfileModal user={modalUser} onClose={() => setModalUser(null)} />
      )}

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
