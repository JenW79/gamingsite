import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { fetchGameData } from "../../store/game";
import { csrfFetch } from "../../store/csrf";
import "./CombatModal.css";
import io from "socket.io-client";

export default function CombatModal({
  attacker,
  defender,
  onClose,
  inventory,
}) {
  const dispatch = useDispatch();
  const [combatLog, setCombatLog] = useState([]);
  const [attackerHealth, setAttackerHealth] = useState(100);
  const [defenderHealth, setDefenderHealth] = useState(100);
  const [xpThresholds, setXpThresholds] = useState([]);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:8000",
      {
        withCredentials: true,
        transports: ["websocket"],
      }
    );

    socket.current.emit("register", attacker.id);

    const fightId = `${attacker.id}-${defender.id}-${Date.now()}`;
    socket.current.emit("startFight", {
      attackerId: attacker.id,
      defenderId: defender.id,
      fightId,
    });

    setCombatLog((log) => [
      ...log,
      `Engaged combat with ${defender.username}!`,
    ]);

    return () => {
      socket.current?.disconnect();
    };
  }, [attacker.id, defender.id, defender.username]);

  useEffect(() => {
    const fetchThresholds = async () => {
      const res = await fetch("/api/levels");
      const data = await res.json();
      setXpThresholds(data.thresholds);
    };
    fetchThresholds();
  }, []);

  const level = attacker.level || 1;
  const currentXP = attacker.experience || 0;
  const nextLevelXP = xpThresholds[level + 1] || 1;
  const prevLevelXP = xpThresholds[level] || 0;
  const xpProgress = Math.min(
    100,
    Math.floor(((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)
  );

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
      } catch {
        console.log("No active combat found.");
        setAttackerHealth(attacker.health ?? 100);

        try {
          const profileRes = await csrfFetch(`/api/profiles/${defender.id}`);
          const profileData = await profileRes.json();
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

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const log = (entry) => setCombatLog((prev) => [...prev, entry]);

    s.on("fightRequested", ({ attackerId }) => {
      log(`Player ${attackerId} started a fight!`);
    });

    s.on("receiveAttack", ({ damage, attackerId }) => {
      const effectiveDefense = attacker.defense ?? 0;
      const mitigated = damage - effectiveDefense * 0.2;
      const finalDamage = Math.max(1, Math.floor(mitigated));
      setAttackerHealth((hp) => Math.max(0, hp - finalDamage));
      log(`You took ${finalDamage} damage from Player ${attackerId}`);
    });

    s.on("receiveHeal", ({ healAmount }) => {
      setDefenderHealth((hp) => Math.min(100, hp + healAmount));
      log(`Opponent healed for ${healAmount} HP.`);
    });

    s.on("attackConfirmed", ({ damage }) => {
      setDefenderHealth((hp) => Math.max(0, hp - damage));
      log(`You dealt ${damage} damage to ${defender.username}`);
    });

    s.on("manualHealConfirmed", ({ healAmount }) => {
      setAttackerHealth((hp) => Math.min(100, hp + healAmount));
      log(`You successfully recovered ${healAmount} HP.`);
    });

    s.on("opponentHealed", ({ healAmount }) => {
      setDefenderHealth((hp) => Math.min(100, hp + healAmount));
      log(`Opponent healed for ${healAmount} HP.`);
    });

    return () => {
      s.off("fightRequested");
      s.off("receiveAttack");
      s.off("receiveHeal");
      s.off("attackConfirmed");
      s.off("manualHealConfirmed");
      s.off("opponentHealed");
    };
  }, [attacker.defense, defender.username]);

  const handleAttack = async () => {
    if (defenderHealth <= 0)
      return setCombatLog((log) => [
        ...log,
        `${defender.username} is already defeated.`,
      ]);
    if (attackerHealth <= 0)
      return setCombatLog((log) => [...log, "You're too weak to fight!"]);

    const baseDamage = attacker.attack ?? 5;
    const defense = defender.defense ?? 0;
    const rawDamage = baseDamage * 0.6 + Math.random() * 3;
    const mitigated = rawDamage - defense * 0.2;
    const damage = Math.max(1, Math.floor(mitigated));

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

      if (data.combatCompleted) {
        dispatch(fetchGameData(attacker.id));
        setCombatLog((log) => [...log, "🏆 Combat completed. Rewards earned!"]);
      }

      socket.current.emit("attackMove", {
        attackerId: attacker.id,
        defenderId: defender.id,
        damage,
      });
    } catch (error) {
      const errData = await error.json();
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

      socket.current.emit("healMove", {
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

  const handleUseItem = async (itemId) => {
    try {
      const res = await csrfFetch("/api/combat/use-item", {
        method: "POST",
        body: JSON.stringify({ itemId, targetId: defender.id }),
      });

      const data = await res.json();
      setCombatLog((log) => [...log, data.message]);

      if (data.newHealth !== undefined) {
        setAttackerHealth(data.newHealth);
      }

      if (data.updatedCombat) {
        const isAttacker = data.updatedCombat.attackerId === attacker.id;
        setAttackerHealth(
          isAttacker
            ? data.updatedCombat.attackerHP
            : data.updatedCombat.defenderHP
        );
        setDefenderHealth(
          isAttacker
            ? data.updatedCombat.defenderHP
            : data.updatedCombat.attackerHP
        );
      }

      dispatch(fetchGameData(attacker.id));
    } catch (err) {
      console.error("Item use failed:", err);
      setCombatLog((log) => [...log, "Failed to use item."]);
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
          {[attacker, defender].map((p, idx) => {
            const isAttacker = idx === 0;
            const hp = isAttacker ? attackerHealth : defenderHealth;
            return (
              <div key={p.id} className="combat-player">
                {p.avatarUrl && p.avatarUrl.startsWith("http") ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.username}
                    className={`combat-avatar ${hp === 0 ? "knocked-out" : ""}`}
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                  />
                ) : (
                  <img
                    src="/default-avatar.png"
                    alt="Default avatar"
                    className="combat-avatar"
                  />
                )}
                <p>Level: {p.level}</p>
                <div className="hp-bar">
                  <div
                    className="hp-fill"
                    style={{
                      width: `${hp}%`,
                      backgroundColor: hp === 0 ? "crimson" : "limegreen",
                    }}
                  />
                </div>
                <p>
                  {p.username}: {hp}/100 HP
                </p>
                <p>
                  XP: {currentXP} / {nextLevelXP}
                </p>
                <div className="xp-bar">
                  <div
                    className="xp-fill"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="combat-controls">
          <button
            onClick={handleAttack}
            disabled={attackerHealth === 0 || defenderHealth === 0}
          >
            Attack
          </button>
          <button onClick={handleManualHeal}>Heal</button>
        </div>

        {inventory?.length > 0 && (
          <div className="combat-inventory">
            <h4>Use an Item</h4>
            <div className="combat-item-buttons">
              {inventory
                .filter((i) => i.type === "potion" || i.damage > 0)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleUseItem(item.id)}
                    disabled={item.quantity <= 0}
                    className="combat-item-button"
                  >
                    {item.name} ({item.quantity})
                  </button>
                ))}

              {attackerHealth === 0 && (
                <p className="combat-warning">
                  💀 You're knocked out! Heal or use a potion to recover.
                </p>
              )}
            </div>
          </div>
        )}

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
