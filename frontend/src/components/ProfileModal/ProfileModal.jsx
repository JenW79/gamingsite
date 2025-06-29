import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useSelector } from "react-redux";
import MessageButton from "../Navigation/MessageButton";

import "./ProfileModal.css";

export default function ProfileModal({ user, onClose }) {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.session.user);

  if (!user) return null;

  return (
    <>
      <div className="profile-modal-backdrop" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>
            ×
          </button>

          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="profile-modal-avatar"
              onError={(e) => (e.target.src = "/default-avatar.png")}
            />
          ) : (
            <FaUserCircle
              className="profile-modal-avatar"
              style={{ fontSize: "4rem", color: "#ccc" }}
            />
          )}

          <h3>{user.username}</h3>
          <p>Level: {user.level}</p>
          <p>Energy: {user.energy}</p>

          <button onClick={() => navigate(`/profiles/${user.id}`)}>
            View Full Profile
          </button>

          {user.id !== 0 && currentUser?.id !== user.id && (
            <div className="message-action">
              <MessageButton targetUserId={user.id} variant="action" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
