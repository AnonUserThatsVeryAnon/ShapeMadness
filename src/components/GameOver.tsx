interface GameOverProps {
  score: number;
  round: number;
  kills: number;
  highScore: number;
  onRestart?: () => void;
  onMainMenu: () => void;
}

export function GameOver({
  score,
  round,
  kills,
  highScore,
  onMainMenu,
}: GameOverProps) {
  const isNewHighScore = score === highScore && score > 0;

  return (
    <div className="menu-overlay game-over-overlay">
      <h1 className="game-over-title">💀 GAME OVER</h1>
      <div className="final-stats">
        <p>
          Final Score: <strong>{score.toLocaleString()}</strong>
        </p>
        <p>
          Round Reached: <strong>{round}</strong>
        </p>
        <p>
          Total Kills: <strong>{kills}</strong>
        </p>
        {isNewHighScore && <p className="new-record">🏆 NEW HIGH SCORE! 🏆</p>}
      </div>
      <button className="menu-button" onClick={onMainMenu}>
        MAIN MENU
      </button>
    </div>
  );
}
