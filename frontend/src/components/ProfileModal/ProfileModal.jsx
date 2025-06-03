import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useSelector } from "react-redux";

import "./ProfileModal.css";

export default function ProfileModal({ user, onClose }) {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.session.user);
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

        <button onClick={() => navigate(`/profiles/${user.id}`)}>
          View Full Profile
        </button>

        {user.id !== 0 && currentUser?.id !== user.id && (
          <button
            className="dm-button"
            onClick={() => {
              onClose(); // Close the modal
              navigate(`/dm/${user.id}`);
            }}
          >
            Message
          </button>
        )}
      </div>
    </div>
  );
}
