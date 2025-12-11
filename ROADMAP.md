# 🗺️ Mouse Defense - Development Roadmap

**Last Updated**: December 11, 2025

## 📋 Overview

This roadmap consolidates all identified issues, improvements, and features based on comprehensive code review. Items are prioritized by impact and urgency.

**Current Project Status**: B+ (Very Good)

- ✅ Fully playable and polished
- ⚠️ Needs architectural refactoring
- ⚠️ Missing test coverage
- ⚠️ 7 incomplete enemy types

---

## 🔴 CRITICAL PRIORITY (Do First)

### 1. Refactor App.tsx (2,510 lines → ~500 lines)

**Problem**: Monolithic component, unmaintainable, violates best practices  
**Impact**: High - Blocks future development  
**Effort**: 2-3 days

**Tasks**:

- [ ] Extract rendering logic to `GameCanvas.tsx` component
- [ ] Migrate to existing `useGameLoop` hook (already implemented but unused)
- [ ] Move game state to Zustand store (already created but unused)
  - Keep refs for high-frequency updates (position, velocity)
  - Use Zustand for UI state, game state, upgrades, stats
- [ ] Split `updateGame()` into smaller functions:
  - `updatePlayerMovement()`
  - `handlePlayerShooting()`
  - `updateAllEnemies()`
  - `checkCollisions()`
  - `updateParticles()`
  - `handleZoneDamage()`
  - `checkRoundCompletion()`
- [ ] Extract collision detection to `CollisionSystem` (exists but not used)
- [ ] Extract damage calculation to `DamageSystem` (exists but not used)

**Files to Create/Modify**:

- `src/components/GameCanvas.tsx` (new)
- `src/hooks/useGameState.ts` (new - wraps Zustand)
- `src/App.tsx` (reduce to orchestration only)

---

### 2. Fix State Management Inconsistency

**Problem**: Zustand store exists but all state uses refs (confusing hybrid)  
**Impact**: Medium - Causes confusion, makes debugging hard  
**Effort**: 1 day

**Decision Required**: Choose ONE approach:

**Option A - Keep Refs (Recommended)**:

- [ ] Delete `src/store/gameStore.ts`
- [ ] Document why refs are used (performance)
- [ ] Create proper ref management utilities

**Option B - Use Zustand**:

- [ ] Migrate UI state to Zustand (game state, paused, shop tab)
- [ ] Keep refs only for 60 FPS updates (positions, velocities)
- [ ] Update all components to use hooks

**Recommendation**: Option A (refs are fine for game loops)

---

### 3. Fix Confirmed Bugs

**Impact**: Medium - Affects player experience  
**Effort**: 2-3 hours

#### Bug #1: Power-Ups Persist Across Restarts

```typescript
// In initializePlayer():
powerUpsRef.current = []; // ADD THIS LINE
```

#### Bug #2: Splitter Children Spawn Inside Player

```typescript
// In splitter death logic:
const offset = 30; // Spawn distance
const angle1 = Math.random() * Math.PI * 2;
const angle2 = angle1 + Math.PI;

const child1Pos = {
  x: enemy.position.x + Math.cos(angle1) * offset,
  y: enemy.position.y + Math.sin(angle1) * offset,
};
const child2Pos = {
  x: enemy.position.x + Math.cos(angle2) * offset,
  y: enemy.position.y + Math.sin(angle2) * offset,
};
```

#### Bug #3: Combo Multiplier Not Displayed

```typescript
// In HUD rendering:
ctx.fillText(
  `Combo: ${stats.combo}x (${stats.comboMultiplier.toFixed(1)}x)`,
  x,
  y
);
```

#### Bug #4: Audio Context Suspended

```typescript
// In audioSystem.init():
document.addEventListener(
  "click",
  () => {
    if (this.context?.state === "suspended") {
      this.context.resume();
    }
  },
  { once: true }
);
```

---

## 🟠 HIGH PRIORITY (Week 1-2)

### 4. Implement Object Pooling

**Problem**: Creating new objects every frame causes GC pressure  
**Impact**: High - Performance on weak devices  
**Effort**: 3-4 days

**Tasks**:

- [ ] Create `BulletPool` class (reuse existing objectPool.ts)
- [ ] Create `ParticlePool` class
- [ ] Create `EnemyProjectilePool` class
- [ ] Update shooting logic to use pools
- [ ] Update particle creation to use pools
- [ ] Benchmark performance improvement

**Expected Results**:

- Reduce GC pauses from ~16ms to <5ms
- Increase frame stability on low-end devices

---

### 5. Add Comprehensive Tests

**Problem**: Only 15% coverage, risky for changes  
**Impact**: High - Prevents confident refactoring  
**Effort**: 1 week

**Test Coverage Goals** (60% total):

#### Upgrade System Tests (Priority 1)

- [ ] Test damage upgrade calculations
- [ ] Test fire rate upgrade (with 50ms cap)
- [ ] Test defense upgrade (with 95% cap)
- [ ] Test cost scaling (1.15x core, 2.5x special)
- [ ] Test multi-shot bullet creation
- [ ] Test piercing shot collision logic

#### Enemy System Tests (Priority 2)

- [ ] Test round 1 spawns only basic enemies
- [ ] Test enemy type unlock by round number
- [ ] Test weighted spawn selection
- [ ] Test splitter split logic
- [ ] Test chain partner healing
- [ ] Test timebomb slow field effects
- [ ] Test buffer buff application

#### Zone System Tests (Priority 3)

- [ ] Test zone expansion (rounds 1-10)
- [ ] Test zone dynamic changes (round 11+)
- [ ] Test zone damage application (40 HP/s)
- [ ] Test zone damage respects invulnerability
- [ ] Test minimum zone size (300x300)

#### Combat Tests (Priority 4)

- [ ] Test combo system (3s timer, 5x max)
- [ ] Test damage calculation with defense
- [ ] Test bullet homing logic
- [ ] Test collision detection accuracy

**Files to Create**:

- `src/test/UpgradeSystem.test.ts`
- `src/test/EnemySpawning.test.ts`
- `src/test/ZoneSystem.test.ts`
- `src/test/CombatSystem.test.ts`

---

### 6. Complete Enemy Implementations

**Problem**: 7 enemy types have configs but no behaviors  
**Impact**: Medium - Game feels incomplete  
**Effort**: 2 weeks (OR 1 hour to mark as "Coming Soon")

**Decision Required**: Complete OR postpone?

**Option A - Complete All 7 Enemies** (Recommended):

#### Protector

- [ ] Shield nearby enemies (reduce damage by 50%)
- [ ] Visible shield radius (200px)
- [ ] Priority target (high value)

#### Magician

- [ ] Teleport every 5 seconds when close to player
- [ ] Create 2 illusion clones (50% HP, 0 damage)
- [ ] Illusions disappear when magician dies

#### Sniper

- [ ] Charge shot (2s warning line)
- [ ] High damage (60 HP)
- [ ] Stays far from player (>400px)

#### Ice

- [ ] Shoots freezing projectiles
- [ ] Player hit: slowed 50% for 3 seconds
- [ ] Blue icy visual effects

#### Bomb

- [ ] Explodes on death
- [ ] Deals 25 damage in 100px radius
- [ ] Runs toward player when low HP

#### Evil Storm

- [ ] Boss-type enemy
- [ ] Fires laser beams every 3 seconds
- [ ] Spawns 2 basic enemies every 10 seconds

#### Lufti

- [ ] Fast erratic movement (like Fast but more chaotic)
- [ ] Leaves trail of damaging zones
- [ ] Green visual theme

**Option B - Mark as Coming Soon**:

- [ ] Update codex entries: "Coming in future update"
- [ ] Remove from spawn tables
- [ ] Add "Locked" UI indicator

---

### 7. Performance Optimizations

**Problem**: Can lag with many entities  
**Impact**: Medium - User experience on weak devices  
**Effort**: 3-4 days

**Tasks**:

- [ ] Implement entity culling (only update on-screen enemies)
- [ ] Enforce MAX_FLOATING_TEXTS (200) with array slicing
- [ ] Reduce particle count per enemy death (40 → 20)
- [ ] Add performance monitoring (FPS counter)
- [ ] Implement dirty rectangle rendering (optional, advanced)
- [ ] Profile with Chrome DevTools
- [ ] Test on low-end device (or throttle CPU)

**Performance Targets**:

- Maintain 60 FPS with 50 enemies + 500 particles
- Reduce memory usage by 30%
- Eliminate frame drops during enemy death explosions

---

## 🟡 MEDIUM PRIORITY (Week 3-4)

### 8. Settings Menu Integration

**Problem**: UI exists but not functional  
**Impact**: Low - Nice to have  
**Effort**: 2 days

**Tasks**:

- [ ] Wire up volume controls (master, SFX, music)
- [ ] Implement mute toggle
- [ ] Add particle quality settings (low/medium/high)
- [ ] Add screen shake toggle
- [ ] Add FPS counter toggle
- [ ] Persist settings to localStorage
- [ ] Add settings button to pause menu

---

### 9. Improve Documentation

**Problem**: Some inline docs missing  
**Impact**: Low - Only affects maintainability  
**Effort**: 1 day

**Tasks**:

- [ ] Add JSDoc to all public functions
- [ ] Document complex algorithms (zone boundaries, enemy AI)
- [ ] Add inline comments for upgrade formulas
- [ ] Create CONTRIBUTING.md for future developers

---

### 10. Balance Adjustments

**Problem**: Economy tight after round 15  
**Impact**: Low - Gameplay tweak  
**Effort**: 1 day

**Tasks**:

- [ ] Increase money drops after round 15 by 20%
- [ ] Reduce core upgrade cost scaling (1.15x → 1.12x)
- [ ] Buff explosive rounds damage
- [ ] Nerf timebomb slow effect (2x → 1.5x fire rate penalty)
- [ ] Playtesting and iteration

---

## 🟢 LOW PRIORITY (Future/Optional)

### 11. Mobile Support

**Effort**: 1 week

- [ ] Add touch controls (virtual joystick)
- [ ] Optimize for smaller screens
- [ ] Test on mobile devices
- [ ] Add mobile-specific UI adjustments

### 12. Accessibility Features

**Effort**: 3-4 days

- [ ] Keyboard navigation for menus
- [ ] Color-blind mode (change enemy colors)
- [ ] Reduced motion option
- [ ] High contrast mode

### 13. Meta-Progression System

**Effort**: 2 weeks

- [ ] Persistent currency between runs
- [ ] Unlock system (new abilities, weapons)
- [ ] Achievement system (20-30 achievements)
- [ ] Stat tracking (total kills, best round, etc.)

### 14. Additional Weapons

**Effort**: 1 week per weapon

- [ ] Shotgun (spread shot)
- [ ] Laser beam (continuous damage)
- [ ] Missile launcher (homing, explosive)
- [ ] Weapon switching UI

### 15. Active Abilities

**Effort**: 1 week

- [ ] Dash ability (teleport short distance)
- [ ] Time-slow ability (5s duration, 30s cooldown)
- [ ] Nuke ability (clear screen, 60s cooldown)
- [ ] Shield ability (5s invincibility, 45s cooldown)

### 16. Advanced Features

**Effort**: Varies

- [ ] Local leaderboard (top 10 scores)
- [ ] Daily challenges
- [ ] Boss enemies (every 10 rounds)
- [ ] Multiple game modes (survival, time attack, boss rush)
- [ ] Replay system
- [ ] Screenshot/share feature

---

## 📊 Progress Tracking

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Fix critical issues, establish solid base

| Task                     | Status | Est. | Priority |
| ------------------------ | ------ | ---- | -------- |
| Refactor App.tsx         | ⬜     | 3d   | Critical |
| Fix state management     | ⬜     | 1d   | Critical |
| Fix bugs (4 total)       | ⬜     | 3h   | Critical |
| Implement object pooling | ⬜     | 4d   | High     |
| Add tests (60% coverage) | ⬜     | 5d   | High     |

**Success Criteria**:

- App.tsx under 500 lines
- All bugs fixed
- Test coverage >60%
- Performance improved

---

### Phase 2: Completion (Weeks 3-4)

**Goal**: Complete half-finished features

| Task                     | Status | Est. | Priority |
| ------------------------ | ------ | ---- | -------- |
| Complete 7 enemies       | ⬜     | 10d  | High     |
| Performance optimization | ⬜     | 4d   | High     |
| Settings menu            | ⬜     | 2d   | Medium   |
| Balance adjustments      | ⬜     | 1d   | Medium   |
| Documentation            | ⬜     | 1d   | Medium   |

**Success Criteria**:

- All 15 enemies working
- 60 FPS with 50+ enemies
- Settings functional
- Economy balanced

---

### Phase 3: Polish (Weeks 5-6)

**Goal**: Optional improvements

| Task             | Status | Est. | Priority |
| ---------------- | ------ | ---- | -------- |
| Mobile support   | ⬜     | 5d   | Low      |
| Accessibility    | ⬜     | 4d   | Low      |
| Meta-progression | ⬜     | 10d  | Low      |

**Success Criteria**:

- Works on mobile
- Accessible features
- Long-term replayability

---

## 🎯 Definition of Done

### For Each Task

- [ ] Code implemented and tested
- [ ] Tests written (if applicable)
- [ ] Documentation updated
- [ ] No new console errors
- [ ] Performance verified (60 FPS)
- [ ] Code reviewed (if team)

### For Each Phase

- [ ] All phase tasks complete
- [ ] Playtesting session done
- [ ] Bugs fixed
- [ ] Performance benchmarked
- [ ] Documentation current

---

## 🔧 Technical Debt Tracking

### Current Debt Items

1. **App.tsx Size** (Critical)

   - Debt: 2,510 lines in one file
   - Impact: Blocks all future work
   - Fix: Phase 1, Task 1

2. **No Object Pooling** (High)

   - Debt: GC pressure every frame
   - Impact: Performance on weak devices
   - Fix: Phase 1, Task 4

3. **Low Test Coverage** (High)

   - Debt: Only 15% coverage
   - Impact: Risky refactoring
   - Fix: Phase 1, Task 5

4. **Incomplete Enemies** (Medium)

   - Debt: 7 placeholder types
   - Impact: Game feels unfinished
   - Fix: Phase 2, Task 1

5. **Unused Systems** (Low)
   - Debt: Zustand store, useGameLoop, behavior system not used
   - Impact: Confusing codebase
   - Fix: Phase 1, Tasks 1-2

---

## 📈 Metrics & Goals

### Code Quality Goals

- **Test Coverage**: 15% → 60% (Phase 1)
- **Largest File**: 2,510 lines → 500 lines (Phase 1)
- **Type Coverage**: 95% (maintain)
- **Performance**: 60 FPS stable (Phase 2)

### Feature Completeness Goals

- **Enemy Types**: 8/15 → 15/15 (Phase 2)
- **Bugs**: 4 known → 0 (Phase 1)
- **Settings**: 0% → 100% functional (Phase 2)
- **Tests**: 3 files → 8+ files (Phase 1)

### Player Experience Goals

- **FPS Stability**: 90% → 99% (Phase 2)
- **Mobile Support**: 0% → 100% (Phase 3)
- **Accessibility**: 0% → 80% (Phase 3)

---

## 🚫 Out of Scope (Not Planned)

- Multiplayer/co-op mode
- Server-side leaderboards
- In-app purchases/monetization
- 3D graphics
- Story mode/campaign
- Voice acting
- Original music composition (procedural only)

---

## 💡 How to Use This Roadmap

### For Solo Development

1. Work through Phase 1 sequentially (critical items)
2. Pick Phase 2 items based on interest/time
3. Phase 3 is optional polish

### For Team Development

1. Assign Phase 1 tasks to different developers
2. Do daily standups to track progress
3. Code review all changes
4. Playtesting sessions after each phase

### For Contributors

1. Check "⬜" items that match your skills
2. Create issue before starting work
3. Follow Definition of Done
4. Submit PR with tests

---

## 📞 Support & Questions

**Architecture Questions**: See TECHNICAL_REVIEW.md  
**Game Mechanics**: See MECHANICS_REFERENCE.md  
**Current Features**: See CURRENT_STATE_DOCUMENTATION.md

---

## ✅ How to Mark Progress

Update task status:

- ⬜ Not started
- 🟦 In progress
- ✅ Complete
- ❌ Blocked
- ⏸️ Paused

Example:

```markdown
- [✅] Refactor App.tsx
- [🟦] Add tests
- [⬜] Complete enemies
```

---

**Last Review**: December 11, 2025  
**Next Review**: After Phase 1 completion  
**Estimated Full Completion**: 6-8 weeks (solo), 3-4 weeks (team of 3)

---

_This roadmap is a living document. Update it as priorities change, new issues are discovered, or tasks are completed._
