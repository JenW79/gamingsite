import { useState, useEffect, useRef } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { useSelector } from "react-redux";
import DMModal from "../DMModal/DMModal";
import io from "socket.io-client";
import "./MessageButton.css";

export default function MessageButton({
  targetUserId = null,
  variant,
  showText = true,
}) {
  const user = useSelector((state) => state.session.user);
  const [showDM, setShowDM] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useRef(null);

  useEffect(() => {
    if (!user) return;

    socket.current = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8000",
      {
        withCredentials: true,
        transports: ["websocket"],
      }
    );

    socket.current.on("connect", () => {
      socket.current.emit("register", user.id);
    });

    socket.current.on("private message", (msg) => {
      const isChatOpen =
        window.__activeDMUserId === msg.senderId || msg.receiverId;
      if (msg.receiverId === user.id && !isChatOpen && !showDM) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.current.disconnect();
      window.__clearUnreadCount = null;
    };
  }, [user, showDM]);

  useEffect(() => {
    if (typeof window.__clearUnreadCount !== "function") {
      window.__clearUnreadCount = () => setUnreadCount(0);
    }
    return () => {
      if (window.__clearUnreadCount) window.__clearUnreadCount = null;
    };
  }, []);

  useEffect(() => {
    fetch("/api/dms/unread/count", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUnreadCount(data.unreadCount);
      });
  }, []);

  const handleOpen = () => {
    setShowDM(true);
    setUnreadCount(0);
    window.__activeDMUserId = targetUserId ?? null;
  };

  const handleClose = () => {
    setShowDM(false);
    window.__activeDMUserId = null;
  };

  return (
    <div
      className={`message-button-wrapper ${
        variant === "action" ? "action-style" : ""
      }`}
    >
      <button
        className="message-toggle-button"
        onClick={handleOpen}
        title="Messages"
      >
        <FiMessageSquare size={22} /> {showText && "Message"}
        {unreadCount > 0 && (
          <span className="message-badge">{unreadCount}</span>
        )}
      </button>

      {showDM && (
        <DMModal
          showDM={true}
          initialUserId={targetUserId}
          handleClose={handleClose}
        />
      )}
    </div>
  );
}
