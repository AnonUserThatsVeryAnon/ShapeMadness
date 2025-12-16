/**
 * Shop Menu Component
 * Displays upgrade shop between rounds
 */
import type { Player } from "../types/game";
import { UPGRADES, purchaseUpgrade } from "../utils/upgrades";
import { audioSystem } from "../utils/audio";

interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  category: "core" | "special";
  effect: (player: Player) => void;
}

interface ShopMenuProps {
  player: Player;
  round: number;
  waveTimer: number;
  isPaused: boolean;
  shopTab: "core" | "special";
  onShopTabChange: (tab: "core" | "special") => void;
  onSkipWave: () => void;
  onForceUpdate: () => void;
  isTestMode?: boolean;
  onCloseShop?: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

export function ShopMenu({
  player,
  round,
  waveTimer,
  isPaused,
  shopTab,
  onShopTabChange,
  onSkipWave,
  onForceUpdate,
  isTestMode = false,
  onCloseShop,
}: ShopMenuProps) {
  const handlePurchase = (upgrade: Upgrade) => {
    if (purchaseUpgrade(upgrade, player)) {
      audioSystem.playPurchase();
      onForceUpdate();
    }
  };

  // Shop is always fully visible - no fade effect needed

  const getStatPreview = (upgrade: Upgrade): string => {
    if (upgrade.currentLevel >= upgrade.maxLevel) return "";

    switch (upgrade.id) {
      case "health":
        return `${player.maxHealth} → ${player.maxHealth + 10}`;
      case "defense":
        return `${player.defense.toFixed(1)}% → ${Math.min(
          20,
          player.defense + 0.1
        ).toFixed(1)}%`;
      case "damage":
        return `${player.damage.toFixed(1)} → ${(player.damage + 0.2).toFixed(
          1
        )}`;
      case "fire_rate": {
        const currentRPS = (1000 / player.fireRate).toFixed(1);
        const newRPS = (1000 / Math.max(50, player.fireRate * 0.97)).toFixed(1);
        return `${currentRPS} → ${newRPS} shots/sec`;
      }
      case "speed":
        return `${player.speed.toFixed(1)} → ${(player.speed + 0.1).toFixed(
          1
        )}`;
      case "regen":
        return `${(upgrade.currentLevel * 0.05).toFixed(2)} → ${(
          (upgrade.currentLevel + 1) *
          0.05
        ).toFixed(2)} HP/s`;
      default:
        return "";
    }
  };

  return (
    <>
      {/* Wave Timer Overlay - Hide in test mode */}
      {!isTestMode && (
        <div className="wave-timer-overlay">
          <div className="wave-timer-compact">
            <span className="wave-timer-text">Next Wave:</span>
            <span
              className={`wave-timer-countdown ${
                waveTimer <= 5 && !isPaused ? "urgent" : ""
              }`}
            >
              {isPaused ? "PAUSED" : `${waveTimer}s`}
            </span>
            <button className="skip-wave-compact" onClick={onSkipWave}>
              ⚡ SKIP
            </button>
          </div>
        </div>
      )}

      {/* Shop Menu */}
      <div className="menu-overlay shop-overlay">
        <h1 className="shop-title">
          {isTestMode ? "🧪 SANDBOX SHOP" : `🛒 ROUND ${round} SHOP`}
        </h1>

        <div className="shop-header">
          <div className="shop-stats">
            <p className="shop-money">💰 ${player.money}</p>
            <p className="shop-stat">
              ❤️ {player.health}/{player.maxHealth}
            </p>
            <p className="shop-stat">💥 {player.damage.toFixed(1)}</p>
            <p className="shop-stat">🛡️ {player.defense.toFixed(1)}%</p>
            <p className="shop-stat">🏃 {player.speed.toFixed(1)}</p>
          </div>
        </div>
        {isTestMode && onCloseShop && (
          <button
            className="menu-button"
            onClick={onCloseShop}
            style={{
              backgroundColor: "#4ecdcb",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "15px",
              width: "auto",
            }}
          >
            ✕ Close Shop (Press B)
          </button>
        )}

        <div className="shop-tabs">
          <button
            className={`shop-tab ${shopTab === "core" ? "active" : ""}`}
            onClick={() => onShopTabChange("core")}
          >
            📊 CORE STATS
          </button>
          <button
            className={`shop-tab ${shopTab === "special" ? "active" : ""}`}
            onClick={() => onShopTabChange("special")}
          >
            ✨ SPECIAL ABILITIES
          </button>
        </div>

        <div className="upgrades-grid">
          {UPGRADES.filter((u) => u.category === shopTab).map((upgrade) => {
            const progressPercent =
              (upgrade.currentLevel / upgrade.maxLevel) * 100;
            const isMaxLevel = upgrade.currentLevel >= upgrade.maxLevel;
            const canAfford = player.money >= upgrade.cost;
            const statPreview = getStatPreview(upgrade);

            return (
              <div
                key={upgrade.id}
                className={`upgrade-card ${
                  canAfford && !isMaxLevel ? "affordable" : ""
                } ${isMaxLevel ? "max-level" : ""}`}
              >
                <div className="upgrade-icon">{upgrade.icon}</div>
                <div className="upgrade-info">
                  <h3>{upgrade.name}</h3>
                  <p className="upgrade-desc">{upgrade.description}</p>
                  {statPreview && (
                    <p className="upgrade-preview">{statPreview}</p>
                  )}
                  <p className="upgrade-level">
                    Level {upgrade.currentLevel}/{upgrade.maxLevel}
                  </p>
                  <div className="upgrade-progress-container">
                    <div
                      className={`upgrade-progress-bar ${
                        isMaxLevel ? "max-level" : ""
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <div className="upgrade-action">
                  {!isMaxLevel && (
                    <div
                      className={`upgrade-cost ${
                        canAfford ? "affordable" : ""
                      }`}
                    >
                      ${upgrade.cost}
                    </div>
                  )}
                  <button
                    className={`upgrade-button ${isMaxLevel ? "max" : ""}`}
                    disabled={!canAfford || isMaxLevel}
                    onClick={() => handlePurchase(upgrade)}
                  >
                    {isMaxLevel ? "MAXED" : "UPGRADE"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
