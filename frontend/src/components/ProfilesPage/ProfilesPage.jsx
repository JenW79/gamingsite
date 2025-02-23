import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { fetchProfiles } from "../../store/profiles";
import "./ProfilesPage.css"; 

function ProfilesPage() {
  const dispatch = useDispatch();
  const profiles = useSelector((state) => state.profiles.list);

  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  if (!profiles || profiles.length === 0) return <h2>Loading profiles...</h2>;

  return (
    <div className="profiles-container">
      {profiles.map((profile) => (
        <div key={profile.id} className="profile-card">
          <div className="profile-image-container">
            <img 
              src={profile.avatarUrl || "default-avatar.png"} 
              alt={profile.username} 
              className="profile-image" 
            />
          </div>
          <div className="profile-info-container">
            <div className="profile-name">{profile.username}</div>
            <div className="profile-stats">Level: {profile.level}</div>
            <div className="profile-stats">Experience: {profile.experience}</div>
            <div className="profile-stats">Energy: {profile.energy}</div>
            <div className="profile-stats">Cash: ${profile.cash}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProfilesPage;
