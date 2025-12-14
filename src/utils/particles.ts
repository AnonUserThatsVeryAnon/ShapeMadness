// Particle System for visual effects
import type { Particle, Vector2 } from '../types/game';
import { add, multiply } from './helpers';

export function createParticles(
  position: Vector2,
  count: number,
  color: string,
  speed: number = 3,
  lifetime: number = 1000
): Particle[] {
  const particles: Particle[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const velocity = {
      x: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
      y: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5),
    };
    
    particles.push({
      position: { ...position },
      velocity,
      color,
      size: 2 + Math.random() * 3,
      lifetime,
      alpha: 1,
      createdAt: Date.now(),
    });
  }
  
  return particles;
}

export function updateParticles(particles: Particle[], deltaTime: number): Particle[] {
  const now = Date.now();
  
  return particles.filter(particle => {
    const age = now - particle.createdAt;
    if (age >= particle.lifetime) return false;
    
    // Update position
    particle.position = add(particle.position, multiply(particle.velocity, deltaTime * 60));
    
    // Fade out
    particle.alpha = 1 - (age / particle.lifetime);
    
    // Slow down
    particle.velocity = multiply(particle.velocity, 0.98);
    
    return true;
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  // Optimized: group by color to reduce style changes
  const oldAlpha = ctx.globalAlpha;
  
  particles.forEach(particle => {
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.globalAlpha = oldAlpha;
}

// Enhanced particle effects for boss abilities
export function createBossSpawnParticles(position: Vector2): Particle[] {
  const particles: Particle[] = [];
  const count = 60;
  
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 5 + Math.random() * 8;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    
    particles.push({
      position: { ...position },
      velocity,
      color: i % 3 === 0 ? '#5a1d7a' : i % 3 === 1 ? '#ff6b1a' : '#ff1a1a',
      size: 3 + Math.random() * 5,
      lifetime: 1500 + Math.random() * 500,
      alpha: 1,
      createdAt: Date.now(),
    });
  }
  
  return particles;
}

export function createPhaseTransitionParticles(position: Vector2, color: string): Particle[] {
  const particles: Particle[] = [];
  const count = 80;
  
  // Outward burst
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const speed = 8 + Math.random() * 12;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    
    particles.push({
      position: { ...position },
      velocity,
      color,
      size: 4 + Math.random() * 6,
      lifetime: 1000 + Math.random() * 800,
      alpha: 1,
      createdAt: Date.now(),
    });
  }
  
  // Add spiral effect
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 4;
    const radius = i * 3;
    const speed = 3;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    
    particles.push({
      position: {
        x: position.x + Math.cos(angle) * radius,
        y: position.y + Math.sin(angle) * radius,
      },
      velocity,
      color,
      size: 2 + Math.random() * 3,
      lifetime: 1500,
      alpha: 1,
      createdAt: Date.now(),
    });
  }
  
  return particles;
}

export function createShockwaveParticles(position: Vector2, color: string): Particle[] {
  const particles: Particle[] = [];
  const rings = 3;
  const particlesPerRing = 30;
  
  for (let ring = 0; ring < rings; ring++) {
    const radius = 50 + ring * 50;
    for (let i = 0; i < particlesPerRing; i++) {
      const angle = (Math.PI * 2 * i) / particlesPerRing;
      const speed = 10 + ring * 3;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
      
      particles.push({
        position: {
          x: position.x + Math.cos(angle) * radius,
          y: position.y + Math.sin(angle) * radius,
        },
        velocity,
        color,
        size: 4 - ring,
        lifetime: 800 - ring * 200,
        alpha: 1,
        createdAt: Date.now(),
      });
    }
  }
  
  return particles;
}

export function createLaserSparkParticles(position: Vector2, angle: number): Particle[] {
  const particles: Particle[] = [];
  const count = 15;
  
  for (let i = 0; i < count; i++) {
    const spreadAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
    const speed = 2 + Math.random() * 5;
    const velocity = {
      x: Math.cos(spreadAngle) * speed,
      y: Math.sin(spreadAngle) * speed,
    };
    
    particles.push({
      position: { ...position },
      velocity,
      color: '#ff6b1a',
      size: 1 + Math.random() * 2,
      lifetime: 300 + Math.random() * 200,
      alpha: 1,
      createdAt: Date.now(),
    });
  }
  
  return particles;
}

export function createBossDeathExplosion(position: Vector2): Particle[] {
  const particles: Particle[] = [];
  const count = 200;
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 20;
    const velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    
    const colors = ['#5a1d7a', '#ff6b1a', '#ff1a1a', '#ffffff', '#ffff00'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particles.push({
      position: { ...position },
      velocity,
      color,
      size: 2 + Math.random() * 8,
      lifetime: 2000 + Math.random() * 1000,
      alpha: 1,
      createdAt: Date.now(),
    });
  }
  
  return particles;
}
