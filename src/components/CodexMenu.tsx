import { useState, useMemo, useEffect } from "react";
import { ENEMY_CARDS } from "../utils/codex";
import { getCodexState, getDiscoveryTime } from "../utils/codexProgress";
import { EnemyType } from "../types/game";
import "./CodexMenu.css";

interface CodexMenuProps {
  onClose: () => void;
}

type FilterType = "all" | "discovered" | "locked" | "implemented";

export function CodexMenu({ onClose }: CodexMenuProps) {
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const codexState = getCodexState();

  // Get all enemy cards sorted by unlock round
  const allEnemies = useMemo(() => {
    return Object.entries(ENEMY_CARDS)
      .map(([type, card]) => ({
        type: type as EnemyType,
        card,
        discovered: codexState.discoveredEnemies.has(type as EnemyType),
        discoveryTime: getDiscoveryTime(type as EnemyType),
      }))
      .sort((a, b) => a.card.unlockRound - b.card.unlockRound);
  }, [codexState.discoveredEnemies]);

  // Filter enemies based on current filter
  const filteredEnemies = useMemo(() => {
    switch (filter) {
      case "discovered":
        return allEnemies.filter((e) => e.discovered);
      case "locked":
        return allEnemies.filter((e) => !e.discovered);
      case "implemented":
        return allEnemies.filter((e) => e.card.implemented);
      default:
        return allEnemies;
    }
  }, [allEnemies, filter]);

  const selectedCard = selectedEnemy
    ? allEnemies.find((e) => e.type === selectedEnemy)
    : null;

  const formatDiscoveryTime = (timestamp: number | null) => {
    if (!timestamp) return "Not discovered yet";
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Achievement tracking
  const achievements = useMemo(() => {
    const implementedEnemies = allEnemies.filter((e) => e.card.implemented);
    const discoveredImplemented = implementedEnemies.filter(
      (e) => e.discovered
    );

    return [
      {
        id: "collector",
        name: "Collector",
        description: "Discover 5 enemies",
        icon: "🏆",
        unlocked: codexState.discoveredEnemies.size >= 5,
        progress: `${codexState.discoveredEnemies.size}/5`,
      },
      {
        id: "researcher",
        name: "Researcher",
        description: "Discover all implemented enemies",
        icon: "🔬",
        unlocked:
          discoveredImplemented.length === implementedEnemies.length &&
          implementedEnemies.length > 0,
        progress: `${discoveredImplemented.length}/${implementedEnemies.length}`,
      },
      {
        id: "completionist",
        name: "Completionist",
        description: "Discover all enemies",
        icon: "⭐",
        unlocked: codexState.discoveredEnemies.size === codexState.totalEnemies,
        progress: `${codexState.discoveredEnemies.size}/${codexState.totalEnemies}`,
      },
    ];
  }, [codexState, allEnemies]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (!selectedEnemy && filteredEnemies.length > 0) {
        // Auto-select first enemy when pressing arrow keys
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          setSelectedEnemy(filteredEnemies[0].type);
          e.preventDefault();
        }
        return;
      }

      if (!selectedEnemy) return;

      const currentIndex = filteredEnemies.findIndex(
        (e) => e.type === selectedEnemy
      );
      if (currentIndex === -1) return;

      const gridColumns = window.innerWidth > 768 ? 4 : 2; // Approximate grid columns

      switch (e.key) {
        case "ArrowRight": {
          const nextIndex = (currentIndex + 1) % filteredEnemies.length;
          setSelectedEnemy(filteredEnemies[nextIndex].type);
          e.preventDefault();
          break;
        }
        case "ArrowLeft": {
          const prevIndex =
            (currentIndex - 1 + filteredEnemies.length) %
            filteredEnemies.length;
          setSelectedEnemy(filteredEnemies[prevIndex].type);
          e.preventDefault();
          break;
        }
        case "ArrowDown": {
          const downIndex = Math.min(
            currentIndex + gridColumns,
            filteredEnemies.length - 1
          );
          setSelectedEnemy(filteredEnemies[downIndex].type);
          e.preventDefault();
          break;
        }
        case "ArrowUp": {
          const upIndex = Math.max(currentIndex - gridColumns, 0);
          setSelectedEnemy(filteredEnemies[upIndex].type);
          e.preventDefault();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEnemy, filteredEnemies, onClose]);

  return (
    <div className="codex-menu">
      {/* Header */}
      <div className="codex-header">
        <div className="codex-title-section">
          <h1 className="codex-title">📖 ENEMY CODEX</h1>
          <p className="codex-subtitle">
            Your collection of discovered enemies
          </p>
        </div>
        <div className="codex-stats">
          <div className="codex-stat">
            <span className="stat-number">
              {codexState.discoveredEnemies.size}
            </span>
            <span className="stat-label">Discovered</span>
          </div>
          <div className="codex-stat">
            <span className="stat-number">{codexState.totalEnemies}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="codex-stat">
            <span className="stat-number">
              {Math.round(codexState.completionPercentage)}%
            </span>
            <span className="stat-label">Complete</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="codex-progress-bar">
        <div
          className="codex-progress-fill"
          style={{ width: `${codexState.completionPercentage}%` }}
        />
      </div>

      {/* Achievements */}
      <div className="achievements-section">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`achievement ${
              achievement.unlocked ? "unlocked" : "locked"
            }`}
            title={achievement.description}
          >
            <span className="achievement-icon">{achievement.icon}</span>
            <div className="achievement-info">
              <span className="achievement-name">{achievement.name}</span>
              <span className="achievement-progress">
                {achievement.progress}
              </span>
            </div>
            {achievement.unlocked && (
              <span className="achievement-check">✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="codex-filters">
        <button
          className={`filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({allEnemies.length})
        </button>
        <button
          className={`filter-button ${filter === "discovered" ? "active" : ""}`}
          onClick={() => setFilter("discovered")}
        >
          Discovered ({allEnemies.filter((e) => e.discovered).length})
        </button>
        <button
          className={`filter-button ${filter === "locked" ? "active" : ""}`}
          onClick={() => setFilter("locked")}
        >
          Locked ({allEnemies.filter((e) => !e.discovered).length})
        </button>
        <button
          className={`filter-button ${
            filter === "implemented" ? "active" : ""
          }`}
          onClick={() => setFilter("implemented")}
        >
          Implemented ({allEnemies.filter((e) => e.card.implemented).length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="codex-content">
        {/* Enemy Grid */}
        <div className="codex-grid">
          {filteredEnemies.map(({ type, card, discovered }) => (
            <button
              key={type}
              className={`codex-card ${discovered ? "discovered" : "locked"} ${
                selectedEnemy === type ? "selected" : ""
              } ${card.implemented ? "implemented" : "placeholder"}`}
              onClick={() => setSelectedEnemy(type)}
            >
              <div
                className="codex-card-icon"
                style={{
                  backgroundColor: discovered ? card.color : "#333",
                }}
              >
                {discovered ? card.icon : "🔒"}
              </div>
              <div className="codex-card-name">
                {discovered ? card.name : "???"}
              </div>
              <div className="codex-card-unlock">Round {card.unlockRound}</div>
              {!card.implemented && (
                <div className="coming-soon-badge">Coming Soon</div>
              )}
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedCard && (
          <div className="codex-detail-panel">
            {selectedCard.discovered ? (
              <>
                {/* Discovered Enemy Details */}
                <div className="detail-header">
                  <div
                    className="detail-icon"
                    style={{ backgroundColor: selectedCard.card.color }}
                  >
                    {selectedCard.card.icon}
                  </div>
                  <div>
                    <h2 className="detail-name">{selectedCard.card.name}</h2>
                    <p className="detail-unlock">
                      Unlocked at Round {selectedCard.card.unlockRound}
                    </p>
                    <p className="detail-discovery-time">
                      Discovered:{" "}
                      {formatDiscoveryTime(selectedCard.discoveryTime)}
                    </p>
                  </div>
                </div>

                <p className="detail-description">
                  {selectedCard.card.description}
                </p>

                {/* Stats */}
                <div className="detail-stats">
                  <div className="detail-stat">
                    <span className="detail-stat-label">HEALTH</span>
                    <span className="detail-stat-value">
                      {selectedCard.card.stats.health} HP
                    </span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">SPEED</span>
                    <span className="detail-stat-value">
                      {selectedCard.card.stats.speed}
                    </span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">DAMAGE</span>
                    <span className="detail-stat-value">
                      {selectedCard.card.stats.damage}
                    </span>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">MONEY</span>
                    <span className="detail-stat-value">
                      ${selectedCard.card.stats.value}
                    </span>
                  </div>
                </div>

                {/* Abilities */}
                {selectedCard.card.abilities.length > 0 && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Special Abilities</h3>
                    <ul className="detail-list">
                      {selectedCard.card.abilities.map((ability, idx) => (
                        <li key={idx} className="detail-list-item">
                          <span className="detail-bullet">▸</span>
                          {ability}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tips */}
                {selectedCard.card.tips.length > 0 && (
                  <div className="detail-section">
                    <h3 className="detail-section-title">Strategy Tips</h3>
                    <ul className="detail-list">
                      {selectedCard.card.tips.map((tip, idx) => (
                        <li key={idx} className="detail-list-item tip">
                          <span className="detail-bullet">💡</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              /* Locked Enemy */
              <div className="locked-detail">
                <div className="locked-icon">🔒</div>
                <h2 className="locked-title">Enemy Locked</h2>
                <p className="locked-description">
                  Discover this enemy in battle to unlock their information!
                </p>
                <p className="locked-hint">
                  Appears starting at Round {selectedCard.card.unlockRound}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Close Button */}
      <button className="codex-close-button" onClick={onClose}>
        ← Back to Menu
      </button>
    </div>
  );
}
