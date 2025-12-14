import React, { useEffect, useState } from "react";
import { getTopScores, type LeaderboardEntry } from "../config/supabase";
import "./LeaderboardMenu.css";

interface LeaderboardMenuProps {
  onBack: () => void;
}

export const LeaderboardMenu: React.FC<LeaderboardMenuProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getTopScores(10);
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="leaderboard-menu">
      <div className="leaderboard-content">
        <h1 className="leaderboard-title">🏆 LEADERBOARD 🏆</h1>

        {loading ? (
          <div className="leaderboard-loading">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="leaderboard-empty">No scores yet. Be the first!</div>
        ) : (
          <div className="leaderboard-list">
            <div className="leaderboard-header">
              <span className="rank-col">Rank</span>
              <span className="name-col">Player</span>
              <span className="score-col">Score</span>
              <span className="wave-col">Wave</span>
              <span className="date-col">Date</span>
            </div>
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className={`leaderboard-entry ${
                  index < 3 ? `rank-${index + 1}` : ""
                }`}
              >
                <span className="rank-col">
                  {index === 0
                    ? "🥇"
                    : index === 1
                    ? "🥈"
                    : index === 2
                    ? "🥉"
                    : `#${index + 1}`}
                </span>
                <span className="name-col">{entry.player_name}</span>
                <span className="score-col">
                  {entry.score.toLocaleString()}
                </span>
                <span className="wave-col">{entry.wave}</span>
                <span className="date-col">{formatDate(entry.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="leaderboard-actions">
          <button className="btn btn-back" onClick={onBack}>
            Back to Menu
          </button>
          <button className="btn btn-refresh" onClick={loadLeaderboard}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
