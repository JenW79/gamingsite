import { useState, useEffect, useRef } from "react";
import { FiMessageSquare } from "react-icons/fi";
import { useSelector } from "react-redux";
import DMModal from "../Dmpage/DMModal";
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
      if (msg.receiverId === user.id && !showDM) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => socket.current.disconnect();
  }, [user, showDM]);

  return (
    <div
      className={`message-button-wrapper ${
        variant === "action" ? "action-style" : ""
      }`}
    >
      <button
        className="message-toggle-button"
        onClick={() => {
          setShowDM(true);
          setUnreadCount(0);
        }}
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
          handleClose={() => setShowDM(false)}
        />
      )}
    </div>
  );
}
