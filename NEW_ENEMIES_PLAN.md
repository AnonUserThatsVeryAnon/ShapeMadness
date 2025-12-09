# 🎮 New Enemy Types - Implementation Plan

## ✅ Types Added to System

I've added all 10 new enemy types to the type system:

```typescript
// Added to EnemyType enum:
PROTECTOR;
MAGICIAN;
SNIPER;
ICE;
BOMB;
BUFFER;
TIME_DISTORTION;
CHAIN_PARTNER;
EVIL_STORM;
LUFTI;
```

## 📊 Enemy Configs Created

All enemy configs added with balanced stats:

| Enemy               | HP  | Speed | Damage | Value | Color       | Special                 |
| ------------------- | --- | ----- | ------ | ----- | ----------- | ----------------------- |
| **Protector**       | 400 | 1.2   | 12     | 50    | Yellow      | Heals allies            |
| **Magician**        | 150 | 2.2   | 10     | 40    | Purple      | Spawns projections      |
| **Sniper**          | 80  | 0.5   | 60     | 45    | Red         | Telegraph + high damage |
| **Ice**             | 90  | 2.0   | 12     | 30    | Cyan        | Freezes on death        |
| **Bomb**            | 110 | 1.8   | 25     | 35    | Orange      | Arc projectiles         |
| **Buffer**          | 200 | 1.5   | 8      | 60    | Pink        | Rotating buffs          |
| **Time Distortion** | 250 | 1.0   | 15     | 70    | Deep Purple | Slow aura               |
| **Chain Partner**   | 180 | 2.0   | 18     | 45    | Light Blue  | Linked healing          |
| **Evil Storm**      | 500 | 0.8   | 0      | 100   | Dark Gray   | Event buffs             |
| **Lufti**           | 140 | 2.5   | 10     | 40    | Green       | Knockback               |

## 🔧 What Still Needs Implementation

### Phase 1: Core Mechanics (Required)

Each enemy needs custom code in these areas:

1. **updateEnemyPosition()** - AI behavior
2. **updateGame()** - Special ability triggers
3. **renderGame()** - Custom visual effects
4. **damageEnemy()** - On-death effects (Ice, Evil Storm)

### Phase 2: New Systems Needed

#### A) Projection System (Magician)

```typescript
interface Projection {
  parent: Enemy;
  position: Vector2;
  lifetime: number;
  deflectsProjectiles: boolean;
}
```

- Spawn 2-3 projections around magician
- Deflect bullets but take no damage
- Disappear after 10 seconds

#### B) Telegraph System (Sniper)

```typescript
interface SniperShot {
  chargeStart: number;
  targetPos: Vector2;
  warningLine: boolean;
}
```

- Show warning line for 1.5 seconds
- Fire high-damage shot
- Long cooldown (5 seconds)

#### C) Status Effect System

```typescript
interface StatusEffect {
  type: "frozen" | "slowed" | "buffed";
  duration: number;
  appliedAt: number;
}
```

- Frozen: Can't move (Ice enemy death)
- Slowed: 50% speed (Time Distortion aura)
- Buffed: Various effects (Buffer enemy)

#### D) Arc Projectile System (Bomb)

```typescript
interface ArcProjectile {
  start: Vector2;
  target: Vector2;
  apex: number; // Height of arc
  progress: number; // 0-1
  explosionRadius: number;
}
```

- Thrown over other enemies
- Area damage on impact
- Particle trail

#### E) Buff Aura System (Buffer)

```typescript
type BuffType = "speed" | "regen" | "damage-reflect";
interface BuffAura {
  center: Vector2;
  radius: number;
  buffType: BuffType;
  nextRotation: number;
}
```

- Rotates buffs every 10 seconds
- Affects all enemies in 150px radius

#### F) Chain Link System (Chain Partner)

```typescript
interface ChainLink {
  partner1: Enemy;
  partner2: Enemy;
  healRate: number;
  broken: boolean;
}
```

- Heal each other via chain
- Visual chain line
- Reconnection attempts

### Phase 3: AI Behaviors

#### Protector AI

```typescript
// Find nearby low-HP allies
// Move toward weakest ally
// Heal pulse every 3 seconds
// 150px radius, +50 HP heal
```

#### Magician AI

```typescript
// Avoid player
// Spawn projections when player close
// Projections orbit magician
// Replace destroyed projections
```

#### Sniper AI

```typescript
// Stay mostly stationary
// Predict player movement
// Telegraph shot (red line)
// Fire after 1.5s delay
```

#### Ice AI

```typescript
// Normal movement
// On death: Freeze all within 100px radius
// Frozen duration: 3 seconds
```

#### Bomb AI

```typescript
// Keep medium distance
// Throw bomb every 4 seconds
// Arc trajectory over obstacles
// AOE damage: 80px radius, 40 damage
```

#### Buffer AI

```typescript
// Orbit center of enemy group
// Rotate buff every 10 seconds
// Speed: +50% move speed
// Regen: +10 HP/second
// Reflect: 25% damage back to player
```

#### Time Distortion AI

```typescript
// Slow movement
// Emit 200px slow aura
// Player: 70% speed
// Projectiles: 50% speed
// Other enemies unaffected
```

#### Chain Partner AI

```typescript
// Always spawn in pairs
// Stay within 300px of partner
// Heal partner: +20 HP/second
// If partner dies: Enrage (+50% speed/damage)
```

#### Evil Storm AI

```typescript
// Event enemy - appears round 15+
// Stays in center
// Every 5 seconds: Random elemental buff
// Fire: Burn on contact (5 HP/s, 3s)
// Ice: Slow on contact (50% speed, 2s)
// Lightning: Chain damage (10 HP to nearby player)
// Poison: DOT (10 HP/s, 4s)
// Wind: Knockback on contact
```

#### Lufti AI

```typescript
// Fast circular movement
// Knockback aura: 120px radius
// Projectiles: Deflect 45° angle
// Player: Push away slowly
// Creates chaotic battlefield
```

## 📈 Spawn Distribution by Round

### Early Game (Rounds 1-10)

```typescript
Basic: 40%
Fast: 30%
Splitter: 20%
Tank: 10%
```

### Mid Game (Rounds 11-20)

```typescript
Basic: 20%
Fast: 20%
Tank: 15%
Splitter: 15%
Shooter: 10%
Protector: 10%
Ice: 5%
Magician: 5%
```

### Late Game (Rounds 21-30)

```typescript
Tank: 15%
Shooter: 15%
Protector: 12%
Magician: 10%
Sniper: 10%
Bomb: 10%
Buffer: 10%
Ice: 8%
Lufti: 7%
Time Distortion: 3%
```

### End Game (Rounds 31+)

```typescript
All enemies possible
Chain Partners: 8% (spawn in pairs)
Evil Storm: 2% (one per round max)
Increased difficulty multipliers
```

## 🎨 Visual Design

### Protector

- Yellow circle with cross symbol
- Green healing pulse animation
- Particles: Green sparkles on heal

### Magician

- Purple circle with star symbol
- Projections: Semi-transparent copies
- Particles: Purple magic swirls

### Sniper

- Red circle with crosshair
- Telegraph: Red laser line to target
- Flash on fire

### Ice

- Cyan circle with snowflake
- Death: Blue explosion
- Frozen enemies: Light blue tint

### Bomb

- Orange circle with fuse
- Arc trail: Orange particles
- Explosion: Fire particles

### Buffer

- Pink circle with rotating aura ring
- Color changes with buff type
- Pulsing glow

### Time Distortion

- Deep purple swirling vortex
- Distortion effect around it
- Slow-motion particles

### Chain Partner

- Light blue circles
- Chain: Glowing line between them
- Healing pulse along chain

### Evil Storm

- Dark swirling mass
- Elemental effects emanating
- Dramatic particle effects

### Lufti

- Green circle with wind swirls
- Knockback waves visible
- Deflected projectile sparks

## 🔧 Implementation Complexity

### Simple (1-2 hours each)

- ✅ Ice (freeze on death)
- ✅ Lufti (knockback aura)
- ✅ Sniper (telegraph system)

### Medium (3-5 hours each)

- Protector (heal nearby allies)
- Bomb (arc projectiles)
- Buffer (rotating buffs)
- Time Distortion (slow aura)

### Complex (6-10 hours each)

- Magician (projection system)
- Chain Partner (linked enemies)
- Evil Storm (event + elemental system)

**Total estimated time: 40-60 hours for full implementation**

## 🎯 Recommendation

Given the scope, I suggest implementing in phases:

### **Phase 1 (Quick Wins)**

1. Ice enemy - simple freeze on death
2. Sniper enemy - telegraph + high damage
3. Protector enemy - basic heal pulse

### **Phase 2 (Core Expansion)**

4. Magician - projection system
5. Bomb - arc projectiles
6. Buffer - buff auras

### **Phase 3 (Advanced)**

7. Time Distortion - slow field
8. Lufti - knockback
9. Chain Partner - linked system
10. Evil Storm - event system

---

## 🚀 Quick Start Implementation

Would you like me to:

**Option A**: Fully implement the **3 simplest enemies** (Ice, Sniper, Protector) right now?

**Option B**: Create a **modular enemy ability system** that makes adding the rest easier?

**Option C**: Implement **ONE complete enemy** as a reference, then you can add the rest following the pattern?

Let me know which approach you'd prefer! 🎮
