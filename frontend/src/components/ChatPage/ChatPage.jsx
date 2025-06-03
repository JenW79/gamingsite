import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import ProfileModal from "../ProfileModal/ProfileModal";
import { fetchProfiles } from "../../store/profiles";
import { FaUserCircle } from "react-icons/fa"; 
import "./ChatPage.css";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modalUser, setModalUser] = useState(null);
  const messagesEndRef = useRef(null);
  const user = useSelector((state) => state.session.user);
  const profiles = useSelector((state) => state.profiles.list);
  const socket = useRef(null);
  const dispatch = useDispatch();

  // Fetch profiles on mount
  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  // WebSocket connection
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL  || "http://localhost:8000", {
      withCredentials: true,
      transports: ["websocket"],
    });
    console.log("🧪 VITE_SOCKET_URL at runtime:", import.meta.env.VITE_SOCKET_URL);


    socket?.current.on("chat history", (history) => {
      setMessages(history);
    });

    socket?.current.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.current.emit("chat message", {
        text: input,
        username: user?.username || "Guest",
        avatarUrl: user?.avatarUrl || null, 
      });
      setInput("");
    }
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
                onClick={() => {
                  const match =
                    profiles.find((p) => p.username === msg.username) ||
                    (user?.username === msg.username ? user : null);

                  setModalUser(
                    match || {
                      username: msg.username,
                      avatarUrl: msg.avatarUrl,
                      level: "N/A",
                      energy: "N/A",
                      cash: "N/A",
                      id: 0,
                    }
                  );
                }}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <FaUserCircle
                className="chat-avatar"
                onClick={() => {
                  const match =
                    profiles.find((p) => p.username === msg.username) ||
                    (user?.username === msg.username ? user : null);

                  setModalUser(
                    match || {
                      username: msg.username,
                      avatarUrl: null,
                      level: "N/A",
                      energy: "N/A",
                      cash: "N/A",
                      id: 0,
                    }
                  );
                }}
                style={{ cursor: "pointer", fontSize: "2.5rem", color: "#ccc" }}
              />
            )}

            <div className="chat-message-content">
              <strong>{msg.username}</strong> at{" "}
              {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}:
              <div>{msg.text}</div>
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
