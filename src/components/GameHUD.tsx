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
  powerUpInventory: (PowerUpType | null)[];
  currentRound: number;
  lastDash?: number;
  dashCooldown: number;
  now: number;
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
  powerUpInventory,
  currentRound,
  lastDash,
  dashCooldown,
  now,
}: GameHUDProps) {
  // Calculate dash cooldown progress
  const isDashUnlocked = currentRound >= 15;
  const timeSinceLastDash = lastDash ? now - lastDash : Infinity;
  const isDashReady = timeSinceLastDash >= dashCooldown;
  const dashCooldownPercent = isDashReady
    ? 100
    : Math.min(100, (timeSinceLastDash / dashCooldown) * 100);

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

      {/* Dash Cooldown Indicator (only if unlocked) */}
      {isDashUnlocked && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "60px",
            height: "60px",
            backgroundColor: isDashReady
              ? "rgba(78, 205, 203, 0.9)"
              : "rgba(50, 50, 50, 0.7)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "bold",
            color: isDashReady ? "#fff" : "#666",
            border: `3px solid ${isDashReady ? "#4ecdc4" : "#333"}`,
            boxShadow: isDashReady
              ? "0 0 20px rgba(78, 205, 203, 0.5)"
              : "none",
            zIndex: 50,
          }}
          title={
            isDashReady
              ? "Dash Ready (Space)"
              : `Dash Cooldown: ${Math.ceil(
                  (dashCooldown - timeSinceLastDash) / 1000
                )}s`
          }
        >
          {/* Cooldown overlay */}
          {!isDashReady && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: `conic-gradient(transparent ${dashCooldownPercent}%, rgba(0, 0, 0, 0.6) ${dashCooldownPercent}%)`,
              }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>⚡</span>
        </div>
      )}

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
      {isTestMode && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(78, 205, 203, 0.9)",
            color: "#000",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            fontSize: "16px",
            boxShadow: "0 0 20px rgba(78, 205, 203, 0.5)",
            zIndex: 100,
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          🧪 SANDBOX MODE • Press{" "}
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
        </div>
      )}
    </>
  );
}
