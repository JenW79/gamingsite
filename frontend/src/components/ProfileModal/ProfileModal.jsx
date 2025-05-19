import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";

import "./ProfileModal.css";

export default function ProfileModal({ user, onClose }) {
  console.log(" Modal mounted with user:", user);

  const navigate = useNavigate();
  if (!user) return null;

  return (
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
        <p>Cash: ${user.cash}</p>

        <button onClick={() => navigate(`/profiles/${user.id}`)}>
          View Full Profile
        </button>
      </div>
    </div>
  );
}
