import { useGameStore } from '../store/gameStore';

/**
 * Hook to access game state from Zustand store
 */
export function useGameState() {
  return useGameStore((state) => ({
    gameState: state.gameState,
    isPaused: state.isPaused,
    stats: state.stats,
    waveTimer: state.waveTimer,
    setGameState: state.setGameState,
    setIsPaused: state.setIsPaused,
    setWaveTimer: state.setWaveTimer,
    incrementRound: state.incrementRound,
  }));
}

/**
 * Hook to access UI state from Zustand store
 */
export function useUIState() {
  return useGameStore((state) => ({
    showingCard: state.showingCard,
    showCodex: state.showCodex,
    shopTab: state.shopTab,
    setShowingCard: state.setShowingCard,
    setShowCodex: state.setShowCodex,
    setShopTab: state.setShopTab,
  }));
}

/**
 * Hook to access player state
 */
export function usePlayer() {
  return useGameStore((state) => ({
    player: state.player,
    updatePlayer: state.updatePlayer,
    addMoney: state.addMoney,
  }));
}

/**
 * Hook to access combat stats
 */
export function useCombatStats() {
  return useGameStore((state) => ({
    stats: state.stats,
    addScore: state.addScore,
    incrementKills: state.incrementKills,
    updateCombo: state.updateCombo,
    updateStats: state.updateStats,
  }));
}

/**
 * Hook to access entities (enemies, bullets, etc.)
 */
export function useEntities() {
  return useGameStore((state) => ({
    enemies: state.enemies,
    bullets: state.bullets,
    enemyProjectiles: state.enemyProjectiles,
    powerUps: state.powerUps,
    particles: state.particles,
    floatingTexts: state.floatingTexts,
    lasers: state.lasers,
    setEnemies: state.setEnemies,
    setBullets: state.setBullets,
    setEnemyProjectiles: state.setEnemyProjectiles,
    setPowerUps: state.setPowerUps,
    setParticles: state.setParticles,
    setFloatingTexts: state.setFloatingTexts,
    setLasers: state.setLasers,
    addEnemy: state.addEnemy,
    addBullet: state.addBullet,
    addPowerUp: state.addPowerUp,
    addParticles: state.addParticles,
    addFloatingText: state.addFloatingText,
  }));
}

/**
 * Hook to access play zone state
 */
export function usePlayZone() {
  return useGameStore((state) => ({
    playZone: state.playZone,
    updatePlayZone: state.updatePlayZone,
  }));
}
