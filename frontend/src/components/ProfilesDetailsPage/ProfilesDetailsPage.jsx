// src/components/ProfileDetailPage/ProfileDetailPage.jsx
import { useParams, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import CombatModal from "../CombatModal/CombatModal";
import "./ProfileDetailsPage.css";

function ProfileDetailPage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useSelector((state) => state.session.user); // Get logged-in user
  const [showCombat, setShowCombat] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch(`/api/profiles/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [userId]);

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>Profile not found.</div>;

  return (
    <div className="profile-details-container">
      <div className="profile-header">
        <div className="profile-image-container">
          {profile.avatarUrl && profile.avatarUrl.startsWith("http") ? (
            <img
              src={profile.avatarUrl}
              alt={`${profile.username}'s profile`}
              className="profile-image"
            />
          ) : (
            <FaUserCircle
              className="profile-icon"
              style={{ fontSize: "5rem", color: "#ccc" }}
            />
          )}
        </div>
        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p>Email: {profile.email}</p>
          <p>Location: {profile.location || "Not specified"}</p>
          <p>Age: {profile.age || "Not specified"}</p>
          <p>Sex: {profile.sex || "Not specified"}</p>
          <p>Wins: {profile.wins ?? 0}</p>
          <p>Losses: {profile.losses ?? 0}</p>
          <p>
            Relationship Status: {profile.relationshipStatus || "Not specified"}
          </p>
        </div>
      </div>
      {currentUser && currentUser.id !== parseInt(userId) && (
        <button onClick={() => setShowCombat(true)} className="fight-button">
          💥 Fight This Player
        </button>
      )}

      {showCombat && (
        <CombatModal
          attacker={currentUser}
          defender={profile}
          onClose={() => setShowCombat(false)}
        />
      )}

      {/* Show "Edit Profile" button only if the logged-in user is viewing their own profile */}
      {currentUser && currentUser.id === parseInt(userId) && (
        <NavLink to="/profiles/edit" className="edit-profile-button">
          Edit Profile
        </NavLink>
      )}

      {currentUser && currentUser.id !== parseInt(userId) && (
        <NavLink to={`/dm/${userId}`} className="dm-button">
          Message
        </NavLink>
      )}
    </div>
  );
}

export default ProfileDetailPage;
