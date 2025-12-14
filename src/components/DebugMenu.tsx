import { useState } from "react";

interface DebugMenuProps {
  onClose: () => void;
  onStartDebug: (targetRound: number) => void;
  onStartTestMode?: () => void;
}

export function DebugMenu({
  onClose,
  onStartDebug,
  onStartTestMode,
}: DebugMenuProps) {
  const [debugRound, setDebugRound] = useState(15);

  // Calculate scaled values based on round
  const startingMoney = Math.max(500, debugRound * 5000);
  const damageLevels = Math.min(20, Math.floor(debugRound * 1.3));
  const fireRateLevels = Math.min(15, Math.floor(debugRound));
  const healthLevels = Math.min(10, Math.floor(debugRound * 0.7));
  const speedLevels = Math.min(20, Math.floor(debugRound * 1.3));
  const defenseLevels = Math.min(5, Math.floor(debugRound * 0.3));

  return (
    <div className="menu-overlay" style={{ zIndex: 1001 }}>
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          padding: "40px",
          borderRadius: "15px",
          border: "3px solid #ff6b1a",
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            color: "#ff6b1a",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          🛠️ DEBUG MODE
        </h2>
        <p
          style={{
            marginBottom: "30px",
            color: "#ccc",
            textAlign: "center",
          }}
        >
          Start at a specific round with scaled upgrades and money.
        </p>

        <div style={{ marginBottom: "30px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Select Starting Round:
          </label>
          <input
            type="range"
            min="1"
            max="30"
            value={debugRound}
            onChange={(e) => setDebugRound(Number(e.target.value))}
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              outline: "none",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#aaa",
              fontSize: "14px",
            }}
          >
            <span>Round 1</span>
            <span
              style={{
                color: "#ff6b1a",
                fontSize: "28px",
                fontWeight: "bold",
                textShadow: "0 0 10px rgba(255, 107, 26, 0.5)",
              }}
            >
              Round {debugRound}
            </span>
            <span>Round 30</span>
          </div>
        </div>

        <div
          style={{
            marginBottom: "25px",
            padding: "20px",
            backgroundColor: "rgba(255, 107, 26, 0.1)",
            borderRadius: "8px",
            fontSize: "14px",
            border: "1px solid rgba(255, 107, 26, 0.3)",
          }}
        >
          <p style={{ marginBottom: "8px", color: "#fff" }}>
            <strong>💰 Starting Money:</strong> ${startingMoney}
          </p>
          <p style={{ marginBottom: "8px", color: "#fff" }}>
            <strong>⚔️ Damage Upgrades:</strong> {damageLevels} levels
          </p>
          <p style={{ marginBottom: "8px", color: "#fff" }}>
            <strong>🔫 Fire Rate Upgrades:</strong> {fireRateLevels} levels
          </p>
          <p style={{ marginBottom: "8px", color: "#fff" }}>
            <strong>❤️ Health Upgrades:</strong> {healthLevels} levels
          </p>
          <p style={{ marginBottom: "8px", color: "#fff" }}>
            <strong>⚡ Speed Upgrades:</strong> {speedLevels} levels
          </p>
          <p style={{ color: "#fff" }}>
            <strong>🛡️ Defense Upgrades:</strong> {defenseLevels} levels
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "10px",
          }}
        >
          <button
            className="menu-button"
            onClick={() => onStartDebug(debugRound)}
            style={{
              backgroundColor: "#ff6b1a",
              flex: 1,
              padding: "15px",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            START AT ROUND {debugRound}
          </button>
        </div>

        {onStartTestMode && (
          <div style={{ marginBottom: "10px" }}>
            <button
              className="menu-button"
              onClick={onStartTestMode}
              style={{
                backgroundColor: "#4ecdcb",
                width: "100%",
                padding: "15px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              🧪 TEST MODE (No Timer, Spawn with T)
            </button>
          </div>
        )}

        <button
          className="menu-button"
          onClick={onClose}
          style={{
            backgroundColor: "#666",
            width: "100%",
            padding: "15px",
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
