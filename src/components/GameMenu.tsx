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
    <div className="menu-overlay">
      <h1 className="game-title">SHAPE MADNESS</h1>
      <p className="game-subtitle">Survive the endless waves!</p>
      <button className="menu-button" onClick={onStartGame}>
        START GAME
      </button>
      <button
        className="menu-button"
        onClick={onShowCodex}
        style={{
          backgroundColor: "#4ecdcb",
          fontSize: "16px",
          marginTop: "10px",
        }}
      >
        📖 VIEW CODEX
      </button>
      {highScore > 0 && (
        <p className="high-score">High Score: {highScore.toLocaleString()}</p>
      )}
      <div className="controls-info">
        <p>
          <strong>WASD</strong> - Move
        </p>
        <p>
          <strong>Q</strong> - Toggle Auto/Manual Aim
        </p>
        <p>
          <strong>Auto-Shoot</strong> - Target nearest enemy
        </p>
        <p>
          <strong>ESC</strong> - Pause
        </p>
      </div>
    </div>
  );
}
