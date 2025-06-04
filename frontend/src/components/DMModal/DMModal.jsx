import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import ProfileModal from "../ProfileModal/ProfileModal";
import "./DMpage.css";

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
}

export default function DMModal({ showDM, handleClose, initialUserId = null }) {
  const currentUser = useSelector((state) => state.session.user);
  const { userId } = useParams();
  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const messagesEndRef = useRef(null);
  const socket = useRef(null);

  useEffect(() => {
    if (currentUser) {
      socket.current = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000", {
        withCredentials: true,
        transports: ["websocket"],
      });

      socket.current.on("connect", () => {
        socket.current.emit("register", currentUser.id);
      });
    }

    return () => {
      socket.current?.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!socket.current) return;

    const handleMessage = (msg) => {
      const otherUser =
        msg.senderId === currentUser.id
          ? msg.Receiver ?? { id: msg.receiverId, username: "Unknown", avatarUrl: null }
          : msg.Sender ?? { id: msg.senderId, username: "Unknown", avatarUrl: null };

      setConvos((prev) => {
        const exists = prev.find((c) => c.otherUser.id === otherUser.id);
        if (exists) {
          return prev.map((c) =>
            c.otherUser.id === otherUser.id ? { ...msg, otherUser, text: msg.text } : c
          );
        }
        return [{ ...msg, otherUser, text: msg.text }, ...prev];
      });

      const isActive =
        activeUserId &&
        (msg.senderId === activeUserId || msg.receiverId === activeUserId);

      if (isActive) setMessages((prev) => [...prev, msg]);
    };

    socket.current.on("private message", handleMessage);
    socket.current.on("typing", ({ fromUserId }) => {
      if (fromUserId === activeUserId) setOtherTyping(true);
    });
    socket.current.on("stop typing", ({ fromUserId }) => {
      if (fromUserId === activeUserId) setOtherTyping(false);
    });

    return () => {
      socket.current.off("private message", handleMessage);
      socket.current.off("typing");
      socket.current.off("stop typing");
    };
  }, [activeUserId, currentUser.id]);

  useEffect(() => {
    fetch("/api/dms", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setConvos(data));
  }, []);

  useEffect(() => {
  if (initialUserId && showDM) {
    loadChat(initialUserId);
  }
}, [initialUserId, showDM]);

  const loadChat = async (userIdToLoad) => {
    setActiveUserId(userIdToLoad);
    const res = await fetch(`/api/dms/${userIdToLoad}`, { credentials: "include" });
    const data = await res.json();
    setMessages(data);
  };

  useEffect(() => {
    if (userId) loadChat(parseInt(userId));
  }, [userId]);

  const handleSend = () => {
    if (!newMessage.trim() || !socket.current?.connected) return;

    socket.current.emit("private message", {
      senderId: currentUser.id,
      receiverId: activeUserId,
      text: newMessage,
    });

    setNewMessage("");

    socket.current.emit("stop typing", {
      toUserId: activeUserId,
      fromUserId: currentUser.id,
    });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!typing) {
      setTyping(true);
      socket.current.emit("typing", {
        toUserId: activeUserId,
        fromUserId: currentUser.id,
      });
    }

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setTyping(false);
      socket.current.emit("stop typing", {
        toUserId: activeUserId,
        fromUserId: currentUser.id,
      });
    }, 1000);
  };

  const handleDelete = async (msgId) => {
    const csrfToken = getCsrfToken();
    const res = await fetch(`/api/dms/${msgId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    });

    if (res.ok) {
      await loadChat(activeUserId);
      const updated = await fetch("/api/dms", { credentials: "include" });
      setConvos(await updated.json());
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!showDM) return null;

  return (
    <div className="dm-modal-backdrop" onClick={handleClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="close-button">×</button>

        <div className="dm-container">
          <div className="dm-sidebar">
            <h3>Conversations</h3>
            {convos.map((c) => (
              <div
                key={c.otherUser.id}
                className={`dm-thread ${activeUserId === c.otherUser.id ? "active" : ""}`}
                onClick={() => {
                  setActiveUserId(c.otherUser.id);
                  loadChat(c.otherUser.id);
                  setModalUser(c.otherUser);
                }}
              >
                <img
                  src={c.otherUser.avatarUrl || "/placeholder-avatar.png"}
                  alt="avatar"
                />
                <div>
                  <strong>{c.otherUser.username}</strong>
                  <p className="last-message">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dm-chat-window">
            {activeUserId ? (
              <>
                <div className="dm-messages">
                  {messages.map((msg) => (
                    <div
                      key={msg.id || Math.random()}
                      className={`dm-message ${
                        msg.senderId === currentUser.id ? "sent" : "received"
                      }`}
                    >
                      <span className="message-content">
                        <strong>
                          {msg.Sender?.username ||
                            (msg.senderId === currentUser.id ? "You" : "Unknown")}
                          :
                        </strong>{" "}
                        {msg.text}
                        <div className="message-timestamp">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </span>
                      {msg.senderId === currentUser.id && msg.id && (
                        <button onClick={() => handleDelete(msg.id)}>🗑️</button>
                      )}
                    </div>
                  ))}
                  {otherTyping && <div className="typing-indicator">Typing...</div>}
                  <div ref={messagesEndRef} />
                </div>
                <div className="dm-input">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                  />
                  <button onClick={handleSend}>Send</button>
                </div>
              </>
            ) : (
              <div className="dm-placeholder">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>

        {modalUser && (
          <ProfileModal user={modalUser} onClose={() => setModalUser(null)} />
        )}
      </div>
    </div>
  );
}

