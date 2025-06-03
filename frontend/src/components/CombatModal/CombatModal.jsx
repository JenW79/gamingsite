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
  const socket = useRef(null);

  console.log("🧪 VITE_SOCKET_URL at runtime:", import.meta.env.VITE_SOCKET_URL);

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.current.emit("register", attacker.id);

    const fightId = `${attacker.id}-${defender.id}-${Date.now()}`;
    socket.current.emit("startFight", {
      attackerId: attacker.id,
      defenderId: defender.id,
      fightId,
    });

    setCombatLog((log) => [...log, `You attacked ${defender.username}!`]);

    return () => {
      socket.current?.disconnect();
    };
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
      } catch {
        console.log("No active combat found.");
        setAttackerHealth(attacker.health ?? 100);

        try {
          const profileRes = await csrfFetch(`/api/profiles/${defender.id}`);
          const profileData = await profileRes.json();
          const health = profileData.health ?? 100;
          setDefenderHealth(health);
          if (health <= 0) {
            setCombatLog((log) => [...log, `${profileData.username} is already defeated.`]);
          }
        } catch (fallbackErr) {
          console.error("Failed to load fallback defender profile:", fallbackErr);
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
    if (defenderHealth <= 0) return setCombatLog((log) => [...log, `${defender.username} is already defeated.`]);
    if (attackerHealth <= 0) return setCombatLog((log) => [...log, "You're too weak to fight!"]);

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

      if (data.updatedCombat) {
        const isAttacker = data.updatedCombat.attackerId === attacker.id;
        setAttackerHealth(isAttacker ? data.updatedCombat.attackerHP : data.updatedCombat.defenderHP);
        setDefenderHealth(isAttacker ? data.updatedCombat.defenderHP : data.updatedCombat.attackerHP);
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
                <img src={p.avatarUrl} alt={p.username} />
                <div className="hp-bar">
                  <div
                    className="hp-fill"
                    style={{
                      width: `${hp}%`,
                      backgroundColor: hp === 0 ? "crimson" : "limegreen",
                    }}
                  />
                </div>
                <p>{p.username}: {hp}/100 HP</p>
              </div>
            );
          })}
        </div>

        <div className="combat-controls">
          <button onClick={handleAttack} disabled={defenderHealth === 0}>Attack</button>
          <button onClick={handleManualHeal} disabled={attackerHealth === 0}>Heal</button>
        </div>

        {inventory?.length > 0 && (
          <div className="combat-inventory">
            <h4>Use an Item</h4>
            <div className="combat-item-buttons">
              {inventory.filter(i => i.type === "potion" || i.damage > 0).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleUseItem(item.id)}
                  disabled={attackerHealth === 0 || item.quantity <= 0}
                  className="combat-item-button"
                >
                  {item.name} ({item.quantity})
                </button>
              ))}
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

