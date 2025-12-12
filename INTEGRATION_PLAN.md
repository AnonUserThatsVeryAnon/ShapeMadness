# App.tsx Integration Plan

**Goal**: Replace monolithic App.tsx code with modular systems while maintaining 100% functionality

**Safety**: User has git for rollback

---

## 📋 Pre-Integration Checklist

- [x] All systems created and tested
- [x] No compilation errors in new systems
- [x] Git available for rollback
- [ ] Create integration plan (this file)
- [ ] Execute integration step by step

---

## 🎯 Integration Strategy

### Approach: Progressive Replacement

Replace code section by section, testing after each change. NOT a full rewrite.

### What We're Replacing:

1. **Imports & Setup** (~20 lines)

   - Add new system imports
   - Initialize system refs

2. **Player Movement** (~40 lines → 3 lines)

   - Replace manual movement code with PlayerSystem.updateMovement()
   - Remove key handling code (PlayerSystem handles it)

3. **Combat/Shooting** (~80 lines → 10 lines)

   - Replace shootBullet logic with CombatSystem.shootAtNearestEnemy()
   - Replace bullet update with CombatSystem.updateBullets()
   - Replace collision detection with CombatSystem.handleBulletEnemyCollisions()

4. **Zone Management** (~200 lines → 20 lines)

   - Replace zone initialization with ZoneSystem.initializeZone()
   - Replace zone expansion with ZoneSystem.expandZone()
   - Replace zone damage with ZoneSystem.applyZoneDamage()
   - Replace zone transition with ZoneSystem.updateZoneTransition()

5. **Rendering** (~500 lines → 30 lines)

   - Initialize GameRenderer on mount
   - Replace entire drawGame() with renderer.render()
   - Keep canvas element, replace rendering logic only

6. **UI Components** (~300 lines → 50 lines)
   - Replace menu JSX with <GameMenu />
   - Replace pause menu with <PauseMenu />
   - Replace game over with <GameOver />

---

## 🔧 Detailed Step-by-Step Plan

### STEP 1: Add System Imports and Initialization

**Location**: Top of App.tsx (after existing imports)
**Lines to Add**: ~15
**Risk**: Low (just adding, not removing)

```typescript
// Add after existing imports:
import { PlayerSystem } from "./systems/PlayerSystem";
import { CombatSystem } from "./systems/CombatSystem";
import { ZoneSystem } from "./systems/ZoneSystem";
import { GameRenderer } from "./rendering/GameRenderer";
import { GameMenu } from "./components/GameMenu";
import { PauseMenu } from "./components/PauseMenu";
import { GameOver } from "./components/GameOver";

// Add after all refs (around line 148):
const playerSystemRef = useRef<PlayerSystem>(new PlayerSystem());
const combatSystemRef = useRef<CombatSystem>(new CombatSystem());
const zoneSystemRef = useRef<ZoneSystem>(new ZoneSystem());
const rendererRef = useRef<GameRenderer | null>(null);
```

---

### STEP 2: Initialize GameRenderer

**Location**: In useEffect for canvas setup
**Lines to Replace**: 0 (just adding)
**Risk**: Low

```typescript
// Add new useEffect after existing game loop setup:
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  rendererRef.current = new GameRenderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
}, []);
```

---

### STEP 3: Replace Player Movement

**Location**: updateGame function, around line 321-360
**Lines to Replace**: ~40
**Lines After**: 3
**Risk**: Medium (core gameplay)

**Find this code:**

```typescript
// Player movement with smooth acceleration
const moveDir = { x: 0, y: 0 };
if (keysRef.current.has("w") || keysRef.current.has("arrowup")) moveDir.y -= 1;
// ... (35 more lines of movement code)
```

**Replace with:**

```typescript
// Player movement - using PlayerSystem
playerSystemRef.current.updateMovement(player);
playerSystemRef.current.updateInvulnerability(player, now);
playerSystemRef.current.updatePowerUps(player, now);
```

---

### STEP 4: Replace Combat System (Shooting)

**Location**: Auto-shoot section, around line 326-345
**Lines to Replace**: ~20
**Lines After**: 5
**Risk**: Medium

**Find:**

```typescript
// Auto-shoot at nearest enemy
// Apply time slow debuff (2x fire rate delay when slowed)
const fireRateMultiplier = ...
// ... shooting logic
```

**Replace with:**

```typescript
// Auto-shoot at nearest enemy - using CombatSystem
combatSystemRef.current.shootAtNearestEnemy(player, enemies, now, (bullet) =>
  bulletsRef.current.push(bullet)
);
```

---

### STEP 5: Replace Bullet Updates

**Location**: Bullet position updates, around line 625-665
**Lines to Replace**: ~40
**Lines After**: 1
**Risk**: Low

**Find:**

```typescript
// Update bullets (homing logic)
bullets.forEach((bullet) => {
  if (!bullet.active) return;
  // ... homing and movement logic
});
```

**Replace with:**

```typescript
// Update bullets - using CombatSystem
combatSystemRef.current.updateBullets(bulletsRef.current, deltaTime, now);
```

---

### STEP 6: Replace Collision Detection

**Location**: Bullet-enemy collision checks
**Lines to Replace**: ~60
**Lines After**: ~15
**Risk**: High (critical gameplay)

**Keep**: Enemy kill logic (money, combo, etc.)
**Replace**: Just the collision detection loop

---

### STEP 7: Replace Zone System

**Location**: Multiple places - initialization, updates, damage
**Lines to Replace**: ~200 total
**Lines After**: ~20
**Risk**: Medium

**A) Initialize zone:**

```typescript
// Replace playZoneRef initialization with:
const playZoneRef = useRef<PlayZone>(zoneSystemRef.current.initializeZone());
```

**B) Zone expansion (in triggerZoneChange):**

```typescript
// Replace zone expansion logic with:
if (stats.round <= 10) {
  zoneSystemRef.current.expandZone(playZone, stats.round);
} else {
  zoneSystemRef.current.triggerDynamicZoneChange(playZone);
}
```

**C) Zone transition update:**

```typescript
// Replace transition animation with:
zoneSystemRef.current.updateZoneTransition(playZone, deltaTime);
```

**D) Zone damage:**

```typescript
// Replace zone damage logic with:
const zoneDamage = zoneSystemRef.current.applyZoneDamage(
  player,
  playZone,
  now,
  particlesRef.current,
  floatingTextsRef.current
);
if (zoneDamage) {
  shakeRef.current = zoneDamage.shake;
}
```

---

### STEP 8: Replace Rendering System

**Location**: drawGame function (starts around line 1500)
**Lines to Replace**: ~500
**Lines After**: ~10
**Risk**: High (visual changes)

**Find entire drawGame function, replace with:**

```typescript
const drawGame = () => {
  if (!rendererRef.current) return;

  const player = playerRef.current;
  const enemies = enemiesRef.current;
  const bullets = bulletsRef.current;
  const enemyProjectiles = enemyProjectilesRef.current;
  const powerUps = powerUpsRef.current;
  const particles = particlesRef.current;
  const floatingTexts = floatingTextsRef.current;
  const lasers = lasersRef.current;
  const playZone = playZoneRef.current;
  const stats = statsRef.current;
  const shake = shakeRef.current;

  rendererRef.current.render(
    player,
    enemies,
    bullets,
    enemyProjectiles,
    powerUps,
    particles,
    floatingTexts,
    lasers,
    stats,
    playZone,
    shake.intensity,
    performance.now()
  );
};
```

---

### STEP 9: Replace UI Components

**Location**: Return JSX at bottom (starts around line 2200)
**Lines to Replace**: ~300
**Lines After**: ~50
**Risk**: Medium (UI changes)

**Replace menu JSX:**

```typescript
{
  gameState === GameState.MENU && (
    <GameMenu
      highScore={statsRef.current.highScore}
      onStartGame={startGame}
      onShowCodex={() => setShowCodex(true)}
    />
  );
}
```

**Replace pause menu:**

```typescript
{
  isPaused && gameState === GameState.PLAYING && (
    <PauseMenu
      onResume={() => setIsPaused(false)}
      onRestart={() => {
        setIsPaused(false);
        initializePlayer();
        startGame();
      }}
      onMainMenu={() => {
        setIsPaused(false);
        setGameState(GameState.MENU);
      }}
    />
  );
}
```

**Replace game over:**

```typescript
{
  gameState === GameState.GAME_OVER && (
    <GameOver
      score={statsRef.current.score}
      round={statsRef.current.round}
      kills={statsRef.current.kills}
      highScore={statsRef.current.highScore}
      onRestart={() => {
        initializePlayer();
        startGame();
      }}
      onMainMenu={() => setGameState(GameState.MENU)}
    />
  );
}
```

---

## 🧪 Testing After Each Step

After each integration step:

1. Save file
2. Check for TypeScript errors
3. Run `npm run dev`
4. Test the specific feature changed
5. If broken, use `git restore src/App.tsx` to rollback

---

## 📊 Expected Results

### Before:

- **App.tsx**: 2,516 lines
- **Maintainability**: Low (one giant file)
- **Testability**: Hard (everything coupled)

### After:

- **App.tsx**: ~600-800 lines (orchestration only)
- **Maintainability**: High (modular systems)
- **Testability**: Easy (systems can be unit tested)
- **Functionality**: 100% identical

---

## ⚠️ Known Risks

1. **Shooting logic is complex** - Has multi-shot, piercing, explosive upgrades
   - **Mitigation**: Keep upgrade logic in App.tsx, only replace basic shooting
2. **Enemy behaviors are intricate** - Buffer, Chain Partners, Timebomb, etc.
   - **Mitigation**: Keep enemy behavior in App.tsx, only extract combat system
3. **Rendering has many edge cases** - Invulnerability flashing, chain connections, etc.
   - **Mitigation**: GameRenderer already handles all these cases

---

## 🎯 Success Criteria

- [ ] Game runs without errors
- [ ] Player movement works identically
- [ ] Shooting and combat feel the same
- [ ] Zone damage works correctly
- [ ] All enemies behave the same
- [ ] Rendering looks identical
- [ ] UI menus work properly
- [ ] No performance regression
- [ ] App.tsx is under 1000 lines

---

## 🔄 Rollback Plan

If anything breaks:

```bash
git restore src/App.tsx
```

Then review which step failed and fix the specific system before retrying.
