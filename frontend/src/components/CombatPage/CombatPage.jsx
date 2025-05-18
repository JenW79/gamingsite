import { useState } from "react";
import { useSelector } from "react-redux";
import { csrfFetch } from "../../store/csrf";
import "./CombatPage.css";

function CombatPage() {
  const user = useSelector((state) => state.session.user);
  const [defenderId, setDefenderId] = useState("");
  const [result, setResult] = useState("");
  const [fightId, setFightId] = useState(null);

  const handleAttack = async () => {
    if (!user) {
      setResult("You must be logged in to attack.");
      return;
    }

    try {
      const response = await csrfFetch("/api/combat/attack", {
        method: "POST",
        body: JSON.stringify({ attackerId: user.id, defenderId }),
      });

      const data = await response.json();
      setResult(data.message);

      if (!fightId || fightId !== data.fightId) {
        setFightId(data.fightId);
      }
    } catch (error) {
      const errorData = await error.json();
      setResult(errorData.message || "Attack failed.");
    }
  };

  const handleHeal = async () => {
    try {
      const response = await csrfFetch("/api/combat/heal", {
        method: "POST",
        body: JSON.stringify({ itemId: 2, fightId }), // Use item ID 1 (Potion)
      });

      const data = await response.json();
      setResult(data.message);
    } catch (error) {
      const errorData = await error.json();
      setResult(errorData.message || "Healing failed.");
    }
  };

  return (
    <div className="combat-container">
      <h2>Combat Arena</h2>
      <p>Logged in as: {user ? user.username : "Guest"}</p>
      <label>Enter Player ID to Attack:</label>
      <input
        type="text"
        value={defenderId}
        onChange={(e) => setDefenderId(e.target.value)}
      />
      <div className="combat-buttons">
        <button className="attack-button" onClick={handleAttack}>
          Attack
        </button>
        <button className="heal-button" onClick={handleHeal}>
          Use Heal
        </button>
      </div>

      {result && (
        <p
          className={`result-message ${
            result.toLowerCase().includes("fail")
              ? "error-message"
              : "success-message"
          }`}
        >
          {result}
        </p>
      )}
      {result && <p>{result}</p>}
    </div>
  );
}

export default CombatPage;
