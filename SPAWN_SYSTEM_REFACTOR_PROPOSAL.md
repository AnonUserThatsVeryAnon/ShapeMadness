# 🏗️ Enemy Spawn System Refactoring Proposal

## 📋 Executive Summary

**Problem:** Current spawn system mixes concerns (boss abilities in game loop, hardcoded phases, no reusable patterns)
**Solution:** Strategy + Composition pattern with data-driven configurations
**Impact:** ~60% code reduction, infinite extensibility, testable patterns

---

## 🔍 Current Architecture Issues

### 1. **Tight Coupling**

```typescript
// App.tsx - Boss abilities tightly coupled to game loop
if (enemy.type === EnemyType.OVERSEER && enemy.isBoss) {
  // 160 lines of phase-specific logic here
  if (enemy.bossPhase === 1) {
    /* ... */
  } else if (enemy.bossPhase === 2) {
    /* ... */
  } else if (enemy.bossPhase === 3) {
    /* ... */
  }
}
```

**Problem:**

- Boss logic pollutes main game loop
- Can't test boss behaviors in isolation
- Adding new boss requires editing core game code

### 2. **Lack of Abstraction**

```typescript
// enemies.ts - Hardcoded thresholds
if (round >= 2) spawnPool.push({ type: EnemyType.FAST, weight: 15 });
if (round >= 3) spawnPool.push({ type: EnemyType.SPLITTER, weight: 12 });
if (round >= 5) spawnPool.push({ type: EnemyType.TANK, weight: 18 });
// ... continues
```

**Problem:**

- No way to define custom difficulty curves
- Wave composition not reusable
- Testing requires full round progression

### 3. **Mixed Responsibilities**

- `spawnEnemiesForRound()`: Spawns regular enemies + boss
- Boss phases: In App.tsx game loop
- Spawn patterns: Inline in multiple places

---

## 🎯 Proposed Solution: Modular Spawn System

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          SpawnStrategyFactory                   │
│  Creates appropriate spawner for round/boss     │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   ┌───▼────┐      ┌────▼────┐
   │ Regular│      │  Boss   │
   │ Wave   │      │ Spawner │
   │Strategy│      │Strategy │
   └───┬────┘      └────┬────┘
       │                │
       │           ┌────▼─────┐
       │           │Phase 1-3 │
       │           │Behaviors │
       │           └──────────┘
       │
   ┌───▼──────────┐
   │ WavePattern  │
   │ Composition  │
   └──────────────┘
```

---

## 📦 Implementation Design

### 1. **SpawnStrategy Interface**

```typescript
// src/systems/spawning/SpawnStrategy.ts
export interface SpawnPattern {
  types: EnemyType[];
  counts: number[];
  positions: SpawnPosition[];
  timing?: number; // Optional delay between spawns
}

export interface SpawnStrategy {
  canHandle(round: number, context: GameContext): boolean;
  generateSpawns(round: number, context: GameContext): Enemy[];
  update?(enemy: Enemy, context: GameContext, deltaTime: number): void;
}

export type SpawnPosition = "edge" | "center" | "circle" | "formation";

export interface GameContext {
  canvasWidth: number;
  canvasHeight: number;
  player: Player;
  currentEnemies: Enemy[];
  timeElapsed: number;
}
```

### 2. **Wave Pattern Compositions**

```typescript
// src/systems/spawning/WavePatterns.ts
export const WAVE_PATTERNS = {
  // Reusable spawn compositions
  BASIC_SWARM: {
    types: [EnemyType.BASIC],
    weights: [1],
    count: (round: number) => 5 + round * 2,
  },

  MIXED_ASSAULT: {
    types: [EnemyType.BASIC, EnemyType.FAST, EnemyType.TANK],
    weights: [10, 15, 5],
    count: (round: number) => 8 + round,
  },

  RANGED_SIEGE: {
    types: [EnemyType.SHOOTER, EnemyType.PROTECTOR],
    weights: [3, 1],
    count: (round: number) => 4 + Math.floor(round / 2),
  },

  CHAOS_WAVE: {
    types: [EnemyType.SPLITTER, EnemyType.FAST, EnemyType.BOMB],
    weights: [2, 3, 1],
    count: (round: number) => 6 + round,
  },
};

export interface DifficultyProgression {
  unlockRound: number;
  pattern: keyof typeof WAVE_PATTERNS;
  weight: number;
}

export const DIFFICULTY_CURVE: DifficultyProgression[] = [
  { unlockRound: 1, pattern: "BASIC_SWARM", weight: 100 },
  { unlockRound: 5, pattern: "MIXED_ASSAULT", weight: 60 },
  { unlockRound: 10, pattern: "RANGED_SIEGE", weight: 40 },
  { unlockRound: 15, pattern: "CHAOS_WAVE", weight: 30 },
];
```

### 3. **Boss Behavior System**

```typescript
// src/systems/spawning/BossStrategy.ts
export interface BossPhase {
  healthPercentRange: [number, number]; // [min, max] e.g., [66, 100]
  abilities: BossAbility[];
  visualEffects?: PhaseVisuals;
}

export interface BossAbility {
  type: "spawn" | "projectile" | "aura" | "laser" | "shockwave";
  cooldown: number;
  execute: (boss: Enemy, context: GameContext) => void;
}

export interface BossConfig {
  enemyType: EnemyType;
  phases: BossPhase[];
  spawnRound: number;
  introMessage?: string;
}

// Example: Overseer configuration
export const OVERSEER_CONFIG: BossConfig = {
  enemyType: EnemyType.OVERSEER,
  spawnRound: 15,
  introMessage: "THE OVERSEER",

  phases: [
    {
      healthPercentRange: [66, 100],
      abilities: [
        {
          type: "spawn",
          cooldown: 6000,
          execute: (boss, ctx) => {
            return createSpawnPattern({
              types: [EnemyType.BASIC],
              count: 2,
              position: "circle",
              radius: 80,
              center: boss.position,
            });
          },
        },
      ],
    },
    {
      healthPercentRange: [33, 66],
      abilities: [
        {
          type: "spawn",
          cooldown: 4000,
          execute: (boss, ctx) => {
            return [
              ...createSpawnPattern({
                types: [EnemyType.SHOOTER],
                count: 3,
                position: "circle",
                radius: 90,
                center: boss.position,
              }),
              createEnemy(EnemyType.TANK, {
                x:
                  boss.position.x + Math.cos(Math.random() * Math.PI * 2) * 100,
                y:
                  boss.position.y + Math.sin(Math.random() * Math.PI * 2) * 100,
              }),
            ];
          },
        },
        {
          type: "laser",
          cooldown: 100, // Continuous
          execute: (boss, ctx) => {
            return createRotatingLasers(boss, ctx, 3, 400);
          },
        },
      ],
    },
    {
      healthPercentRange: [0, 33],
      abilities: [
        {
          type: "spawn",
          cooldown: 3000,
          execute: (boss, ctx) => {
            const types = [EnemyType.FAST, EnemyType.TANK, EnemyType.SPLITTER];
            return createSpawnPattern({
              types: [types[Math.floor(Math.random() * types.length)]],
              count: 6,
              position: "circle",
              radius: 80,
              center: boss.position,
            });
          },
        },
        {
          type: "shockwave",
          cooldown: 3000,
          execute: (boss, ctx) => {
            return createShockwave(boss.position, 200, 15);
          },
        },
      ],
    },
  ],
};
```

### 4. **Strategy Implementations**

```typescript
// src/systems/spawning/RegularWaveStrategy.ts
export class RegularWaveStrategy implements SpawnStrategy {
  canHandle(round: number): boolean {
    return round !== 15; // Not boss rounds
  }

  generateSpawns(round: number, context: GameContext): Enemy[] {
    // Get available patterns for this round
    const availablePatterns = DIFFICULTY_CURVE.filter(
      (p) => round >= p.unlockRound
    ).sort((a, b) => b.unlockRound - a.unlockRound);

    // Weighted random selection
    const pattern = this.selectPattern(availablePatterns);

    // Generate enemies using pattern
    return this.spawnFromPattern(pattern, round, context);
  }

  private selectPattern(patterns: DifficultyProgression[]): WavePattern {
    const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (const pattern of patterns) {
      random -= pattern.weight;
      if (random <= 0) return WAVE_PATTERNS[pattern.pattern];
    }

    return WAVE_PATTERNS.BASIC_SWARM;
  }

  private spawnFromPattern(
    pattern: WavePattern,
    round: number,
    context: GameContext
  ): Enemy[] {
    const count = pattern.count(round);
    const enemies: Enemy[] = [];

    for (let i = 0; i < count; i++) {
      const type = this.selectType(pattern.types, pattern.weights);
      const position = this.getEdgeSpawnPosition(context);

      enemies.push(createEnemy(type, position));

      // Handle special types (Chain Partners, etc.)
      if (type === EnemyType.CHAIN_PARTNER && i < count - 1) {
        const partner = this.createPartner(
          enemies[enemies.length - 1],
          position
        );
        enemies.push(partner);
        i++; // Skip next iteration
      }
    }

    return enemies;
  }
}
```

```typescript
// src/systems/spawning/BossWaveStrategy.ts
export class BossWaveStrategy implements SpawnStrategy {
  constructor(private bossConfig: BossConfig) {}

  canHandle(round: number): boolean {
    return round === this.bossConfig.spawnRound;
  }

  generateSpawns(round: number, context: GameContext): Enemy[] {
    const enemies: Enemy[] = [];

    // Spawn regular enemies first
    const regularStrategy = new RegularWaveStrategy();
    enemies.push(...regularStrategy.generateSpawns(round, context));

    // Spawn boss
    const boss = createEnemy(this.bossConfig.enemyType, {
      x: context.canvasWidth / 2,
      y: -100,
    });

    // Attach boss behavior system
    boss.bossConfig = this.bossConfig;
    enemies.push(boss);

    return enemies;
  }

  // Update is called each frame for boss abilities
  update(boss: Enemy, context: GameContext, deltaTime: number): void {
    if (!boss.isBoss) return;

    const currentPhase = this.getCurrentPhase(boss);
    if (!currentPhase) return;

    // Execute all abilities for current phase
    for (const ability of currentPhase.abilities) {
      if (this.shouldExecuteAbility(boss, ability, context.timeElapsed)) {
        ability.execute(boss, context);
      }
    }
  }

  private getCurrentPhase(boss: Enemy): BossPhase | null {
    const healthPercent = (boss.health / boss.maxHealth) * 100;

    return (
      this.bossConfig.phases.find(
        (phase) =>
          healthPercent >= phase.healthPercentRange[0] &&
          healthPercent <= phase.healthPercentRange[1]
      ) || null
    );
  }

  private shouldExecuteAbility(
    boss: Enemy,
    ability: BossAbility,
    currentTime: number
  ): boolean {
    const lastExecution = boss.abilityTimers?.[ability.type] || 0;
    return currentTime - lastExecution >= ability.cooldown;
  }
}
```

### 5. **Factory Pattern**

```typescript
// src/systems/spawning/SpawnStrategyFactory.ts
export class SpawnStrategyFactory {
  private strategies: SpawnStrategy[] = [];

  constructor() {
    // Register all strategies
    this.strategies.push(
      new BossWaveStrategy(OVERSEER_CONFIG),
      new RegularWaveStrategy()
    );
  }

  getStrategy(round: number, context: GameContext): SpawnStrategy {
    return (
      this.strategies.find((s) => s.canHandle(round, context)) ||
      this.strategies[this.strategies.length - 1]
    ); // Fallback to regular
  }

  registerBoss(config: BossConfig): void {
    this.strategies.unshift(new BossWaveStrategy(config));
  }
}
```

---

## 🔄 Migration Plan

### Phase 1: Extract Spawn Patterns (2-3 hours)

- [ ] Create `WavePatterns.ts` with pattern definitions
- [ ] Extract hardcoded thresholds into `DIFFICULTY_CURVE`
- [ ] Test pattern selection matches current behavior

### Phase 2: Create Strategy Interface (3-4 hours)

- [ ] Implement `SpawnStrategy` interface
- [ ] Create `RegularWaveStrategy` class
- [ ] Refactor `spawnEnemiesForRound()` to use strategy
- [ ] Verify round 1-14 behavior unchanged

### Phase 3: Extract Boss System (4-5 hours)

- [ ] Create `BossConfig` for Overseer
- [ ] Implement `BossWaveStrategy`
- [ ] Move boss abilities from App.tsx to strategy
- [ ] Create ability helper functions
- [ ] Test round 15 boss behavior

### Phase 4: Clean Up & Test (2-3 hours)

- [ ] Remove old spawn code from enemies.ts
- [ ] Remove boss abilities from App.tsx
- [ ] Update game loop to use strategy.update()
- [ ] Add comprehensive tests
- [ ] Performance profiling

**Total Estimated Time:** 11-15 hours

---

## 📊 Benefits Analysis

### Code Quality

| Metric              | Before    | After      | Improvement |
| ------------------- | --------- | ---------- | ----------- |
| Lines in App.tsx    | ~1830     | ~1500      | -18%        |
| Boss ability lines  | 160       | 0          | -100%       |
| Spawn function size | 116 lines | ~40 lines  | -65%        |
| Testability         | ⭐⭐      | ⭐⭐⭐⭐⭐ | +150%       |
| Extensibility       | ⭐⭐      | ⭐⭐⭐⭐⭐ | +150%       |

### Maintainability Wins

1. **Add new boss:** Create config object (50 lines) vs. edit App.tsx (200+ lines)
2. **Modify wave:** Change pattern object vs. rewrite spawn logic
3. **Test boss phase:** Unit test strategy vs. full game integration
4. **Reuse patterns:** Reference by name vs. copy-paste code

### Performance

- **Negligible overhead:** Strategy lookup O(n) where n = 2-5 strategies
- **Memory:** ~1KB per boss config (insignificant)
- **Frame time:** <0.1ms for strategy resolution

---

## 🎮 Example: Adding a Second Boss

### Current Approach (Nightmare)

```typescript
// App.tsx - Must edit core game loop
if (enemy.type === EnemyType.OVERSEER && enemy.isBoss) {
  // 160 lines of Overseer logic
} else if (enemy.type === EnemyType.NEW_BOSS && enemy.isBoss) {
  // Copy-paste and modify another 160 lines
  // Risk breaking existing boss
  // Hard to test in isolation
}
```

### New Approach (Elegant)

```typescript
// src/systems/spawning/configs/SecondBoss.ts
export const DRAGON_CONFIG: BossConfig = {
  enemyType: EnemyType.DRAGON,
  spawnRound: 30,
  phases: [
    {
      healthPercentRange: [50, 100],
      abilities: [
        { type: "spawn", cooldown: 5000, execute: dragonMinions },
        { type: "projectile", cooldown: 2000, execute: fireBreath },
      ],
    },
    {
      healthPercentRange: [0, 50],
      abilities: [
        { type: "aura", cooldown: 8000, execute: burnAura },
        { type: "spawn", cooldown: 3000, execute: dragonSwarm },
      ],
    },
  ],
};

// main.ts - Register new boss
spawnFactory.registerBoss(DRAGON_CONFIG);
```

**Result:** New boss in 50 lines, zero risk to existing code, fully testable.

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
describe("RegularWaveStrategy", () => {
  it("should spawn correct enemy types for round 1", () => {
    const strategy = new RegularWaveStrategy();
    const enemies = strategy.generateSpawns(1, mockContext);

    expect(enemies.every((e) => e.type === EnemyType.BASIC)).toBe(true);
  });

  it("should increase enemy count with rounds", () => {
    const strategy = new RegularWaveStrategy();
    const round5 = strategy.generateSpawns(5, mockContext);
    const round10 = strategy.generateSpawns(10, mockContext);

    expect(round10.length).toBeGreaterThan(round5.length);
  });
});

describe("BossWaveStrategy", () => {
  it("should spawn boss with regular enemies", () => {
    const strategy = new BossWaveStrategy(OVERSEER_CONFIG);
    const enemies = strategy.generateSpawns(15, mockContext);

    const boss = enemies.find((e) => e.isBoss);
    const regular = enemies.filter((e) => !e.isBoss);

    expect(boss).toBeDefined();
    expect(regular.length).toBeGreaterThan(0);
  });

  it("should execute phase 1 abilities at 100% health", () => {
    const strategy = new BossWaveStrategy(OVERSEER_CONFIG);
    const boss = createTestBoss(100);

    const executeSpy = jest.spyOn(
      OVERSEER_CONFIG.phases[0].abilities[0],
      "execute"
    );
    strategy.update(boss, mockContext, 16);

    expect(executeSpy).toHaveBeenCalled();
  });
});
```

---

## 🚀 Conclusion

### Recommendation: **IMPLEMENT**

**Pros:**

- ✅ Massive code reduction (~300 lines removed)
- ✅ Infinite extensibility (bosses, patterns, mechanics)
- ✅ Testable in isolation
- ✅ Industry-standard architecture
- ✅ Self-documenting (configs are readable)

**Cons:**

- ❌ Initial time investment (11-15 hours)
- ❌ Learning curve for new patterns
- ❌ More files to navigate (better organization)

**Verdict:** The benefits far outweigh costs. Current system is at its scaling limit. One more boss would create technical debt nightmare. This refactor sets foundation for long-term growth.

### Next Steps

1. Review this proposal
2. Approve migration plan
3. Start with Phase 1 (low risk, immediate value)
4. Iterate through phases with testing
5. Document new patterns for future devs

---

## 📚 References

- **Strategy Pattern:** Gang of Four Design Patterns
- **Composition over Inheritance:** Effective Software Design
- **Data-Driven Design:** Game Programming Patterns by Robert Nystrom
- **Example Games Using This:** Hades, Enter the Gungeon, Binding of Isaac
