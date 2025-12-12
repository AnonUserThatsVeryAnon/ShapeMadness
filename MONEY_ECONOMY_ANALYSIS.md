# 💰 Money Economy Deep Analysis & Balance Proposal

## 📊 Current State Analysis

### Money Sources

1. **Enemy Kills**

   - Formula: `earnedMoney = floor(enemy.value × comboMultiplier)`
   - Combo Multiplier: 1.0x → 3.0x (increases by 0.1 per kill, max at 20 combo)
   - Enemy Values:
     - Basic: 1
     - Fast: 15
     - Splitter: 25
     - Tank: 50
     - Shooter: 35
     - Buffer: 60
     - Chain Partner: 45
     - Time Distortion: 70
     - Boss (Overseer): 500

2. **Power-Up Drop Rate**
   - Currently: 8% chance per kill (was 15% in config but 0.08 in code)
   - **DISCREPANCY FOUND**: Config says 15%, code uses 8%

### Money Sinks (Upgrade Costs)

#### Core Upgrades (Starting Costs)

- Health: 30 (1.15x scaling, 50 levels)
- Defense: 40 (1.15x scaling, 200 levels)
- Damage: 25 (1.15x scaling, 75 levels)
- Fire Rate: 45 (1.15x scaling, 50 levels)
- Speed: 30 (1.15x scaling, 40 levels)
- Regen: 50 (1.15x scaling, 30 levels)

#### Special Upgrades (Starting Costs)

- Pierce: 100 (2.5x scaling, 1 level)
- Multi-Shot: 200 (2.5x scaling, 2 levels max)
- Explosive: 150 (2.5x scaling, 5 levels)

---

## 🧮 Economic Simulation

### Round-by-Round Money Earned (Perfect Combo)

| Round | Enemy Count | Avg Value/Enemy | Est. Money (Perfect) | Est. Money (Realistic) |
| ----- | ----------- | --------------- | -------------------- | ---------------------- |
| 1     | 7           | 1               | 14                   | 10                     |
| 2     | 9           | 8               | 144                  | 100                    |
| 3     | 11          | 10              | 220                  | 150                    |
| 5     | 15          | 20              | 600                  | 400                    |
| 10    | 25          | 30              | 1500                 | 1000                   |
| 15    | 35          | 40              | 2800                 | 1800                   |
| 20    | 45          | 50              | 4500                 | 3000                   |

**Calculation Method:**

- Enemy Count = 5 + round × 2
- Perfect = All enemies killed at 3x combo
- Realistic = Average 2x combo (accounting for combo breaks)

### Cumulative Money vs. Upgrade Costs

#### Through Round 5 (Early Game)

- **Total Money Earned**: ~700
- **Essential Upgrades Needed**:
  - 2x Damage (25, 29) = 54
  - 1x Fire Rate (45) = 45
  - 1x Health (30) = 30
  - **Total**: 129
- **Surplus**: 571 ✅ **Healthy**

#### Through Round 10 (Mid Game)

- **Total Money Earned**: ~3,000
- **Essential Upgrades Needed**:
  - 10x Damage (escalating) ≈ 400
  - 5x Fire Rate ≈ 350
  - 3x Health ≈ 120
  - 2x Defense ≈ 90
  - 1x Pierce = 100
  - **Total**: 1,060
- **Surplus**: 1,940 ✅ **Comfortable**

#### Through Round 15 (Boss Fight)

- **Total Money Earned**: ~7,000
- **Essential Upgrades Needed**:
  - 20x Damage ≈ 1,200
  - 10x Fire Rate ≈ 900
  - 5x Health ≈ 250
  - 5x Defense ≈ 300
  - 1x Multi-Shot = 200
  - 2x Speed ≈ 70
  - **Total**: 2,920
- **Surplus**: 4,080 ✅ **Strong**

#### Through Round 20 (Late Game)

- **Total Money Earned**: ~15,000
- **Full Upgrade Path**:
  - 30x Damage ≈ 2,500
  - 15x Fire Rate ≈ 1,800
  - 10x Health ≈ 600
  - 10x Defense ≈ 800
  - Special Upgrades ≈ 1,000
  - **Total**: 6,700
- **Surplus**: 8,300 ✅ **Abundant**

---

## 🔍 Problems Identified

### 1. **Power-Up Drop Discrepancy** ⚠️

- **Issue**: Config defines 15% but code uses 8%
- **Impact**: Players get fewer power-ups than intended
- **Severity**: MEDIUM - Affects power-up availability

### 2. **Boss Value Too High** ⚠️

- **Issue**: Boss gives 500 money (equivalent to 10 tanks)
- **Impact**: Massive money spike at round 15 distorts economy
- **Analysis**: 500 money is ~20% of total earnings through round 15
- **Severity**: MEDIUM - Creates unnatural progression spike

### 3. **Early Game Too Generous** ⚠️

- **Issue**: Players earn more than needed for essential upgrades
- **Impact**: Lack of meaningful choices in rounds 1-10
- **Severity**: LOW - Doesn't break game but reduces strategic depth

### 4. **Late Game Money Accumulation** ⚠️

- **Issue**: After round 15, money becomes abundant with no sinks
- **Impact**: Players max out builds and have nothing to spend on
- **Severity**: LOW - Endgame content design issue

### 5. **No Money Power-Up** ❌

- **Issue**: No direct money multiplier power-up exists
- **Impact**: Missed opportunity for economic gameplay
- **Severity**: LOW - Feature gap, not a bug

### 6. **Combo System Underutilized** ⚠️

- **Issue**: 3x max combo is easy to maintain
- **Impact**: Money multiplier becomes constant rather than skill-based
- **Severity**: LOW - Reduces skill expression

---

## 💡 Recommended Balance Changes

### Priority 1: Fix Power-Up Drop Rate (Critical)

```typescript
// In App.tsx line ~1085
if (Math.random() < 0.15) {
  // Changed from 0.08 to 0.15
  powerUpSystemRef.current.spawnPowerUp(
    enemy.position,
    now,
    powerUpsRef.current
  );
}
```

### Priority 2: Reduce Boss Money Reward

```typescript
// In enemies.ts OVERSEER config
value: 250, // Changed from 500 to 250
```

**Rationale**: Still significant reward, but not game-breaking spike

### Priority 3: Add Round-Based Money Scaling (NEW)

```typescript
// In App.tsx damageEnemy function
const roundBonus = stats.round >= 15 ? 1.3 : 1.0;
const earnedMoney = Math.floor(baseValue * stats.comboMultiplier * roundBonus);
```

**Rationale**: 30% money boost after round 15 helps with late-game upgrades

### Priority 4: Reduce Basic Enemy Value

```typescript
// In enemies.ts BASIC config
value: 0.5, // Changed from 1 to 0.5
```

**Rationale**: Basic enemies are cannon fodder, shouldn't be main money source

### Priority 5: Add Money Power-Up (NEW FEATURE)

```typescript
// In types/game.ts
export const PowerUpType = {
  HEALTH: "HEALTH",
  SPEED: "SPEED",
  DAMAGE: "DAMAGE",
  FIRE_RATE: "FIRE_RATE",
  SHIELD: "SHIELD",
  MONEY: "MONEY", // NEW
} as const;

// In PowerUpSystem.ts - 5% spawn chance
// Grants instant money based on current round
```

### Priority 6: Increase Combo Cap (Optional)

```typescript
// In gameConfig.ts
MAX_COMBO_MULTIPLIER: 5, // Changed from 3 to 5
```

**Rationale**: Rewards skilled play, adds skill ceiling

---

## 📈 Projected Impact

### After Changes - Round 15 Comparison

**Before:**

- Regular enemies: ~1,800
- Boss: 500 (28% of round income!)
- Total: 2,300

**After:**

- Regular enemies: ~1,500 (with lower basic value)
- Boss: 250 (14% of round income)
- Round 15+ bonus: +450
- Total: 2,200

**Result**: More consistent income curve, less spike

### Power-Up Availability

**Before:** 8% × 35 enemies = 2.8 power-ups per round (avg)
**After:** 15% × 35 enemies = 5.25 power-ups per round (avg)

**Result**: Nearly **2x power-up drops**, more dynamic gameplay

### Upgrade Path Affordability

With round bonus after 15, players can afford:

- More defensive upgrades for survival
- Experimentation with special upgrades
- Recovery from poor decisions

---

## 🎯 Final Recommendations

### Must Implement (Highest Value)

1. ✅ **Fix power-up drop rate** (0.08 → 0.15) - Aligns with design intent
2. ✅ **Add round 15+ money bonus** (30%) - Smooths late-game economy
3. ✅ **Reduce boss value** (500 → 250) - Removes economy spike

### Should Implement (High Value)

4. ✅ **Reduce basic enemy value** (1 → 0.5) - Better value distribution
5. ⚠️ **Add money power-up** - New feature, needs design work

### Consider (Medium Value)

6. ⚠️ **Increase combo cap** (3 → 5) - Adds skill ceiling
7. ⚠️ **Add more money sinks** (cosmetics, temporary buffs) - Late-game content

---

## 📊 Testing Checklist

After implementing changes:

- [ ] Play through to round 5 - Should afford 2-3 core upgrades
- [ ] Play through to round 10 - Should afford pierce + solid build
- [ ] Play through to round 15 - Should feel prepared for boss
- [ ] Defeat boss - Money reward should feel good but not game-breaking
- [ ] Play to round 20 - Should have meaningful upgrade choices remaining
- [ ] Verify power-up drop rate feels better (more frequent)
- [ ] Check combo multiplier impact on income variance

---

## 💭 Design Philosophy

The goal is a **balanced risk-reward economy** where:

1. ✅ Early game: Tight but not frustrating
2. ✅ Mid game: Meaningful upgrade choices
3. ✅ Boss reward: Significant but not dominant
4. ✅ Late game: Sustained progression curve
5. ✅ Power-ups: Frequent enough to matter

**Current State: 7/10** - Good foundation, needs polish
**After Changes: 9/10** - Refined, consistent, skill-rewarding
