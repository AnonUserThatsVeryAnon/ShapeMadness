import { GameState } from "../types/game";

interface GameMenuProps {
  highScore: number;
  onStartGame: () => void;
  onShowCodex: () => void;
}

export function GameMenu({
  highScore,
  onStartGame,
  onShowCodex,
}: GameMenuProps) {
  return (
    <div className="menu">
      <div className="menu-content">
        <h1>🎮 Mouse Defense</h1>
        <p className="subtitle">Survive the endless waves!</p>

        <div className="menu-buttons">
          <button onClick={onStartGame} className="btn-primary">
            ▶ Start Game
          </button>
          <button onClick={onShowCodex} className="btn-secondary">
            📚 Enemy Codex
          </button>
        </div>

        {highScore > 0 && (
          <div className="high-score">
            <p>High Score: {highScore.toLocaleString()}</p>
          </div>
        )}

        <div className="controls-info">
          <h3>Controls</h3>
          <p>🎮 WASD / Arrow Keys - Move</p>
          <p>🖱️ Mouse - Auto-aim & shoot</p>
          <p>⏸️ ESC - Pause</p>
        </div>
      </div>
    </div>
  );
}
