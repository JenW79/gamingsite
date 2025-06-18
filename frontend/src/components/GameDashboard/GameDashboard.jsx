import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGameData } from "../../store/game";
import BugReportForm from "../BugReports/BugReportForm";
import "./GameDashboard.css";

function GameDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);
  const stats = useSelector((state) => state.game.stats);
  const inventory = useSelector((state) => state.game.inventory);
  const [xpThresholds, setXpThresholds] = useState([]);

  useEffect(() => {
    if (user) {
      dispatch(fetchGameData(user.id));
    }
  }, [dispatch, user]);

  useEffect(() => {
    const fetchThresholds = async () => {
      const res = await fetch("/api/levels");
      const data = await res.json();
      setXpThresholds(data.thresholds);
    };
    fetchThresholds();
  }, []);

  if (!user) return <div>Please log in to access the game.</div>;

  const level = stats.level || 1;
  const currentXP = stats.experience || 0;
  const nextLevelXP = xpThresholds[level + 1] || 1;
  const prevLevelXP = xpThresholds[level] || 0;
  const progress = Math.min(
    100,
    Math.floor(((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)
  );

  return (
    <div className="game-dashboard">
      <h1>Welcome, {user.username}</h1>
      <div className="stats-section">
        <h2>Player Stats</h2>
        <ul>
          <li>Health: {stats.health}</li>
          <li>Attack: {stats.attack}</li>
          <li>Defense: {stats.defense}</li>
          <li>Energy: {stats.energy}</li>
          <li>Level: {stats.level}</li>
          <li>Coins: {stats.coins}</li>
          <li>
            XP: {currentXP} / {nextLevelXP}
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${progress}%` }} />
            </div>
          </li>
        </ul>
      </div>

      <div className="inventory-section">
        <h2>Inventory</h2>
        {inventory.length === 0 ? (
          <p>No items in inventory.</p>
        ) : (
          <ul>
            {inventory.map((item) => (
              <li key={item.id}>
                {" "}
                {item.name} ({item.type}) - Quantity: {item.quantity}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="bug-report-section">
        <BugReportForm user={user} />
      </div>
    </div>
  );
}

export default GameDashboard;
