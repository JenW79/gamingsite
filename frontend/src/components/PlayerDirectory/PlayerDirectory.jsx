import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { fetchProfiles } from "../../store/profiles";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./PlayerDirectory.css";

export default function PlayerDirectory() {
  const dispatch = useDispatch();
  const profiles = useSelector((state) => state.profiles.list);
  const [filter, setFilter] = useState("");
  const [minLevel, setMinLevel] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

 const filteredProfiles = profiles.filter((p) => {
  const matchesUsername = p.username.toLowerCase().includes(filter.toLowerCase());
  const matchesLevel = p.level >= minLevel;
  return matchesUsername && matchesLevel;
});

  return (
    <div className="directory-container">
      <h2>Find Players</h2>
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Search username..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="minLevel">Min Level</label>
          <input
            id="minLevel"
            type="number"
            min={1}
            value={minLevel}
            onChange={(e) => setMinLevel(parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="profiles-grid">
        {filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            className="profile-card"
            onClick={() => navigate(`/profiles/${profile.id}`)}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="avatar"
              />
            ) : (
              <FaUserCircle className="avatar" />
            )}
            <div className="info">
              <h4>{profile.username}</h4>
            <p>Lvl {profile.level}</p>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
