interface GameOverProps {
  score: number;
  round: number;
  kills: number;
  highScore: number;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function GameOver({
  score,
  round,
  kills,
  highScore,
  onRestart,
  onMainMenu,
}: GameOverProps) {
  const isNewHighScore = score > highScore;

  return (
    <div className="game-over">
      <div className="game-over-content">
        <h1 className="game-over-title">💀 Game Over</h1>

        {isNewHighScore && (
          <div className="new-high-score">🎉 NEW HIGH SCORE! 🎉</div>
        )}

        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Final Score:</div>
            <div className="stat-value">{score.toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Round Reached:</div>
            <div className="stat-value">{round}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Total Kills:</div>
            <div className="stat-value">{kills}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">High Score:</div>
            <div className="stat-value">
              {Math.max(score, highScore).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="menu-buttons">
          <button onClick={onRestart} className="btn-primary">
            🔄 Play Again
          </button>
          <button onClick={onMainMenu} className="btn-secondary">
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
