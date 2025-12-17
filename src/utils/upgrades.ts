// Upgrade Shop System
import type { Upgrade, Player } from '../types/game';

// Store initial costs for reset
const INITIAL_COSTS: Record<string, number> = {
  health: 20,
  defense: 40,
  damage: 25,
  fire_rate: 45,
  speed: 30,
  regen: 50,
  bullet_speed: 35,
  pierce: 100,
  homing: 120,
  explosive: 150,
  shield: 80,
  lifesteal: 100,
  crit: 90,
  multishot: 200,
  stamina: 70,
};

export const UPGRADES: Upgrade[] = [
  // CORE STATS - High max levels, small increments, cheaper costs
  // Progressive unlocking: Speed (Round 1), Damage (Round 2), Fire Rate (Round 3)
  {
    id: 'speed',
    name: 'Movement Speed',
    description: 'Increase movement speed by 0.1',
    cost: 30,
    maxLevel: 40,
    currentLevel: 0,
    icon: '🏃',
    category: 'core',
    unlockRound: 1,
    effect: (player: Player) => {
      player.speed += 0.1;
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
    unlockRound: 2,
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
    unlockRound: 3,
    effect: (player: Player) => {
      player.fireRate = Math.max(50, player.fireRate * 0.97); // Lower is faster, cap at 50ms
    },
  },
  {
    id: 'health',
    name: 'Max Health',
    description: 'Increase maximum health by 10',
    cost: 20,
    maxLevel: 50,
    currentLevel: 0,
    icon: '❤️',
    category: 'core',
    unlockRound: 1,
    effect: (player: Player) => {
      player.maxHealth += 10;
      player.health = player.maxHealth;
    },
  },
  {
    id: 'defense',
    name: 'Defense',
    description: 'Reduce damage taken by 0.3%',
    cost: 40,
    maxLevel: 67,
    currentLevel: 0,
    icon: '🛡️',
    category: 'core',
    unlockRound: 10,
    effect: (player: Player) => {
      player.defense = Math.min(20, player.defense + 0.3); // Cap at 20% reduction
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
    unlockRound: 6,
    effect: () => {
      // Applied in game loop
    },
  },
  {
    id: 'stamina',
    name: 'Dash Stamina',
    description: 'Reduce dash cooldown by 100ms',
    cost: 70,
    maxLevel: 20,
    currentLevel: 0,
    icon: '⚡',
    category: 'core',
    unlockRound: 16, // Unlocks after defeating round 15 boss
    effect: (player: Player) => {
      player.dashCooldown = Math.max(500, player.dashCooldown - 100); // Cap at 0.5s cooldown
    },
  },
  
  // SPECIAL ABILITIES - Lower max levels, more expensive, game-changing
  {
    id: 'pierce',
    name: 'Piercing Shots',
    description: 'Bullets pierce through enemies',
    cost: 400,
    maxLevel: 1,
    currentLevel: 0,
    icon: '🎯',
    category: 'special',
    unlockRound: 1,
    effect: () => {
      // Applied in collision detection
    },
  },
  {
    id: 'multi_shot',
    name: 'Multi-Shot',
    description: 'Fire up to 2 additional smaller bullets (50% damage each)',
    cost: 600,
    maxLevel: 2,
    currentLevel: 0,
    icon: '🔥',
    category: 'special',
    unlockRound: 1,
    effect: () => {
      // Applied in shooting logic
    },
  },
  {
    id: 'explosive',
    name: 'Explosive Rounds',
    description: 'Bullets explode on impact',
    cost: 500,
    maxLevel: 5,
    currentLevel: 0,
    icon: '💣',
    category: 'special',
    unlockRound: 1,
    effect: () => {
      // Applied in collision detection
    },
  },
  {
    id: 'crit',
    name: 'Critical Strike',
    description: 'Increase crit chance by 1% (2x damage on crit)',
    cost: 90,
    maxLevel: 15,
    currentLevel: 0,
    icon: '⚡',
    category: 'special',
    unlockRound: 1,
    effect: () => {
      // Applied in damage calculation
    },
  },
];

export function resetUpgrades(): void {
  UPGRADES.forEach(upgrade => {
    upgrade.currentLevel = 0;
    // Reset cost to initial value
    const initialCost = INITIAL_COSTS[upgrade.id];
    if (initialCost !== undefined) {
      upgrade.cost = initialCost;
    }
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
