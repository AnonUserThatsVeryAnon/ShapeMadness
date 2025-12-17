interface GameOverProps {
  score: number;
  round: number;
  kills: number;
  highScore: number;
  onRestart?: () => void;
  onMainMenu: () => void;
  damageDealt?: number;
  damageTaken?: number;
  moneyEarned?: number;
  moneySpent?: number;
  shotsFired?: number;
  shotsHit?: number;
  powerUpsCollected?: number;
  timePlayedMs?: number;
}

export function GameOver({
  score,
  round,
  kills,
  highScore,
  onMainMenu,
  damageDealt = 0,
  damageTaken = 0,
  moneyEarned = 0,
  moneySpent = 0,
  shotsFired = 0,
  shotsHit = 0,
  powerUpsCollected = 0,
  timePlayedMs = 0,
}: GameOverProps) {
  const isNewHighScore = score === highScore && score > 0;
  const accuracy =
    shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : "0.0";
  const timeInSeconds = Math.floor(timePlayedMs / 1000);
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="menu-overlay game-over-overlay">
      <h1 className="game-over-title">💀 GAME OVER</h1>

      <div className="game-over-container">
        {/* Main Stats */}
        <div className="final-stats-main">
          <div className="stat-highlight">
            <span className="stat-label">Wave Reached</span>
            <span className="stat-value">{round}</span>
          </div>
          <div className="stat-highlight">
            <span className="stat-label">Final Score</span>
            <span className="stat-value">{score.toLocaleString()}</span>
          </div>
          <div className="stat-highlight">
            <span className="stat-label">Total Kills</span>
            <span className="stat-value">{kills}</span>
          </div>
          {isNewHighScore && (
            <p className="new-record">🏆 NEW HIGH SCORE! 🏆</p>
          )}
        </div>

        {/* Detailed Statistics */}
        <div className="detailed-stats">
          <h3 className="stats-section-title">📊 Game Statistics</h3>

          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-icon">⚔️</span>
              <span className="stat-text">Damage Dealt</span>
              <span className="stat-number">
                {damageDealt.toLocaleString()}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">💔</span>
              <span className="stat-text">Damage Taken</span>
              <span className="stat-number">
                {damageTaken.toLocaleString()}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">🎯</span>
              <span className="stat-text">Accuracy</span>
              <span className="stat-number">{accuracy}%</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">🔫</span>
              <span className="stat-text">Shots Fired</span>
              <span className="stat-number">{shotsFired.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">💰</span>
              <span className="stat-text">Money Earned</span>
              <span className="stat-number">
                ${moneyEarned.toLocaleString()}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">💸</span>
              <span className="stat-text">Money Spent</span>
              <span className="stat-number">
                ${moneySpent.toLocaleString()}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">✨</span>
              <span className="stat-text">Power-Ups Collected</span>
              <span className="stat-number">{powerUpsCollected}</span>
            </div>
            <div className="stat-row">
              <span className="stat-icon">⏱️</span>
              <span className="stat-text">Time Survived</span>
              <span className="stat-number">{timeString}</span>
            </div>
          </div>
        </div>
      </div>

      <button className="menu-button" onClick={onMainMenu}>
        MAIN MENU
      </button>
    </div>
  );
}
