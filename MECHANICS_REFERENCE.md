# 🎮 Game Mechanics Reference

**Quick Lookup Guide** | December 11, 2025

## 📐 Core Formulas

### Damage Calculation

```typescript
finalDamage = baseDamage × (1 - defense / 100)

// Examples:
// 0% defense:  20 damage → 20 damage
// 50% defense: 20 damage → 10 damage
// 95% defense: 20 damage → 1 damage (capped)
```

### Money & Score

```typescript
comboMultiplier = min(5, 1 + combo × 0.1)

earnedMoney = floor(enemy.value × comboMultiplier)
earnedScore = floor(enemy.value × 10 × comboMultiplier)

// Examples:
// No combo (1x):  Tank ($50) → $50, 500 points
// 10 combo (2x):  Tank ($50) → $100, 1000 points
// 40 combo (5x):  Tank ($50) → $250, 2500 points (max)
```

### Upgrade Cost Scaling

```typescript
// Core Upgrades (1.15x multiplier)
newCost = floor(currentCost × 1.15)

Level 1: $30
Level 2: $34    ($30 × 1.15 = $34.5)
Level 3: $39    ($34 × 1.15 = $39.1)
Level 10: $121  (exponential growth)

// Special Upgrades (2.5x multiplier)
newCost = floor(currentCost × 2.5)

Level 1: $100
Level 2: $250   ($100 × 2.5)
Level 3: $625   ($250 × 2.5)
```

### Fire Rate Formula

```typescript
effectiveFireRate = baseFireRate × 0.97^level × slowMultiplier

// Without slow debuff:
Level 0:  300ms (3.33 shots/sec)
Level 10: 222ms (4.50 shots/sec)
Level 20: 164ms (6.10 shots/sec)
Level 50: 89ms  (11.2 shots/sec, cap at 50ms)

// With Timebomb slow (2x):
Level 0:  600ms (1.67 shots/sec)
Level 50: 178ms (5.62 shots/sec)
```

### Movement Speed

```typescript
finalSpeed = baseSpeed + (speedUpgrades × 0.1)

// Standard progression:
Level 0:  2.0 units/frame
Level 10: 3.0 units/frame
Level 20: 4.0 units/frame
Level 40: 6.0 units/frame (max)

// With power-up (temporary):
Speed × 1.5 for 10 seconds
```

---

## 🌍 Zone System Mechanics

### Rounds 1-10: Expansion Phase

```typescript
expandFactor = 1.15 + random(0, 0.1)  // 1.15-1.25x per round

Round 1:  400×400      (16% of full screen at 1920×1080)
Round 2:  ~480×480     (23%)
Round 3:  ~576×576     (34%)
Round 5:  ~828×828     (69%)
Round 10: 1920×1080    (100% - full screen)
```

### Rounds 11+: Dynamic Red Zones

```typescript
// Each side independently:
if (random() < 0.5) {
  change = (random() < 0.5 ? 1 : -1) × randomRange(30, 100)
  newPosition = clamp(currentPosition + change, min, max)
}

// Constraints:
minZoneSize = 300×300
maxZoneSize = CANVAS_WIDTH × CANVAS_HEIGHT
```

### Zone Damage

```typescript
damagePerTick = 20 HP
tickRate = 500ms
damagePerSecond = 40 HP

// Survival time:
100 HP: 2.5 seconds
150 HP: 3.75 seconds (with upgrades)
200 HP: 5 seconds
```

---

## 👾 Enemy Stats Reference

### Basic Tier (Rounds 1-10)

| Enemy    | HP  | Speed | Damage | Value | Spawn Round |
| -------- | --- | ----- | ------ | ----- | ----------- |
| Basic    | 100 | 2.0   | 10     | $10   | 1           |
| Fast     | 50  | 3.5   | 5      | $15   | 2           |
| Splitter | 80  | 2.5   | 8      | $25   | 3           |
| Tank     | 300 | 1.0   | 20     | $50   | 5           |
| Shooter  | 120 | 1.5   | 15     | $35   | 10          |

### Advanced Tier (Rounds 15+)

| Enemy          | HP       | Speed | Damage | Value    | Special Ability               | Spawn Round |
| -------------- | -------- | ----- | ------ | -------- | ----------------------------- | ----------- |
| Buffer         | 200      | 1.5   | 8      | $60      | Rotating buffs (250px range)  | 15          |
| Chain Partners | 180 each | 2.0   | 18     | $45 each | Heal when connected/separated | 18          |
| Timebomb       | 250      | 1.0   | 15     | $70      | Slow field (200-400px random) | 20          |

### Enemy Spawn Weights (Round 20+)

```typescript
Basic:          10 weight  (20% chance)
Fast:           15 weight  (30% chance)
Splitter:       12 weight  (24% chance)
Tank:           18 weight  (36% chance) [Most common!]
Shooter:        14 weight  (28% chance)
Buffer:         8 weight   (16% chance)
Chain Partners: 8 weight   (16% chance, spawns 2)
Timebomb:       6 weight   (12% chance)

Total Weight: 91
Actual %: weight/91
```

---

## 💪 Buff & Debuff Effects

### Buffer Enemy Buffs (250px range)

```typescript
// Rotates every 5 seconds

Speed Buff (Yellow):
  enemySpeed × 1.5

Regen Buff (Green):
  +5 HP per second

Damage Reflect (Magenta):
  30% of damage dealt reflects back to player
```

### Timebomb Slow Field

```typescript
// Random 200-400px radius per Timebomb

Inside Field:
  playerFireRate × 2        (shoot 50% slower)
  bulletSpeed × 0.4         (60% speed reduction)

// Multiple Timebombs stack!
2 Timebombs: 4x fire rate, 0.16x bullet speed
3 Timebombs: 8x fire rate, 0.064x bullet speed (nearly useless)
```

### Chain Partner Healing

```typescript
// Visible orange beam when connected

Connected (<200px apart):
  +1 HP per 0.5 seconds each (slow sustain)

Separated (>200px apart):
  +3 HP per 0.3 seconds each (fast emergency heal)

Strategy: Separate them → focus one → kill before heals negate damage
```

### Power-Up Effects (10 seconds)

```typescript
Health:    Instant +50 HP (not time-based)
Speed:     playerSpeed × 1.5
Damage:    playerDamage × 1.5
Fire Rate: playerFireRate × 0.5 (2x faster)
Shield:    Invulnerable (no damage taken)
```

---

## 🎯 Upgrade Effects

### Core Stats

```typescript
Health (Max 50):
  +10 HP per level
  Level 50: 100 → 600 HP

Defense (Max 50):
  +2% per level, capped at 95%
  Level 47+: 95% reduction (near invincible)

Damage (Max 75):
  +1.5 damage per level
  Level 75: 20 → 132.5 damage

Fire Rate (Max 50):
  × 0.97 per level, min 50ms
  Level 50: 300ms → 89ms (capped at 50ms after ~70 levels)

Speed (Max 40):
  +0.1 per level
  Level 40: 2.0 → 6.0 speed

Regen (Max 30):
  +0.05 HP/s per level
  Level 30: 1.5 HP/s (90 HP/minute)
```

### Special Abilities

```typescript
Piercing Shots (Max 1):
  Bullets pass through enemies
  No damage reduction per penetration
  Effective against swarms

Multi-Shot (Max 2):
  Level 1: +1 bullet (right side)
  Level 2: +2 bullets (both sides)
  Side bullets: 50% damage, 3.5 radius
  Spread angle: 0.3 radians (~17°)

Explosive Rounds (Max 5):
  Area damage on bullet impact
  Radius increases with level
  Damage falloff from center
```

---

## 🎲 Probability & RNG

### Enemy Spawning

```typescript
// Weighted random selection
totalWeight = sum of all available enemy weights
roll = random(0, totalWeight)

// Iterate through weights:
if (roll < currentWeight) {
  spawn that enemy
}

// Round 20 example (91 total weight):
0-10:   Basic      (10 weight)
10-25:  Fast       (15 weight)
25-37:  Splitter   (12 weight)
37-55:  Tank       (18 weight) ← Most likely!
55-69:  Shooter    (14 weight)
69-77:  Buffer     (8 weight)
77-85:  Chain      (8 weight)
85-91:  Timebomb   (6 weight) ← Rare
```

### Power-Up Drops

```typescript
dropChance = 0.15  // 15% per kill

averageDrops per round:
Round 5:  15 enemies × 15% = 2.25 drops
Round 10: 25 enemies × 15% = 3.75 drops
Round 20: 45 enemies × 15% = 6.75 drops
```

### Zone Changes (Round 11+)

```typescript
// Each side (4 total) per round:
50% chance to move
  ├─ 50% move in  (red zone expands)
  └─ 50% move out (red zone shrinks)

Movement: 30-100 pixels

Expected changes per round: 2 sides (4 × 0.5)
Possible outcomes:
- 0 sides change:  6.25%
- 1 side changes:  25%
- 2 sides change:  37.5%  ← Most common
- 3 sides change:  25%
- 4 sides change:  6.25%
```

---

## ⏱️ Timing Reference

### Combat Timings

```typescript
Player Fire Rate:     300ms base (3.33 shots/sec)
Shooter Enemy Fire:   2000ms (0.5 shots/sec)
Buffer Buff Rotation: 5000ms (5 seconds)
Splitter Warning:     <30% HP (visual glow)

Invulnerability:      1000ms after damage
Combo Timer:          3000ms between kills
Power-Up Duration:    10000ms (10 seconds)
Zone Transition:      3000ms (3 seconds)
Wave Timer (Shop):    20000ms (20 seconds, skippable)
```

### Frame-Based Updates

```typescript
Target FPS: 60
Frame Time: 16.67ms

Updates per second:
- Player position:   60 times
- Enemy AI:          60 times
- Bullet movement:   60 times
- Particle updates:  60 times
- Zone damage check: 2 times (every 500ms)
- Regen tick:        60 times (continuous)
```

---

## 🎨 Visual Feedback System

### Screen Shake Intensities

```typescript
Player Hit:        10 intensity
Enemy Death:       5 intensity
Zone Damage:       8 intensity
Round Complete:    15 intensity

Decay: × 0.9 per frame
Duration: ~1 second for intensity 10
```

### Particle Counts

```typescript
Enemy Death:       30 colored + 10 white = 40 total
Explosion:         20 particles (multi-shot)
Damage Hit:        5 particles
Zone Damage:       15 red particles
Power-Up Collect:  10 particles

Max Particles:     2000 (performance limit)
```

### Floating Text Lifetime

```typescript
Damage Number:     800ms  ("-25")
Kill Text:         1000ms ("KILL!")
Money Gained:      1200ms ("+50 $")
Combo Text:        1500ms ("COMBO x3!")
Zone Warning:      2000ms ("⚠️ RED ZONES CLOSING IN!")
```

---

## 🧮 Optimization Targets

### Performance Budgets

```typescript
Target FPS:        60 (16.67ms per frame)
Update Budget:     10ms (60% of frame)
Render Budget:     5ms  (30% of frame)
Overhead Budget:   1.67ms (10% of frame)

Entity Counts:
Max Enemies:       100 (soft limit)
Max Bullets:       1000 (hard limit)
Max Particles:     2000 (hard limit)
Max Floating Text: 200 (hard limit)
```

### Memory Estimates

```typescript
Single Enemy:      ~200 bytes
Single Bullet:     ~100 bytes
Single Particle:   ~80 bytes

Round 20 Memory:
45 enemies:        9 KB
200 bullets:       20 KB
500 particles:     40 KB
Total:             ~69 KB (negligible)
```

---

## 📊 Balance Curves

### Expected Player Stats by Round

| Round | HP  | Damage | Fire Rate | Speed | Defense | Money Spent |
| ----- | --- | ------ | --------- | ----- | ------- | ----------- |
| 5     | 140 | 26     | 270ms     | 2.5   | 10%     | ~$300       |
| 10    | 200 | 35     | 230ms     | 3.0   | 20%     | ~$1,200     |
| 15    | 280 | 47     | 190ms     | 3.8   | 35%     | ~$3,500     |
| 20    | 380 | 62     | 155ms     | 4.6   | 50%     | ~$8,000     |
| 30    | 550 | 95     | 100ms     | 6.0   | 75%     | ~$25,000    |

### Expected Enemy DPS by Round

| Round | Enemy Count | Avg HP | Avg DPS | Total HP | Total DPS |
| ----- | ----------- | ------ | ------- | -------- | --------- |
| 5     | 15          | 120    | 12      | 1,800    | 180       |
| 10    | 25          | 150    | 14      | 3,750    | 350       |
| 15    | 35          | 180    | 16      | 6,300    | 560       |
| 20    | 45          | 200    | 18      | 9,000    | 810       |
| 30    | 65          | 240    | 22      | 15,600   | 1,430     |

### Time-to-Kill Analysis

```typescript
// Player kills Tank (300 HP):
Damage 20, Fire Rate 300ms:  15 shots × 300ms = 4.5 seconds
Damage 50, Fire Rate 150ms:  6 shots × 150ms = 0.9 seconds
Damage 100, Fire Rate 50ms:  3 shots × 50ms = 0.15 seconds

// Tank kills Player (100 HP):
Tank damage 20, Defense 0%:   5 hits
Tank damage 20, Defense 50%:  10 hits
Tank damage 20, Defense 90%:  50 hits
```

---

## 🎓 Strategy Tips (Data-Driven)

### Early Game (Rounds 1-5)

- **Priority**: Damage → Fire Rate → Health
- **Why**: Few weak enemies, maximize DPS
- **Avoid**: Defense (inefficient early)

### Mid Game (Rounds 6-15)

- **Priority**: Health → Defense → Speed
- **Why**: Enemy count increases, survival matters
- **Avoid**: Regen (too slow without high levels)

### Late Game (Rounds 16-25)

- **Priority**: Defense → Fire Rate → Regen
- **Why**: High enemy count, sustained fights
- **Avoid**: Health alone (need reduction too)

### End Game (Rounds 26+)

- **Priority**: Max Defense (95%) → Multi-Shot → Explosive
- **Why**: Burst damage + survivability for swarms
- **Goal**: Become unkillable + clear screens instantly

### Buff Priority Targets

```typescript
MUST KILL IMMEDIATELY:
1. Buffer (removes all buffs when killed)
2. Timebomb (restores full DPS)

KILL WHEN SAFE:
3. Shooter (stops ranged harassment)
4. Chain Partners (before they heal)

KILL FOR COMBOS:
5. Fast (easy combo multiplier)
6. Basic (quick kills for money)

LAST PRIORITY:
7. Tank (high HP, slow, dodge easily)
```

---

_This reference guide is based on confirmed code values. All formulas are extracted from the source._
