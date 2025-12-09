import { useEffect, useState } from "react";
import { ENEMY_CARDS } from "../utils/codex";
import { EnemyType } from "../types/game";
import "./EnemyCard.css";

interface EnemyCardProps {
  enemyType: EnemyType;
  onClose: () => void;
}

export function EnemyCard({ enemyType, onClose }: EnemyCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const card = ENEMY_CARDS[enemyType];

  // Generate confetti positions once on mount
  const [confettiParticles] = useState(() =>
    [...Array(20)].map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      rotation: Math.random() * 360,
    }))
  );

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
      handleClose();
    }
  };

  return (
    <div
      className={`card-overlay ${isVisible ? "visible" : ""}`}
      onClick={handleClose}
      onKeyDown={handleKeyPress}
      role="dialog"
      aria-modal="true"
      aria-labelledby="enemy-card-title"
    >
      <div
        className={`enemy-card ${isVisible ? "visible" : ""}`}
        onClick={(e) => e.stopPropagation()}
        style={{ "--enemy-color": card.color } as React.CSSProperties}
      >
        {/* Header with icon and title */}
        <div className="card-header">
          <div className="enemy-icon" style={{ backgroundColor: card.color }}>
            {card.icon}
          </div>
          <div className="card-title-section">
            <div className="new-badge">NEW ENEMY DISCOVERED!</div>
            <h2 id="enemy-card-title" className="enemy-name">
              {card.name}
            </h2>
            <p className="enemy-unlock">Unlocked at Round {card.unlockRound}</p>
          </div>
        </div>

        {/* Description */}
        <p className="enemy-description">{card.description}</p>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">HEALTH</div>
            <div className="stat-value">{card.stats.health} HP</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">SPEED</div>
            <div className="stat-value">{card.stats.speed}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">DAMAGE</div>
            <div className="stat-value">{card.stats.damage}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">MONEY</div>
            <div className="stat-value">${card.stats.value}</div>
          </div>
        </div>

        {/* Abilities */}
        {card.abilities.length > 0 && (
          <div className="abilities-section">
            <h3 className="section-title">Special Abilities</h3>
            <ul className="abilities-list">
              {card.abilities.map((ability, index) => (
                <li key={index} className="ability-item">
                  <span className="ability-bullet">▸</span>
                  {ability}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategy Tips */}
        {card.tips.length > 0 && (
          <div className="tips-section">
            <h3 className="section-title">Strategy Tips</h3>
            <ul className="tips-list">
              {card.tips.map((tip, index) => (
                <li key={index} className="tip-item">
                  <span className="tip-bullet">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <button className="close-button" onClick={handleClose}>
          Continue Playing
          <span className="close-hint">(Press any key)</span>
        </button>
      </div>

      {/* Celebration Confetti */}
      {isVisible && (
        <>
          {confettiParticles.map((particle, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${particle.left}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                backgroundColor: i % 2 === 0 ? card.color : "#ffd700",
                transform: `rotate(${particle.rotation}deg)`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
