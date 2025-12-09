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
  particles.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
