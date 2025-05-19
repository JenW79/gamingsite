// components/CombatModal/CombatModal.jsx
import { useEffect, useState } from "react";
import "./CombatModal.css";
import io from "socket.io-client";
import { csrfFetch } from "../../store/csrf";

const socket = io("http://localhost:5173", { withCredentials: true });

export default function CombatModal({ attacker, defender, onClose }) {
  const [combatLog, setCombatLog] = useState([]);
  const [attackerHealth, setAttackerHealth] = useState(100);
  const [defenderHealth, setDefenderHealth] = useState(100);

  // Register and start fight
  useEffect(() => {
    socket.emit("register", attacker.id);

    const fightId = `${attacker.id}-${defender.id}-${Date.now()}`;
    socket.emit("startFight", {
      attackerId: attacker.id,
      defenderId: defender.id,
      fightId,
    });

    setCombatLog((log) => [...log, `You attacked ${defender.username}!`]);
  }, [attacker.id, defender.id, defender.username]);

  useEffect(() => {
    const loadCombat = async () => {
      try {
        const res = await csrfFetch(`/api/combat/${attacker.id}`);
        const data = await res.json();

        const isAttacker = data.attackerId === attacker.id;
        const savedAttackerHP = isAttacker ? data.attackerHP : data.defenderHP;
        const savedDefenderHP = isAttacker ? data.defenderHP : data.attackerHP;
        

        setAttackerHealth(savedAttackerHP);
        setDefenderHealth(savedDefenderHP);

        setCombatLog((log) => [...log, "Resumed existing combat."]);
      } catch (err) {
        console.log("No active combat found.");

        setAttackerHealth(attacker.health ?? 100);

        try {
          console.log("Fetching fallback profile health...");
          const profileRes = await csrfFetch(`/api/profiles/${defender.id}`);
          const profileData = await profileRes.json();
          console.log(" Fetched profileData:", profileData);
          const health = profileData.health ?? 100;
          setDefenderHealth(health);
          if (health <= 0) {
            setCombatLog((log) => [
              ...log,
              `${profileData.username} is already defeated.`,
            ]);
          }
        } catch (fallbackErr) {
          console.error(
            "Failed to load fallback defender profile:",
            fallbackErr
          );
          setDefenderHealth(100);
        }
      }
    };

    loadCombat();
  }, [attacker.id, attacker.health, defender.id]);

  // Socket listeners
  useEffect(() => {
    socket.on("fightRequested", ({ attackerId }) => {
      setCombatLog((log) => [...log, `Player ${attackerId} started a fight!`]);
    });

    socket.on("receiveAttack", ({ damage, attackerId }) => {
      setAttackerHealth((hp) => Math.max(0, hp - damage));
      setCombatLog((log) => [
        ...log,
        `You took ${damage} damage from Player ${attackerId}`,
      ]);
    });

    socket.on("receiveHeal", ({ healAmount }) => {
      setDefenderHealth((hp) => Math.min(100, hp + healAmount));
      setCombatLog((log) => [...log, `Opponent healed for ${healAmount} HP.`]);
    });

    socket.on("attackConfirmed", ({ damage }) => {
      setDefenderHealth((hp) => Math.max(0, hp - damage));
      setCombatLog((log) => [
        ...log,
        `You dealt ${damage} damage to ${defender.username}`,
      ]);
    });

    socket.on("manualHealConfirmed", ({ healAmount }) => {
      setAttackerHealth((hp) => Math.min(100, hp + healAmount));
      setCombatLog((log) => [
        ...log,
        `You successfully recovered ${healAmount} HP.`,
      ]);
    });

    socket.on("opponentHealed", ({ healAmount }) => {
      setDefenderHealth((hp) => Math.min(100, hp + healAmount));
      setCombatLog((log) => [...log, `Opponent healed for ${healAmount} HP.`]);
    });

    return () => {
      socket.off("fightRequested");
      socket.off("receiveAttack");
      socket.off("receiveHeal");
      socket.off("attackConfirmed");
      socket.off("manualHealConfirmed");
      socket.off("opponentHealed");
    };
  }, [defender.username]);

  const handleAttack = async () => {
    if (defenderHealth <= 0) {
      setCombatLog((log) => [
        ...log,
        `${defender.username} is already defeated.`,
      ]);
      return;
    }

    if (attackerHealth <= 0) {
      setCombatLog((log) => [...log, "You're too weak to fight!"]);
      return;
    }

    const damage = Math.floor(Math.random() * 10) + 5;

    try {
      const response = await csrfFetch("/api/combat/attack", {
        method: "POST",
        body: JSON.stringify({ defenderId: defender.id }),
      });

      const data = await response.json();
      if (data.defenderHealth !== undefined) {
        setDefenderHealth(data.defenderHealth);
        setCombatLog((log) => [...log, data.message]);
      }

      socket.emit("attackMove", {
        attackerId: attacker.id,
        defenderId: defender.id,
        damage,
      });
    } catch (error) {
      const errData = await error.json();

      if (errData.message === "This player is already defeated!") {
        setDefenderHealth(0);
        setCombatLog((log) => [...log, errData.message]);
        return;
      }

      const fallback = "Attack failed.";
      setCombatLog((log) => [...log, errData.message || fallback]);
    }
  };

  const handleManualHeal = async () => {
    const healAmount = 5;

    try {
      const res = await csrfFetch("/api/combat/manual-heal", {
        method: "POST",
      });

      const data = await res.json();
      setAttackerHealth(data.newHealth);
      setCombatLog((log) => [...log, data.message]);

      socket.emit("healMove", {
        userId: attacker.id,
        targetId: defender.id,
        healAmount,
        type: "manual",
      });
    } catch (err) {
      console.error("Manual heal failed:", err);
      setCombatLog((log) => [...log, "Healing failed."]);
    }
  };

  return (
    <div className="combat-modal-overlay" onClick={onClose}>
      <div className="combat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="combat-header">
          <h2>⚔️ Fight!</h2>
          <button onClick={onClose}>×</button>
        </div>

        <div className="combat-bars">
          <div className="combat-player">
            <img src={attacker.avatarUrl} alt={attacker.username} />
            <div className="hp-bar">
              <div
                className="hp-fill"
                style={{
                  width: `${attackerHealth}%`,
                  backgroundColor:
                    attackerHealth === 0 ? "crimson" : "limegreen",
                }}
              />
            </div>
            <p>
              {attacker.username}: {attackerHealth}/100 HP
            </p>
          </div>
          <div className="combat-player">
            <img src={defender.avatarUrl} alt={defender.username} />
            <div className="hp-bar">
              <div
                className="hp-fill"
                style={{
                  width: `${defenderHealth}%`,
                  backgroundColor:
                    defenderHealth === 0 ? "crimson" : "limegreen",
                }}
              />
            </div>
            <p>
              {defender.username}: {defenderHealth}/100 HP
            </p>
          </div>
        </div>

        <div className="combat-controls">
          <button onClick={handleAttack} disabled={defenderHealth === 0}>
            Attack
          </button>
          <button onClick={handleManualHeal} disabled={attackerHealth === 0}>
            Heal
          </button>
        </div>

        <div className="combat-log">
          <h4>Battle Log</h4>
          <ul>
            {combatLog.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
