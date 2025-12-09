// Upgrade Shop System
import type { Upgrade, Player } from '../types/game';

export const UPGRADES: Upgrade[] = [
  {
    id: 'health',
    name: 'Max Health',
    description: 'Increase maximum health by 25',
    cost: 50,
    maxLevel: 10,
    currentLevel: 0,
    icon: '❤️',
    effect: (player: Player) => {
      player.maxHealth += 25;
      player.health = player.maxHealth;
    },
  },
  {
    id: 'damage',
    name: 'Damage',
    description: 'Increase bullet damage by 5',
    cost: 40,
    maxLevel: 15,
    currentLevel: 0,
    icon: '💥',
    effect: (player: Player) => {
      player.damage += 5;
    },
  },
  {
    id: 'fire_rate',
    name: 'Fire Rate',
    description: 'Increase fire rate by 10%',
    cost: 60,
    maxLevel: 10,
    currentLevel: 0,
    icon: '⚡',
    effect: (player: Player) => {
      player.fireRate *= 0.9; // Lower is faster
    },
  },
  {
    id: 'speed',
    name: 'Movement Speed',
    description: 'Increase movement speed by 0.5',
    cost: 45,
    maxLevel: 8,
    currentLevel: 0,
    icon: '🏃',
    effect: (player: Player) => {
      player.speed += 0.5;
    },
  },
  {
    id: 'regen',
    name: 'Health Regen',
    description: 'Slowly regenerate health',
    cost: 80,
    maxLevel: 5,
    currentLevel: 0,
    icon: '💚',
    effect: () => {
      // Applied in game loop
    },
  },
  {
    id: 'pierce',
    name: 'Piercing Shots',
    description: 'Bullets pierce through enemies',
    cost: 100,
    maxLevel: 1,
    currentLevel: 0,
    icon: '🎯',
    effect: () => {
      // Applied in collision detection
    },
  },
  {
    id: 'multi_shot',
    name: 'Multi-Shot',
    description: 'Fire additional bullets',
    cost: 180,
    maxLevel: 2,
    currentLevel: 0,
    icon: '🔥',
    effect: () => {
      // Applied in shooting logic
    },
  },
  {
    id: 'explosive',
    name: 'Explosive Rounds',
    description: 'Bullets explode on impact',
    cost: 150,
    maxLevel: 3,
    currentLevel: 0,
    icon: '💣',
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
  
  // Increase cost for next level
  upgrade.cost = Math.floor(upgrade.cost * 1.5);
  
  return true;
}

export function getUpgradeLevel(upgradeId: string): number {
  const upgrade = UPGRADES.find(u => u.id === upgradeId);
  return upgrade ? upgrade.currentLevel : 0;
}
