import { useEffect, useState } from "react";
import { getTopScores, type LeaderboardEntry } from "../config/supabase";

interface GameMenuProps {
  highScore: number;
  onStartGame: () => void;
  onShowCodex: () => void;
  onDebugMode?: () => void;
}

export function GameMenu({
  highScore,
  onStartGame,
  onShowCodex,
  onDebugMode,
}: GameMenuProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      const data = await getTopScores(5);
      setLeaderboard(data);
      setLoading(false);
    };
    void loadLeaderboard();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="menu-overlay">
      <div className="menu-main-content">
        <h1
          className="game-title"
          onClick={onDebugMode}
          style={onDebugMode ? { cursor: "pointer" } : undefined}
          title={
            onDebugMode
              ? "Click to start at Wave 15 with max upgrades (Debug Mode)"
              : undefined
          }
        >
          SHAPE MADNESS
        </h1>
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

      {/* Leaderboard Side Panel */}
      <div className="menu-leaderboard-panel">
        <h2 className="leaderboard-panel-title">🏆 TOP PLAYERS</h2>
        {loading ? (
          <div className="leaderboard-panel-loading">Loading...</div>
        ) : leaderboard.length === 0 ? (
          <div className="leaderboard-panel-empty">No scores yet!</div>
        ) : (
          <div className="leaderboard-panel-list">
            {leaderboard.map((entry, index) => (
              <div key={entry.id} className="leaderboard-panel-entry">
                <span className="panel-rank">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                </span>
                <div className="panel-info">
                  <div className="panel-name">{entry.player_name}</div>
                  <div className="panel-stats">
                    <span className="panel-score">{entry.score.toLocaleString()}</span>
                    <span className="panel-wave">Wave {entry.wave}</span>
                    <span className="panel-date">{formatDate(entry.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
