// Laser Hazard System for high-level challenge
import type { Laser, Vector2 } from '../types/game';

const LASER_WARNING_TIME = 2000; // 2 seconds warning
const LASER_FIRE_DURATION = 500; // 0.5 seconds active
const LASER_WIDTH = 20;

export function shouldSpawnLaser(round: number): boolean {
  if (round < 5) return false;
  
  // Probability increases with rounds: 5% at round 5, up to 20% at round 20+
  const baseChance = 0.05;
  const maxChance = 0.2;
  const chance = Math.min(maxChance, baseChance + (round - 5) * 0.015);
  
  return Math.random() < chance;
}

export function createLaser(canvasWidth: number, canvasHeight: number): Laser {
  const now = Date.now();
  
  // Random side: 0=top, 1=right, 2=bottom, 3=left
  const side = Math.floor(Math.random() * 4);
  let startPos: Vector2, endPos: Vector2;
  
  switch (side) {
    case 0: // Top to bottom
      startPos = { x: Math.random() * canvasWidth, y: -50 };
      endPos = { x: startPos.x, y: canvasHeight + 50 };
      break;
    case 1: // Right to left
      startPos = { x: canvasWidth + 50, y: Math.random() * canvasHeight };
      endPos = { x: -50, y: startPos.y };
      break;
    case 2: // Bottom to top
      startPos = { x: Math.random() * canvasWidth, y: canvasHeight + 50 };
      endPos = { x: startPos.x, y: -50 };
      break;
    case 3: // Left to right
    default:
      startPos = { x: -50, y: Math.random() * canvasHeight };
      endPos = { x: canvasWidth + 50, y: startPos.y };
      break;
  }
  
  return {
    startPos,
    endPos,
    active: false,
    warningTime: now + LASER_WARNING_TIME,
    fireTime: now + LASER_WARNING_TIME + LASER_FIRE_DURATION,
    createdAt: now,
    damage: 30,
  };
}

export function updateLasers(lasers: Laser[]): Laser[] {
  const now = Date.now();
  
  return lasers.filter(laser => {
    // Activate laser after warning period
    if (!laser.active && now >= laser.warningTime) {
      laser.active = true;
    }
    
    // Remove laser after fire duration
    if (now >= laser.fireTime) {
      return false;
    }
    
    return true;
  });
}

export function drawLasers(ctx: CanvasRenderingContext2D, lasers: Laser[]): void {
  const now = Date.now();
  
  lasers.forEach(laser => {
    if (!laser.active) {
      // Warning phase - flashing red line
      const flashSpeed = 200;
      const flash = Math.floor(now / flashSpeed) % 2 === 0;
      
      if (flash) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = LASER_WIDTH;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(laser.startPos.x, laser.startPos.y);
        ctx.lineTo(laser.endPos.x, laser.endPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    } else {
      // Active phase - bright laser beam
      ctx.save();
      
      // Outer glow
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.3)';
      ctx.lineWidth = LASER_WIDTH + 10;
      ctx.beginPath();
      ctx.moveTo(laser.startPos.x, laser.startPos.y);
      ctx.lineTo(laser.endPos.x, laser.endPos.y);
      ctx.stroke();
      
      // Main beam
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.lineWidth = LASER_WIDTH;
      ctx.beginPath();
      ctx.moveTo(laser.startPos.x, laser.startPos.y);
      ctx.lineTo(laser.endPos.x, laser.endPos.y);
      ctx.stroke();
      
      // Inner core
      ctx.strokeStyle = 'rgba(255, 200, 200, 1)';
      ctx.lineWidth = LASER_WIDTH / 3;
      ctx.beginPath();
      ctx.moveTo(laser.startPos.x, laser.startPos.y);
      ctx.lineTo(laser.endPos.x, laser.endPos.y);
      ctx.stroke();
      
      ctx.restore();
    }
  });
}

export function checkLaserCollision(laser: Laser, position: Vector2, radius: number): boolean {
  if (!laser.active) return false;
  
  // Point-to-line segment distance calculation
  const { startPos, endPos } = laser;
  const A = position.x - startPos.x;
  const B = position.y - startPos.y;
  const C = endPos.x - startPos.x;
  const D = endPos.y - startPos.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = startPos.x;
    yy = startPos.y;
  } else if (param > 1) {
    xx = endPos.x;
    yy = endPos.y;
  } else {
    xx = startPos.x + param * C;
    yy = startPos.y + param * D;
  }
  
  const dx = position.x - xx;
  const dy = position.y - yy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance < (LASER_WIDTH / 2 + radius);
}
