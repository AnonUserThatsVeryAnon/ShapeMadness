import React, { useEffect, useState } from "react";
import {
  getTopScores,
  getTotalEntries,
  type LeaderboardEntry,
} from "../config/supabase";
import "./LeaderboardMenu.css";

interface LeaderboardMenuProps {
  onBack: () => void;
}

export const LeaderboardMenu: React.FC<LeaderboardMenuProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageSize] = useState(20);

  const loadLeaderboard = async (reset: boolean = true) => {
    if (reset) {
      setLoading(true);
      const data = await getTopScores(pageSize, 0);
      setEntries(data);
      setHasMore(data.length === pageSize);
      setLoading(false);
    } else {
      setLoadingMore(true);
      const data = await getTopScores(pageSize, entries.length);
      setEntries([...entries, ...data]);
      setHasMore(data.length === pageSize);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadLeaderboard(true);
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
        <p className="leaderboard-subtitle">Ranked by highest wave reached</p>

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
                <span className="wave-col">Wave {entry.wave}</span>
                <span className="date-col">{formatDate(entry.created_at)}</span>
              </div>
            ))}
          </div>
        )}

        {!loading && entries.length > 0 && hasMore && (
          <div className="leaderboard-load-more">
            <button
              className="btn btn-load-more"
              onClick={() => loadLeaderboard(false)}
              disabled={loadingMore}
            >
              {loadingMore
                ? "Loading..."
                : `Load More (${entries.length} shown)`}
            </button>
          </div>
        )}

        <div className="leaderboard-actions">
          <button className="btn btn-back" onClick={onBack}>
            Back to Menu
          </button>
          <button
            className="btn btn-refresh"
            onClick={() => loadLeaderboard(true)}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
