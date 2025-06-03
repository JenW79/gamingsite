import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import "./DMpage.css";

const socket = io(import.meta.env.VITE_SOCKET_URL  || "http://localhost:8000", {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket"],
});

function getCsrfToken() {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("XSRF-TOKEN="))
    ?.split("=")[1];
}

function DMPage() {
  const currentUser = useSelector((state) => state.session.user);
  const { userId } = useParams();
  const [convos, setConvos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      socket.connect();
      socket.emit("register", currentUser.id);
    }

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
  const handleConnect = () => {
    console.log("✅ Socket connected:", socket.id);
  };

  socket.on("connect", handleConnect);

  return () => {
    socket.off("connect", handleConnect);
  };
}, []);

  useEffect(() => {
    fetch("/api/dms", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setConvos(data));
  }, []);

  const loadChat = async (userIdToLoad) => {
    setActiveUserId(userIdToLoad);
    const res = await fetch(`/api/dms/${userIdToLoad}`, {
      credentials: "include",
    });
    const data = await res.json();
    setMessages(data);
  };

  useEffect(() => {
    if (userId) {
      loadChat(parseInt(userId));
    }
  }, [userId]);

  useEffect(() => {
    socket.on("private message", (msg) => {
      console.log("📩 Received message from socket:", msg);
      // Always update sidebar convo list
      setConvos((prev) => {
        const exists = prev.find(
          (c) => c.otherUser.id === (msg.Sender?.id || msg.Receiver?.id)
        );
        const otherUser =
          msg.senderId === currentUser.id
            ? msg.Receiver ?? { id: msg.receiverId, username: "Unknown", avatarUrl: null }
            : msg.Sender ?? { id: msg.senderId, username: "Unknown", avatarUrl: null };

        if (exists) {
          return prev.map((c) =>
            c.otherUser.id === otherUser.id
              ? { ...msg, otherUser, text: msg.text }
              : c
          );
        }

        return [{ ...msg, otherUser, text: msg.text }, ...prev];
      });

      // Only update the message thread if this chat is active
      const isActive =
        activeUserId &&
        (msg.senderId === activeUserId || msg.receiverId === activeUserId);

      if (isActive) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", ({ fromUserId }) => {
      if (fromUserId === activeUserId) setOtherTyping(true);
    });

    socket.on("stop typing", ({ fromUserId }) => {
      if (fromUserId === activeUserId) setOtherTyping(false);
    });

    return () => {
      socket.off("private message");
      socket.off("typing");
      socket.off("stop typing");
    };
  }, [activeUserId, currentUser.id]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    if (!socket.connected) {
      console.warn("❌ Socket not connected — cannot send");
      return;
    }

    console.log("📤 Sending message via socket:", {
      senderId: currentUser.id,
      receiverId: activeUserId,
      text: newMessage,
    });

    socket.emit("private message", {
      senderId: currentUser.id,
      receiverId: activeUserId,
      text: newMessage,
    });

    setNewMessage("");

    socket.emit("stop typing", {
      toUserId: activeUserId,
      fromUserId: currentUser.id,
    });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!typing) {
      setTyping(true);
      socket.emit("typing", {
        toUserId: activeUserId,
        fromUserId: currentUser.id,
      });
    }

    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setTyping(false);
      socket.emit("stop typing", {
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
    // Refresh current thread
    loadChat(activeUserId);

    // Refresh convo list
    const updated = await fetch("/api/dms", { credentials: "include" });
    const updatedData = await updated.json();
    setConvos(updatedData);
  } else {
    console.error("Delete failed", await res.json());
  }
};

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="dm-container">
      <div className="dm-sidebar">
        <h3>Conversations</h3>
        {convos.map((c) => (
          <div
            key={c.otherUser.id}
            className={`dm-thread ${
              activeUserId === c.otherUser.id ? "active" : ""
            }`}
            onClick={() => loadChat(c.otherUser.id)}
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
  );
}

export default DMPage;
