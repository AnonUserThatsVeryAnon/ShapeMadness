/**
 * In-Game HUD Component
 * Displays player stats, score, and aim mode during gameplay
 */
import { AimMode } from "../systems/AimingSystem";

interface GameHUDProps {
  aimMode: AimMode;
  onToggleAimMode: () => void;
}

export function GameHUD({ aimMode, onToggleAimMode }: GameHUDProps) {
  return (
    <div
      className={`aim-mode-indicator ${
        aimMode === AimMode.MANUAL ? "manual" : ""
      }`}
      onClick={onToggleAimMode}
      title="Click or press Q to toggle aim mode"
    >
      {aimMode === AimMode.MANUAL ? "🎯 Manual" : "🤖 Auto"}
    </div>
  );
}
