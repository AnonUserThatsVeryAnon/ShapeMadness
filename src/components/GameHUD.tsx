/**
 * In-Game HUD Component
 * Displays player stats, score, and aim mode during gameplay
 */
import { AimMode } from "../systems/AimingSystem";

interface GameHUDProps {
  aimMode: AimMode;
  onToggleAimMode: () => void;
  isTestMode?: boolean;
}

export function GameHUD({
  aimMode,
  onToggleAimMode,
  isTestMode,
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
