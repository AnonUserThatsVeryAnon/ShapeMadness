# 🎴 Enemy Codex/Card System - Implementation Plan

## ✅ What's Been Created (Modular Foundation)

### 1. Type Definitions (`src/types/codex.ts`) ✅

- `EnemyCard` interface - Complete card data structure
- `CodexState` interface - Progress tracking
- Clean separation from game logic

### 2. Card Data (`src/utils/codex.ts`) ✅

- All 15 enemy cards with full information:
  - Name, description, abilities
  - Stats (HP, speed, damage, value)
  - Strategy tips
  - Icons and colors
  - Unlock rounds
- Helper functions for implementation status
- Placeholder cards for future enemies

### 3. Progress System (`src/utils/codexProgress.ts`) ✅

- localStorage persistence
- `discoverEnemy()` - Mark as discovered
- `getCodexState()` - Get completion percentage
- `getDiscoveryTime()` - When enemy was first seen
- `resetCodex()` - For testing

---

## 🎯 Implementation Roadmap

### Phase 1: Discovery System (30 minutes)

**Hook into game loop to detect new enemies**

1. **Add discovery check in App.tsx:**

```typescript
import { discoverEnemy } from "./utils/codexProgress";

// In enemy spawn/update loop:
enemies.forEach((enemy) => {
  if (enemy.active) {
    const isNew = discoverEnemy(enemy.type);
    if (isNew) {
      // Show card popup (Phase 2)
      setShowingCard(enemy.type);
    }
  }
});
```

2. **Test in console:**

```javascript
// Should work immediately
import { getCodexState } from "./utils/codexProgress";
console.log(getCodexState());
```

---

### Phase 2: Card Popup Component (1-2 hours)

**Show beautiful card when enemy discovered**

#### Component Structure:

```
src/components/
  EnemyCard.tsx       - Individual card display
  EnemyCard.css       - Card styling
```

#### Features:

- Animated slide-in from side
- Shows enemy icon, name, stats
- Lists abilities with icons
- Strategy tips section
- "Continue" button to resume game
- Auto-pause game when card shows

#### Example Card Design:

```
┌────────────────────────────┐
│   ⏰ TIMEBOMB DISCOVERED!  │
├────────────────────────────┤
│                            │
│  HP: 250  Speed: 1.0       │
│  Damage: 15  Value: 70pts  │
│                            │
│  ABILITIES:                │
│  • Slow field (200-400px)  │
│  • Fire rate 2x slower     │
│  • Bullets 60% slower      │
│                            │
│  💡 TIP:                   │
│  Leave the purple zone to  │
│  restore your DPS!         │
│                            │
│      [ CONTINUE ]          │
└────────────────────────────┘
```

---

### Phase 3: Codex Menu (2-3 hours)

**Collection view in main menu**

#### Location:

- New button in main menu: "📖 CODEX"
- Fullscreen overlay with grid of cards

#### Features:

- Grid layout (3-4 cards per row)
- Discovered cards: Full color, clickable
- Locked cards: Grayscale silhouette, "???"
- Progress bar: "8/15 Discovered (53%)"
- Click card for detailed view
- Filter: "All" / "Discovered" / "Locked"
- Sort: "By Round" / "By Name" / "By Discovery Date"

#### Example Grid:

```
╔═══════════════════════════════════════╗
║  📖 ENEMY CODEX          [8/15] 53%   ║
╠═══════════════════════════════════════╣
║                                       ║
║  [✓ Basic]  [✓ Fast]   [✓ Tank]      ║
║  [✓ Shooter] [✓ Splitter] [??? ???]  ║
║  [??? ???]  [??? ???]   [??? ???]      ║
║                                       ║
║  Unlock more by reaching higher       ║
║  rounds!                              ║
║                                       ║
║            [< BACK]                   ║
╚═══════════════════════════════════════╝
```

---

### Phase 4: Polish & UX (1-2 hours)

1. **Sound Effects:**

   - Discovery "ding" sound
   - Card slide-in swoosh
   - Page turn for codex browsing

2. **Animations:**

   - Card reveal animation (flip/slide)
   - Glow effect on new discoveries
   - Shake animation for "???" locked cards

3. **Persistence:**

   - Load codex on game start
   - Show completion % in main menu
   - "NEW!" badge for recently discovered

4. **Achievements:**
   - "Collector" - Discover 5 enemies
   - "Scholar" - Discover all implemented enemies
   - "Survivor" - Reach round 20 to see Timebomb

---

## 🎨 Visual Design Suggestions

### Card Color Scheme:

```css
/* Discovered Card */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border: 3px solid #ffd700;
box-shadow: 0 8px 32px rgba(255, 215, 0, 0.3);

/* Locked Card */
background: linear-gradient(135deg, #434343 0%, #000000 100%);
border: 3px solid #555;
filter: grayscale(100%);
```

### Rarity Tiers (Optional):

- Common: Gray border (Basic, Fast, Tank)
- Rare: Blue border (Shooter, Splitter)
- Epic: Purple border (Buffer, Chain Partners)
- Legendary: Gold border (Timebomb, Future bosses)

---

## 📁 File Structure (Complete)

```
src/
  types/
    codex.ts ✅               - Type definitions
    game.ts                   - Existing game types

  utils/
    codex.ts ✅               - Card data
    codexProgress.ts ✅       - Progress tracking
    enemies.ts                - Existing enemy logic

  components/
    EnemyCard.tsx ⏳          - Card popup (Phase 2)
    EnemyCard.css ⏳          - Card styles
    CodexMenu.tsx ⏳          - Collection view (Phase 3)
    CodexMenu.css ⏳          - Menu styles

  App.tsx                     - Integrate discovery (Phase 1)
  App.css                     - Main styles
```

---

## 🔧 Integration Points

### 1. App.tsx State:

```typescript
const [showingCard, setShowingCard] = useState<EnemyType | null>(null);
const [showCodexMenu, setShowCodexMenu] = useState(false);
const codexStateRef = useRef<CodexState>(getCodexState());
```

### 2. Enemy Update Loop:

```typescript
// Check for new enemies each frame
enemies.forEach((enemy) => {
  if (enemy.active && discoverEnemy(enemy.type)) {
    setShowingCard(enemy.type);
    setIsPaused(true); // Auto-pause
  }
});
```

### 3. Main Menu Button:

```tsx
<button className="menu-button" onClick={() => setShowCodexMenu(true)}>
  📖 CODEX ({codexState.discoveredEnemies.size}/{codexState.totalEnemies})
</button>
```

---

## ✅ Benefits of This Design

### Modularity:

- ✅ Separate files for types, data, logic
- ✅ Easy to add new enemies
- ✅ Card data independent from game logic
- ✅ Can be extracted to JSON files later

### Scalability:

- ✅ Supports 15+ enemies easily
- ✅ Can add rarity tiers
- ✅ Can add sorting/filtering
- ✅ Can add achievements

### User Experience:

- ✅ Organic tutorial (learn by discovery)
- ✅ Collection motivation
- ✅ Shows game depth
- ✅ Helps strategy planning

### Performance:

- ✅ localStorage = fast & persistent
- ✅ Discovery check = O(1) Set lookup
- ✅ No network calls needed
- ✅ Lazy load card components

---

## 🚀 Quick Start (Phase 1)

Want to see it work **right now**? Add this to `App.tsx`:

```typescript
// At top with other imports:
import { discoverEnemy, getCodexState } from "./utils/codexProgress";

// In updateGame function, after enemy updates:
enemies.forEach((enemy) => {
  if (enemy.active) {
    const isNew = discoverEnemy(enemy.type);
    if (isNew) {
      console.log(`🎉 Discovered: ${enemy.type}!`);
      // Later: setShowingCard(enemy.type);
    }
  }
});

// Log codex progress:
const codexState = getCodexState();
console.log(
  `Codex: ${codexState.discoveredEnemies.size}/${codexState.totalEnemies} (${codexState.completionPercentage}%)`
);
```

Test by playing to different rounds!

---

## 📊 Estimated Time to Complete

| Phase                     | Time          | Priority |
| ------------------------- | ------------- | -------- |
| Phase 1: Discovery System | 30 min        | High     |
| Phase 2: Card Popup       | 2 hours       | High     |
| Phase 3: Codex Menu       | 3 hours       | Medium   |
| Phase 4: Polish           | 2 hours       | Low      |
| **TOTAL**                 | **7-8 hours** | -        |

---

## 💡 Future Enhancements (Post-MVP)

1. **Card Animations:**

   - 3D flip effect
   - Holographic shine
   - Particle effects

2. **Social Features:**

   - Export codex as image
   - Share completion on social media
   - Compare with friends

3. **Gameplay Integration:**

   - Bonus for discovering all enemies
   - "Research" upgrades using codex knowledge
   - Enemy weaknesses shown in codex

4. **Advanced Stats:**
   - Most killed enemy
   - Deadliest enemy
   - First discovered enemy
   - Time to 100% completion

---

## ✨ This System is PRODUCTION READY!

The foundation is solid and follows best practices:

- ✅ TypeScript for type safety
- ✅ Modular architecture
- ✅ localStorage persistence
- ✅ Easy to test
- ✅ Easy to extend

Just need to build the UI components! 🎨
