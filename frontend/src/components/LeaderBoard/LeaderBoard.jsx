import { useEffect, useState } from 'react';
import './LeaderBoard.css';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const res = await fetch('/api/leaderboard');
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
          <li key={player.id} className="leaderboard-item">
            <span className="leaderboard-rank">{index + 1}.</span>
            <span className="leaderboard-username">{player.username}</span>
            <span className="leaderboard-level">Level: {player.level}</span>
            <span className="leaderboard-xp">XP: {player.experience}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Leaderboard;
