import { useEffect, useState } from "react";
import "./LeaderBoard.css";
import ProfileModal from "../ProfileModal/ProfileModal";

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
      setLoading(false);
    }
    fetchLeaderboard();
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      <ul className="leaderboard-list">
        {leaderboard.map((player, index) => (
          <li
            key={player.id}
            className="leaderboard-item"
            onClick={() => setModalUser(player)}
            style={{ cursor: "pointer" }}
          >
            <span className="leaderboard-rank">{index + 1}.</span>

            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.username}
                className="leaderboard-avatar"
              />
            ) : (
              <div className="leaderboard-avatar-placeholder">👤</div>
            )}

            <span className="leaderboard-username">{player.username}</span>
            <span className="leaderboard-level">Level: {player.level}</span>
            <span className="leaderboard-record">
              Wins: {player.wins ?? 0} | Losses: {player.losses ?? 0}
            </span>
          </li>
        ))}
      </ul>
      {modalUser && (
        <ProfileModal user={modalUser} onClose={() => setModalUser(null)} />
      )}
    </div>
  );
}

export default Leaderboard;
