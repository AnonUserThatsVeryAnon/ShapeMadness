// Unified Enemy Visual System - Consistent rendering for game and codex
import { EnemyType } from '../types/game';

export interface EnemyVisualInfo {
  icon: string;
  pattern: 'dot' | 'lightning' | 'shield' | 'split' | 'crosshair' | 'cross' | 'star' | 'scope' | 'snowflake' | 'bomb' | 'rings' | 'clock' | 'chain' | 'skull' | 'wind' | 'eye';
  description: string;
}

export const ENEMY_VISUALS: Record<EnemyType, EnemyVisualInfo> = {
  [EnemyType.BASIC]: {
    icon: '⚫',
    pattern: 'dot',
    description: 'Simple red circle with a dot',
  },
  [EnemyType.FAST]: {
    icon: '⚡',
    pattern: 'lightning',
    description: 'Cyan circle with lightning bolt',
  },
  [EnemyType.TANK]: {
    icon: '🛡️',
    pattern: 'shield',
    description: 'Large green circle with shield',
  },
  [EnemyType.SPLITTER]: {
    icon: '💥',
    pattern: 'split',
    description: 'Pink circle with split arrows',
  },
  [EnemyType.SHOOTER]: {
    icon: '🎯',
    pattern: 'crosshair',
    description: 'Purple circle with crosshair',
  },
  [EnemyType.PROTECTOR]: {
    icon: '💚',
    pattern: 'cross',
    description: 'Yellow circle with healing cross',
  },
  [EnemyType.MAGICIAN]: {
    icon: '✨',
    pattern: 'star',
    description: 'Magenta circle with star',
  },
  [EnemyType.SNIPER]: {
    icon: '🔴',
    pattern: 'scope',
    description: 'Orange circle with sniper scope',
  },
  [EnemyType.TURRET_SNIPER]: {
    icon: '🏰',
    pattern: 'crosshair',
    description: 'Stationary turret with deployable shield',
  },
  [EnemyType.ICE]: {
    icon: '❄️',
    pattern: 'snowflake',
    description: 'Ice blue circle with snowflake',
  },
  [EnemyType.BOMB]: {
    icon: '💣',
    pattern: 'bomb',
    description: 'Orange circle with bomb icon',
  },
  [EnemyType.BUFFER]: {
    icon: '✨',
    pattern: 'rings',
    description: 'Pink circle with aura rings',
  },
  [EnemyType.TIME_DISTORTION]: {
    icon: '⏰',
    pattern: 'clock',
    description: 'Purple circle with clock hands',
  },
  [EnemyType.CHAIN_PARTNER]: {
    icon: '🔗',
    pattern: 'chain',
    description: 'Orange circle with chain link',
  },
  [EnemyType.EVIL_STORM]: {
    icon: '💀',
    pattern: 'skull',
    description: 'Dark circle with skull',
  },
  [EnemyType.LUFTI]: {
    icon: '🌪️',
    pattern: 'wind',
    description: 'Mystical circle with wind swirls',
  },
  [EnemyType.OVERSEER]: {
    icon: '👁️',
    pattern: 'eye',
    description: 'Massive purple sphere with glowing eye',
  },
};

/**
 * Draw enemy pattern on canvas - used in both game and codex previews
 */
export function drawEnemyPattern(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  radius: number,
  _color: string,
  scale: number = 1
): void {
  const visual = ENEMY_VISUALS[type];
  const r = radius * 0.5 * scale;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * scale;

  switch (visual.pattern) {
    case 'dot':
      // Simple dot
      ctx.beginPath();
      ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'lightning':
      // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(x - r * 0.3, y - r * 0.6);
      ctx.lineTo(x + r * 0.2, y);
      ctx.lineTo(x - r * 0.2, y);
      ctx.lineTo(x + r * 0.3, y + r * 0.6);
      ctx.stroke();
      break;

    case 'shield':
      // Shield rectangle
      ctx.strokeRect(x - r * 0.5, y - r * 0.6, r, r * 1.2);
      break;

    case 'split':
      // Split arrows
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.5);
      ctx.lineTo(x - r * 0.5, y + r * 0.3);
      ctx.moveTo(x, y - r * 0.5);
      ctx.lineTo(x + r * 0.5, y + r * 0.3);
      ctx.stroke();
      break;

    case 'crosshair':
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6, y);
      ctx.lineTo(x + r * 0.6, y);
      ctx.moveTo(x, y - r * 0.6);
      ctx.lineTo(x, y + r * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'cross':
      // Healing cross
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y);
      ctx.lineTo(x + r * 0.5, y);
      ctx.moveTo(x, y - r * 0.5);
      ctx.lineTo(x, y + r * 0.5);
      ctx.stroke();
      break;

    case 'star':
      // 5-pointed star
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const starR = i % 2 === 0 ? r * 0.6 : r * 0.3;
        const px = x + Math.cos(angle) * starR;
        const py = y + Math.sin(angle) * starR;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      break;

    case 'scope':
      // Sniper scope
      ctx.beginPath();
      ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - r * 0.7, y);
      ctx.lineTo(x - r * 0.5, y);
      ctx.moveTo(x + r * 0.5, y);
      ctx.lineTo(x + r * 0.7, y);
      ctx.moveTo(x, y - r * 0.7);
      ctx.lineTo(x, y - r * 0.5);
      ctx.moveTo(x, y + r * 0.5);
      ctx.lineTo(x, y + r * 0.7);
      ctx.stroke();
      break;

    case 'snowflake':
      // Snowflake (6 lines)
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * r * 0.6, y + Math.sin(angle) * r * 0.6);
      }
      ctx.stroke();
      break;

    case 'bomb':
      // Bomb with fuse
      ctx.beginPath();
      ctx.arc(x, y + r * 0.2, r * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.2);
      ctx.lineTo(x - r * 0.2, y - r * 0.5);
      ctx.stroke();
      break;

    case 'rings':
      // Aura rings
      ctx.beginPath();
      ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'clock':
      // Clock/time
      ctx.beginPath();
      ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - r * 0.4);
      ctx.lineTo(x + r * 0.3, y);
      ctx.stroke();
      break;

    case 'chain':
      // Chain link
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y, r * 0.25, 0, Math.PI * 2);
      ctx.arc(x + r * 0.3, y, r * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - r * 0.1, y);
      ctx.lineTo(x + r * 0.1, y);
      ctx.stroke();
      break;

    case 'skull':
      // Skull (simplified)
      ctx.beginPath();
      ctx.arc(x, y - r * 0.2, r * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(x - r * 0.2, y + r * 0.1, r * 0.15, r * 0.3);
      ctx.fillRect(x + r * 0.05, y + r * 0.1, r * 0.15, r * 0.3);
      break;

    case 'wind':
      // Wind swirls
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y, r * 0.2, Math.PI, 0);
      ctx.arc(x + r * 0.3, y, r * 0.2, Math.PI, 0);
      ctx.stroke();
      break;

    case 'eye':
      // Boss eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.5, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      
      // Pupil
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - r * 0.08, y - r * 0.08, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

/**
 * Create a canvas element with enemy visual for codex display
 */
export function createEnemyCanvas(
  type: EnemyType,
  color: string,
  size: number = 100
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.35;

  // Draw main circle
  ctx.fillStyle = color;
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Draw border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw pattern
  drawEnemyPattern(ctx, type, centerX, centerY, radius, color, 1);

  return canvas;
}
