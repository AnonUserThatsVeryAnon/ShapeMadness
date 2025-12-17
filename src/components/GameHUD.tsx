/**
 * In-Game HUD Component
 * Displays player stats, score, and aim mode during gameplay
 */
import { AimMode } from "../systems/AimingSystem";
import type { PowerUpType } from "../types/game";

interface GameHUDProps {
  aimMode: AimMode;
  onToggleAimMode: () => void;
  isTestMode?: boolean;
  isDebugRun?: boolean;
  powerUpInventory: (PowerUpType | null)[];
}

// Powerup icons and names
const POWERUP_INFO: Record<
  string,
  { icon: string; name: string; color: string }
> = {
  HEALTH: { icon: "❤️", name: "Health", color: "#ff6b6b" },
  SPEED: { icon: "⚡", name: "Speed", color: "#4ecdc4" },
  DAMAGE: { icon: "💪", name: "Damage", color: "#ff9f43" },
  FIRE_RATE: { icon: "🔫", name: "Fire Rate", color: "#feca57" },
  SHIELD: { icon: "🛡️", name: "Shield", color: "#48dbfb" },
};

export function GameHUD({
  aimMode,
  onToggleAimMode,
  isTestMode,
  isDebugRun,
  powerUpInventory,
}: GameHUDProps) {
  return (
    <>
      <div
        className={`aim-mode-indicator ${
          aimMode === AimMode.MANUAL ? "manual" : ""
        }`}
        onClick={onToggleAimMode}
        title="Click or press Q to toggle aim mode"
      >
        {aimMode === AimMode.MANUAL ? "🎯 Manual" : "🤖 Auto"}
      </div>

      {/* Powerup Inventory Display - Minimalistic */}
      <div className="powerup-inventory-hud">
        {powerUpInventory.map((powerUp, index) => (
          <div
            key={index}
            className={`powerup-slot-mini ${powerUp ? "filled" : "empty"}`}
            title={
              powerUp
                ? `${POWERUP_INFO[powerUp]?.name} (Press ${index + 1})`
                : `Slot ${index + 1} - Empty`
            }
          >
            <kbd className="slot-key">{index + 1}</kbd>
            {powerUp && (
              <span
                className="powerup-icon-mini"
                style={{ color: POWERUP_INFO[powerUp]?.color }}
              >
                {POWERUP_INFO[powerUp]?.icon}
              </span>
            )}
          </div>
        ))}
      </div>
      {(isTestMode || isDebugRun) && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: isTestMode
              ? "rgba(78, 205, 203, 0.9)"
              : "rgba(255, 100, 0, 0.9)",
            color: isTestMode ? "#000" : "#fff",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "16px",
            boxShadow: isTestMode
              ? "0 0 20px rgba(78, 205, 203, 0.5)"
              : "0 0 20px rgba(255, 100, 0, 0.5)",
            zIndex: 100,
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          {isTestMode ? "🧪 SANDBOX MODE" : "🧪 DEBUG MODE"}{" "}
          {isTestMode && (
            <>
              <kbd
                style={{
                  background: "#fff",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  marginRight: "4px",
                }}
              >
                T
              </kbd>{" "}
              to spawn •{" "}
              <kbd
                style={{
                  background: "#fff",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  marginLeft: "4px",
                }}
              >
                B
              </kbd>{" "}
              for shop
            </>
          )}
          {isDebugRun && "Not eligible for leaderboard"}
        </div>
      )}
    </>
  );
}
