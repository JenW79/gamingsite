// src/components/ProfileDetailPage/ProfileDetailPage.jsx
import { useParams, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FaUserCircle } from "react-icons/fa";
import CombatModal from "../CombatModal/CombatModal";
import { fetchGameData } from "../../store/game";
import "./ProfileDetailsPage.css";

function ProfileDetailPage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const inventory = useSelector((state) => state.game.inventory);
  const currentUser = useSelector((state) => state.session.user);
  const [showCombat, setShowCombat] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchGameData(currentUser.id));
    }
  }, [dispatch, currentUser]);

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
            <div className="profile-icon">
              <FaUserCircle />
            </div>
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
        <div className="profile-actions">
          <button
            onClick={() => setShowCombat(true)}
            className="profile-action-button fight-button"
          >
            💥 Fight This Player
          </button>

          <NavLink
            to={`/dm/${userId}`}
            className="profile-action-button dm-button"
          >
            Message
          </NavLink>
        </div>
      )}

      {showCombat && (
        <CombatModal
          attacker={currentUser}
          defender={profile}
          inventory={inventory}
          onClose={() => setShowCombat(false)}
        />
      )}

      {currentUser && currentUser.id === parseInt(userId) && (
        <NavLink to="/profiles/edit" className="edit-profile-button">
          Edit Profile
        </NavLink>
      )}
    </div>
  );
}

export default ProfileDetailPage;
