// Upgrade Shop System
import type { Upgrade, Player } from '../types/game';

export const UPGRADES: Upgrade[] = [
  // CORE STATS - High max levels, small increments, cheaper costs
  {
    id: 'health',
    name: 'Max Health',
    description: 'Increase maximum health by 10',
    cost: 30,
    maxLevel: 50,
    currentLevel: 0,
    icon: '❤️',
    category: 'core',
    effect: (player: Player) => {
      player.maxHealth += 10;
      player.health = player.maxHealth;
    },
  },
  {
    id: 'defense',
    name: 'Defense',
    description: 'Reduce damage taken by 0.1%',
    cost: 40,
    maxLevel: 200,
    currentLevel: 0,
    icon: '🛡️',
    category: 'core',
    effect: (player: Player) => {
      player.defense = Math.min(20, player.defense + 0.1); // Cap at 20% reduction
    },
  },
  {
    id: 'damage',
    name: 'Damage',
    description: 'Increase bullet damage by 0.2',
    cost: 25,
    maxLevel: 75,
    currentLevel: 0,
    icon: '💥',
    category: 'core',
    effect: (player: Player) => {
      player.damage += 0.2;
    },
  },
  {
    id: 'fire_rate',
    name: 'Fire Rate',
    description: 'Increase fire rate by 3%',
    cost: 45,
    maxLevel: 50,
    currentLevel: 0,
    icon: '⚡',
    category: 'core',
    effect: (player: Player) => {
      player.fireRate = Math.max(50, player.fireRate * 0.97); // Lower is faster, cap at 50ms
    },
  },
  {
    id: 'speed',
    name: 'Movement Speed',
    description: 'Increase movement speed by 0.1',
    cost: 30,
    maxLevel: 40,
    currentLevel: 0,
    icon: '🏃',
    category: 'core',
    effect: (player: Player) => {
      player.speed += 0.1;
    },
  },
  {
    id: 'regen',
    name: 'Health Regen',
    description: 'Regenerate 0.05 HP per second',
    cost: 50,
    maxLevel: 30,
    currentLevel: 0,
    icon: '💚',
    category: 'core',
    effect: () => {
      // Applied in game loop
    },
  },
  
  // SPECIAL ABILITIES - Lower max levels, more expensive, game-changing
  {
    id: 'pierce',
    name: 'Piercing Shots',
    description: 'Bullets pierce through enemies',
    cost: 100,
    maxLevel: 1,
    currentLevel: 0,
    icon: '🎯',
    category: 'special',
    effect: () => {
      // Applied in collision detection
    },
  },
  {
    id: 'multi_shot',
    name: 'Multi-Shot',
    description: 'Fire up to 2 additional smaller bullets (50% damage each)',
    cost: 200,
    maxLevel: 2,
    currentLevel: 0,
    icon: '🔥',
    category: 'special',
    effect: () => {
      // Applied in shooting logic
    },
  },
  {
    id: 'explosive',
    name: 'Explosive Rounds',
    description: 'Bullets explode on impact',
    cost: 150,
    maxLevel: 5,
    currentLevel: 0,
    icon: '💣',
    category: 'special',
    effect: () => {
      // Applied in collision detection
    },
  },
];

export function resetUpgrades(): void {
  UPGRADES.forEach(upgrade => {
    upgrade.currentLevel = 0;
  });
}

export function purchaseUpgrade(upgrade: Upgrade, player: Player): boolean {
  if (player.money < upgrade.cost || upgrade.currentLevel >= upgrade.maxLevel) {
    return false;
  }
  
  player.money -= upgrade.cost;
  upgrade.currentLevel++;
  upgrade.effect(player);
  
  // Slower cost scaling for more gradual progression
  // Core stats scale at 1.15x, special abilities at 2.5x
  const scaleFactor = upgrade.category === 'core' ? 1.15 : 2.5;
  upgrade.cost = Math.floor(upgrade.cost * scaleFactor);
  
  return true;
}

export function getUpgradeLevel(upgradeId: string): number {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  return upgrade ? upgrade.currentLevel : 0;
}
