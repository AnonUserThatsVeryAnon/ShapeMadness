import { useState } from "react";
import { EnemyType } from "../types/game";
import { ENEMY_CARDS } from "../utils/codex";

interface SpawnMenuProps {
  onClose: () => void;
  onSpawnEnemy: (enemyType: EnemyType, count: number) => void;
}

export function SpawnMenu({ onClose, onSpawnEnemy }: SpawnMenuProps) {
  const [spawnCount, setSpawnCount] = useState(1);

  return (
    <div className="menu-overlay" style={{ zIndex: 1001 }}>
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          padding: "30px",
          borderRadius: "15px",
          border: "3px solid #4ecdcb",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            color: "#4ecdcb",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          🧪 Spawn Enemy
        </h2>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              color: "#fff",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Spawn Count: {spawnCount}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={spawnCount}
            onChange={(e) => setSpawnCount(Number(e.target.value))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          />
        </div>

        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "rgba(78, 205, 203, 0.1)",
            borderRadius: "8px",
            border: "2px solid rgba(78, 205, 203, 0.3)",
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "10px",
            }}
          >
            {Object.values(EnemyType)
              .filter((type) => ENEMY_CARDS[type as EnemyType].implemented)
              .map((enemyType) => {
                const card = ENEMY_CARDS[enemyType as EnemyType];
                return (
                  <button
                    key={enemyType}
                    className="menu-button"
                    onClick={() => {
                      onSpawnEnemy(enemyType as EnemyType, spawnCount);
                    }}
                    style={{
                      backgroundColor: card.color,
                      padding: "12px",
                      fontSize: "13px",
                      fontWeight: "bold",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      transition: "transform 0.1s, box-shadow 0.1s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 0 15px rgba(78, 205, 203, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>{card.icon}</span>
                    <span>{card.name}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        opacity: 0.9,
                        textAlign: "center",
                      }}
                    >
                      HP: {card.stats.health} | DMG: {card.stats.damage}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        <button
          className="menu-button"
          onClick={onClose}
          style={{
            backgroundColor: "#666",
            width: "100%",
            padding: "15px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          ✕ Close (Press T)
        </button>
      </div>
    </div>
  );
}
