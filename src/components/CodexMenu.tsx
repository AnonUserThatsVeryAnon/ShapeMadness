import { useState, useMemo, useEffect } from "react";
import { ENEMY_CARDS } from "../utils/codex";
import { getCodexState, getDiscoveryTime } from "../utils/codexProgress";
import { EnemyType } from "../types/game";
import { createEnemyCanvas } from "../utils/enemyVisuals";
import "./CodexMenu.css";

interface CodexMenuProps {
  onClose: () => void;
}

type FilterType = "all" | "discovered" | "locked" | "implemented" | "boss";

export function CodexMenu({ onClose }: CodexMenuProps) {
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"round" | "threat" | "reward">("round");
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

  // Filter and sort enemies
  const filteredEnemies = useMemo(() => {
    let filtered = allEnemies;

    // Apply filter
    switch (filter) {
      case "discovered":
        filtered = allEnemies.filter((e) => e.discovered);
        break;
      case "locked":
        filtered = allEnemies.filter((e) => !e.discovered);
        break;
      case "implemented":
        filtered = allEnemies.filter((e) => e.card.implemented);
        break;
      case "boss":
        filtered = allEnemies.filter((e) => e.type === EnemyType.OVERSEER);
        break;
      default:
        filtered = allEnemies;
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "threat": {
          const threatA =
            (a.card.stats.health * 0.15 +
              a.card.stats.damage * 3 +
              a.card.stats.speed * 20) /
            100;
          const threatB =
            (b.card.stats.health * 0.15 +
              b.card.stats.damage * 3 +
              b.card.stats.speed * 20) /
            100;
          return threatB - threatA;
        }
        case "reward":
          return b.card.stats.value - a.card.stats.value;
        case "round":
        default:
          return a.card.unlockRound - b.card.unlockRound;
      }
    });
  }, [allEnemies, filter, sortBy]);

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

      {/* Filters and Sort */}
      <div className="codex-controls">
        <div className="codex-filters">
          <button
            className={`filter-button ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({allEnemies.length})
          </button>
          <button
            className={`filter-button ${
              filter === "discovered" ? "active" : ""
            }`}
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
          <button
            className={`filter-button boss-filter ${
              filter === "boss" ? "active" : ""
            }`}
            onClick={() => setFilter("boss")}
          >
            ⚠️ BOSSES (1)
          </button>
        </div>

        {/* Sort Options */}
        <div className="codex-sort">
          <span className="sort-label">Sort by:</span>
          <button
            className={`sort-button ${sortBy === "round" ? "active" : ""}`}
            onClick={() => setSortBy("round")}
          >
            📅 Round
          </button>
          <button
            className={`sort-button ${sortBy === "threat" ? "active" : ""}`}
            onClick={() => setSortBy("threat")}
          >
            ⚠️ Threat
          </button>
          <button
            className={`sort-button ${sortBy === "reward" ? "active" : ""}`}
            onClick={() => setSortBy("reward")}
          >
            💰 Reward
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="codex-content">
        {/* Enemy Grid */}
        <div className="codex-grid">
          {filteredEnemies.map(({ type, card, discovered }) => {
            const enemyCanvas = discovered
              ? createEnemyCanvas(type, card.color, 60)
              : null;

            return (
              <button
                key={type}
                className={`codex-card ${
                  discovered ? "discovered" : "locked"
                } ${selectedEnemy === type ? "selected" : ""} ${
                  card.implemented ? "implemented" : "placeholder"
                }`}
                onClick={() => setSelectedEnemy(type)}
              >
                <div className="codex-card-icon-wrapper">
                  {discovered && enemyCanvas ? (
                    <canvas
                      width="60"
                      height="60"
                      className="codex-card-canvas"
                      ref={(el) => {
                        if (el && enemyCanvas) {
                          const ctx = el.getContext("2d");
                          if (ctx) ctx.drawImage(enemyCanvas, 0, 0);
                        }
                      }}
                      style={{ filter: `drop-shadow(0 0 5px ${card.color})` }}
                    />
                  ) : (
                    <div className="codex-card-icon-locked">🔒</div>
                  )}
                </div>
                <div className="codex-card-name">
                  {discovered ? card.name : "???"}
                </div>
                <div className="codex-card-unlock">
                  Round {card.unlockRound}
                </div>
                {!card.implemented && (
                  <div className="coming-soon-badge">Coming Soon</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selectedCard && (
          <div className="codex-detail-panel">
            {selectedCard.discovered ? (
              <>
                {/* Discovered Enemy Details */}
                <div className="detail-header">
                  <div className="detail-icon-wrapper">
                    <canvas
                      width="80"
                      height="80"
                      className="detail-icon-canvas"
                      ref={(el) => {
                        if (el) {
                          const canvas = createEnemyCanvas(
                            selectedCard.type,
                            selectedCard.card.color,
                            80
                          );
                          const ctx = el.getContext("2d");
                          if (ctx) ctx.drawImage(canvas, 0, 0);
                        }
                      }}
                      style={{
                        filter: `drop-shadow(0 0 8px ${selectedCard.card.color})`,
                      }}
                    />
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

                {/* Stats with visual bars */}
                <div className="detail-stats">
                  <div className="detail-stat">
                    <div className="stat-header">
                      <span className="detail-stat-label">❤️ HEALTH</span>
                      <span className="detail-stat-value">
                        {selectedCard.card.stats.health} HP
                      </span>
                    </div>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar stat-bar-health"
                        style={{
                          width: `${Math.min(
                            (selectedCard.card.stats.health / 500) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-header">
                      <span className="detail-stat-label">⚡ SPEED</span>
                      <span className="detail-stat-value">
                        {selectedCard.card.stats.speed}
                      </span>
                    </div>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar stat-bar-speed"
                        style={{
                          width: `${Math.min(
                            (selectedCard.card.stats.speed / 4) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-header">
                      <span className="detail-stat-label">⚔️ DAMAGE</span>
                      <span className="detail-stat-value">
                        {selectedCard.card.stats.damage}
                      </span>
                    </div>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar stat-bar-damage"
                        style={{
                          width: `${Math.min(
                            (selectedCard.card.stats.damage / 60) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="detail-stat">
                    <div className="stat-header">
                      <span className="detail-stat-label">💰 REWARD</span>
                      <span className="detail-stat-value">
                        ${selectedCard.card.stats.value}
                      </span>
                    </div>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar stat-bar-money"
                        style={{
                          width: `${Math.min(
                            (selectedCard.card.stats.value / 150) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Threat Level Indicator */}
                <div className="threat-level-container">
                  <span className="threat-level-label">THREAT LEVEL:</span>
                  <div className="threat-level-bars">
                    {Array.from({ length: 5 }, (_, i) => {
                      const threatScore =
                        (selectedCard.card.stats.health * 0.15 +
                          selectedCard.card.stats.damage * 3 +
                          selectedCard.card.stats.speed * 20) /
                        100;
                      return (
                        <div
                          key={i}
                          className={`threat-bar ${
                            i < Math.ceil(threatScore) ? "active" : ""
                          }`}
                          style={{
                            backgroundColor:
                              i < Math.ceil(threatScore)
                                ? threatScore >= 4
                                  ? "#ff1a1a"
                                  : threatScore >= 3
                                  ? "#ff6b1a"
                                  : threatScore >= 2
                                  ? "#ffeb3b"
                                  : "#4ecdcb"
                                : "rgba(255,255,255,0.1)",
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="threat-level-text">
                    {(() => {
                      const threatScore =
                        (selectedCard.card.stats.health * 0.15 +
                          selectedCard.card.stats.damage * 3 +
                          selectedCard.card.stats.speed * 20) /
                        100;
                      if (threatScore >= 4) return "EXTREME";
                      if (threatScore >= 3) return "HIGH";
                      if (threatScore >= 2) return "MEDIUM";
                      return "LOW";
                    })()}
                  </span>
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
