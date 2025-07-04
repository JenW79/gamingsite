import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGameData } from "../../store/game";
import { csrfFetch } from "../../store/csrf";
import { initSocket } from "../../socket";
import "./CombatModal.css";

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
  const gameStats = useSelector((state) => state.game.stats);
  const logRef = useRef(null);
  const socket = useRef(null);

  const MAX_LOG_ENTRIES = 20;

  const log = (entry) => {
    setCombatLog((prev) => {
      const updated = [...prev, entry].slice(-MAX_LOG_ENTRIES);
      setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, 0);
      return updated;
    });
  };

  useEffect(() => {
    socket.current = initSocket(attacker.id);

    const fightId = `${attacker.id}-${defender.id}-${Date.now()}`;
    socket.current.emit("startFight", {
      attackerId: attacker.id,
      defenderId: defender.id,
      fightId,
    });

    log(`Engaged combat with ${defender.username}!`);
  }, [attacker.id, defender.id, defender.username]);

  useEffect(() => {
    const fetchThresholds = async () => {
      const res = await fetch("/api/levels");
      const data = await res.json();
      setXpThresholds(data.thresholds);
    };
    fetchThresholds();
  }, []);

  const level = gameStats.level || 1;
  const currentXP = gameStats.experience || 0;
  const prevLevelXP = xpThresholds[level] || 0;
  const nextLevelXP = xpThresholds[level + 1] ?? prevLevelXP + 100;

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
        log("Resumed existing combat.");
      } catch {
        console.log("No active combat found.");
        // Fetch attacker profile
        const attackerRes = await csrfFetch(`/api/profiles/${attacker.id}`);
        const attackerData = await attackerRes.json();
        const attackerHP = attackerData.health ?? 100;
        setAttackerHealth(attackerHP);

        // Fetch defender profile
        try {
          const defenderRes = await csrfFetch(`/api/profiles/${defender.id}`);
          const defenderData = await defenderRes.json();
          const defenderHP = defenderData.health ?? 100;
          setDefenderHealth(defenderHP);

          if (defenderHP <= 0) {
            log(`${defenderData.username} is already defeated.`);
          }
        } catch (fallbackErr) {
          console.error(
            "Failed to load fallback defender profile:",
            fallbackErr
          );
          setDefenderHealth(0);
        }
      }
    };

    loadCombat();
  }, [attacker.id, attacker.health, defender.id]);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const handleFightRequested = ({ attackerId }) =>
      log(`Player ${attackerId} started a fight!`);

    const handleReceiveHeal = ({ healAmount }) => {
      setDefenderHealth((hp) => Math.min(100, hp + healAmount));
      log(`Opponent healed for ${healAmount} HP.`);
    };

    const handleCombatOver = ({ winnerId, rewards }) => {
      if (attacker.id === winnerId) {
        alert(
          `🏆 You won the battle! +${rewards.xp} XP, +${rewards.coins} coins`
        );
      } else {
        log("💀 You were defeated.");
      }

      dispatch(fetchGameData(attacker.id));
    };

    const handleCombatStateUpdate = ({
      attackerId: socketAttackerId,
      attackerHP,
      defenderId: socketDefenderId,
      defenderHP,
    }) => {
      if (socketDefenderId === null) {
        if (attacker.id === socketAttackerId) {
          setAttackerHealth(attackerHP);
          dispatch(fetchGameData(attacker.id));
        }
        return;
      }

      if (attacker.id === socketAttackerId) {
        setAttackerHealth(attackerHP);
        setDefenderHealth(defenderHP);
      } else {
        setAttackerHealth(defenderHP);
        setDefenderHealth(attackerHP);
      }

      dispatch(fetchGameData(attacker.id));
    };

    s.on("fightRequested", handleFightRequested);
    s.on("receiveHeal", handleReceiveHeal);
    s.on("combatOver", handleCombatOver);
    s.on("combatStateUpdate", handleCombatStateUpdate);

    return () => {
      s.off("fightRequested", handleFightRequested);
      s.off("receiveHeal", handleReceiveHeal);
      s.off("combatOver", handleCombatOver);
      s.off("combatStateUpdate", handleCombatStateUpdate);
    };
  }, [attacker.id, attacker.defense, defender.username, dispatch]);

  const handleAttack = async () => {
    if (defenderHealth <= 0) {
      log(`${defender.username} is already defeated.`);
      return;
    }

    if (attackerHealth <= 0) {
      log("You're too weak to fight!");
      return;
    }

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
        log(data.message);
      }

      if (data.defenderHealth !== undefined) {
        setDefenderHealth(data.defenderHealth);
        log(data.message);

        if (data.defenderHealth <= 0) {
          log(`💥 ${defender.username} has been defeated!`);

          setTimeout(() => {
            dispatch(fetchGameData(attacker.id));
          }, 500);

          if (data.attackerXP && data.attackerLevel && data.combatCompleted) {
            alert(
              `🏅 Victory!\nXP: ${data.attackerXP}\nLevel: ${data.attackerLevel}\nCoins: +1`
            );
          } else {
            alert("🏅 Victory! Stats will update shortly.");
          }
        }
      }

      socket.current.emit("attackMove", {
        attackerId: attacker.id,
        defenderId: defender.id,
        damage,
      });
    } catch (error) {
      const errData = await error.json();
      const fallback = "Attack failed.";
      log(errData.message || fallback);
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
      dispatch(fetchGameData(attacker.id));
      log(data.message);

      socket.current.emit("healMove", {
        userId: attacker.id,
        targetId: defender.id,
        healAmount,
        type: "manual",
      });
    } catch (err) {
      console.error("Manual heal failed:", err);
      log("Healing failed.");
    }
  };

  const handleUseItem = async (itemId) => {
    try {
      const res = await csrfFetch("/api/combat/use-item", {
        method: "POST",
        body: JSON.stringify({ itemId, targetId: defender.id }),
      });

      const data = await res.json();
      log(data.message);

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
      log("Failed to use item.");
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
                      width: `${(hp / (p.maxHealth || 100)) * 100}%`,
                      backgroundColor: hp === 0 ? "crimson" : "limegreen",
                    }}
                  />
                </div>
                <p>
                  {p.username}: {hp}/{p.maxHealth || 100} HP
                </p>
                {isAttacker && (
                  <>
                    <p>
                      XP: {currentXP} / {nextLevelXP}
                    </p>
                    <div className="xp-bar">
                      <div
                        className="xp-fill"
                        style={{ width: `${xpProgress}%` }}
                      />
                    </div>
                  </>
                )}
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
                  💀 You&apos;re knocked out! Heal or use a potion to recover.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="combat-log" ref={logRef}>
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
