// Floating Text System for damage numbers and feedback
import type { FloatingText, Vector2 } from '../types/game';

export function createFloatingText(
  text: string,
  position: Vector2,
  color: string = '#ffff00',
  fontSize: number = 20,
  lifetime: number = 1500
): FloatingText {
  return {
    text,
    position: { ...position },
    velocity: { x: (Math.random() - 0.5) * 2, y: -2 - Math.random() * 2 },
    color,
    fontSize,
    alpha: 1,
    createdAt: Date.now(),
    lifetime,
  };
}

export function updateFloatingTexts(texts: FloatingText[]): FloatingText[] {
  const now = Date.now();
  
  return texts.filter(text => {
    const age = now - text.createdAt;
    if (age >= text.lifetime) return false;
    
    // Update position
    text.position.x += text.velocity.x;
    text.position.y += text.velocity.y;
    
    // Fade out
    text.alpha = 1 - (age / text.lifetime);
    
    // Slow down vertical movement
    text.velocity.y *= 0.95;
    
    return true;
  });
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
  texts.forEach(text => {
    ctx.save();
    ctx.globalAlpha = text.alpha;
    ctx.fillStyle = text.color;
    ctx.font = `bold ${text.fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(text.text, text.position.x, text.position.y);
    ctx.fillText(text.text, text.position.x, text.position.y);
    ctx.restore();
  });
}
