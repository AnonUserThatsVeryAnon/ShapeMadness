# 🌊 Advanced Independent Zone System V2

## 🎉 Major Upgrade!

The zone system now features **independent side movement** where each edge can expand or shrink separately - creating asymmetric, unpredictable battle zones!

---

## 🆕 What's New

### Independent Side Control

Each of the 4 sides moves independently:

- **Left edge** - can move right (shrink) or left (expand beyond canvas)
- **Right edge** - can move left (shrink) or right (expand beyond canvas)
- **Top edge** - can move down (shrink) or up (expand beyond canvas)
- **Bottom edge** - can move up (shrink) or down (expand beyond canvas)

### Beyond the Canvas!

Zones can now extend **outside the visible canvas**:

- ✅ **Green bonus zones** - Safe areas beyond screen edges
- ❌ **Red danger zones** - Deadly areas within screen that aren't safe
- 🎯 **Mixed scenarios** - e.g., shrunk on left/right but expanded top/bottom!

---

## 🎮 How It Works

### Every 10 Rounds

Each side **randomly** either:

- **Shrinks** by 80-140 pixels (moves inward)
- **Expands** by 80-140 pixels (moves outward)

### Example Scenarios

#### Scenario 1: Vertical Squeeze

```
Left: Expands (-50 from canvas)
Right: Expands (+50 beyond canvas)
Top: SHRINKS (+100 inward)
Bottom: SHRINKS (-100 inward)
Result: Wide horizontal zone, narrow vertical - forces horizontal movement!
```

#### Scenario 2: Corner Trap

```
Left: SHRINKS (+120 inward)
Right: Expands (beyond canvas)
Top: SHRINKS (+90 inward)
Bottom: Expands (beyond canvas)
Result: Safe zone pushed to bottom-right corner + bonus areas outside!
```

#### Scenario 3: Full Expansion

```
All 4 sides expand beyond canvas borders
Result: Entire screen is safe + bonus zones on all sides!
Green arrows pointing outward everywhere
```

---

## 🎨 Visual System

### Red Danger Zones (Inside Canvas)

- **Red overlay** (20% opacity) on canvas areas that are NOT safe
- **Deadly** - Take 20 damage every 0.5s (40 HP/sec!)
- Always visible on screen where zone has shrunk

### Green Bonus Zones (Outside Canvas)

- **Green dashed borders** on canvas edges
- **Arrow indicators** (←→↑↓) pointing to bonus areas
- **Safe zones** that extend beyond what you can see
- You can move into these areas even though they're off-canvas!

### Zone Borders

- **Red pulsing border** - Normal state
- **Orange dashed border** - During transition
- Only shows where zone intersects with canvas

---

## 💀 Danger Mechanics

### Inside Canvas BUT Outside Zone

- Red tinted overlay
- 20 HP damage every 0.5 seconds
- Screen shake on hit
- 15 red particles
- Damage sound
- "⚠️ DANGER ZONE! ⚠️" warning (80% chance)

### Player Movement Beyond Canvas

- **Canvas bounds**: 0 to 1200 (width), 0 to 800 (height)
- **Zone can extend**: -200 to 1400 (width), -200 to 1000 (height)
- Player can move into negative/overflow positions when zone expands!
- Still collide with enemies and collect power-ups

---

## 📊 Technical Details

### Zone Boundaries

```typescript
interface PlayZone {
  left: number; // Can be negative!
  right: number; // Can exceed CANVAS_WIDTH!
  top: number; // Can be negative!
  bottom: number; // Can exceed CANVAS_HEIGHT!
}
```

### Size Limits

```
Minimum zone: 400x400 (center constrained)
Maximum expansion: ±200 pixels beyond canvas on any side
```

### Change Logic

```typescript
// Each side gets random 80-140 pixel change
changeAmount = 80 + random * 60

// Each side 50% shrink or 50% expand
For LEFT:   shrink → move right | expand → move left (negative OK)
For RIGHT:  shrink → move left  | expand → move right (>canvas OK)
For TOP:    shrink → move down  | expand → move up (negative OK)
For BOTTOM: shrink → move up    | expand → move down (>canvas OK)
```

---

## 🎯 Strategic Gameplay

### Asymmetric Zones Create Variety

- **Horizontal corridor**: Top/bottom shrunk, left/right expanded
- **Vertical corridor**: Left/right shrunk, top/bottom expanded
- **Corner traps**: Two adjacent sides shrunk
- **Diagonal zones**: Opposite corners shrunk/expanded

### Safe Spaces Beyond Canvas

- When left edge is -100, you can go 100 pixels off-screen left
- Enemies still spawn anywhere, so going beyond is risky!
- Creates "peek-a-boo" gameplay at screen edges

### Mixed Pressure

- Some rounds mostly shrink (3-4 sides) → High pressure
- Some rounds mostly expand (3-4 sides) → More breathing room
- Balanced rounds (2 shrink, 2 expand) → Directional pressure

---

## 🔧 Implementation Highlights

### Rendering Layers

1. **Background** - Dark space
2. **Red danger zones** - Canvas areas outside safe zone
3. **Green edge indicators** - Dashed lines where safe zone exceeds canvas
4. **Arrow indicators** - Show direction of bonus zones
5. **Main zone border** - Where safe zone intersects canvas
6. **Game entities** - Player, enemies, bullets, particles

### Collision Detection

```typescript
// Player is safe if within zone bounds (regardless of canvas)
isSafe =
  player.x >= zone.left + radius &&
  player.x <= zone.right - radius &&
  player.y >= zone.top + radius &&
  player.y <= zone.bottom - radius;
```

### Visual Indicators

- **Green ← arrow at x=20**: Left bonus zone active
- **Green → arrow at x=CANVAS_WIDTH-35**: Right bonus zone active
- **Green ↑ arrow at y=30**: Top bonus zone active
- **Green ↓ arrow at y=CANVAS_HEIGHT-10**: Bottom bonus zone active

---

## 🎨 Notification System

### Messages

- **"⚠️ ZONE SHRINKING! ⚠️"** (red) - More sides shrank than expanded
- **"✨ ZONE EXPANDING! ✨"** (green) - More sides expanded than shrank
- **"🔄 ZONE SHIFTING! 🔄"** (orange) - Equal shrink/expand (2 each)

---

## 🚀 Future Ideas

Possible enhancements:

- **Wave patterns**: Zones that shift in sequence (left→right→left)
- **Pulsing zones**: Continuous slow expansion/contraction
- **Multiple zones**: Safe islands instead of one contiguous area
- **Zone abilities**: Power-up that temporarily expands one side
- **Predictive indicator**: Show next zone change 5 seconds early
- **Zone combos**: Bonus points for kills near danger zones

---

## 🎮 Pro Tips

### Positioning

- **Center play**: Safest when multiple sides might shrink
- **Edge play**: Risky but gives access to bonus zones
- **Corner play**: Maximum risk, but might catch enemies off-guard

### Round 10, 20, 30...

- After first change (round 10): Zone is asymmetric
- After multiple changes: Zone shape is highly unpredictable
- Late game: Zone could be tiny corner or massive with bonus areas!

### Expanded Zones

- Green arrows mean MORE space to dodge
- Use bonus zones to kite large enemy groups
- Still visible to enemies, so don't get comfortable!

---

## 🐛 Edge Cases Handled

✅ Zone never smaller than 400x400 (enforced in shrink logic)
✅ Zone never more than ±200 beyond canvas edges
✅ Red overlays only drawn within canvas bounds
✅ Green indicators only shown when zone actually exceeds edge
✅ Border rendering handles partial visibility correctly
✅ Player damage only when outside zone (not outside canvas)
✅ Smooth 3-second eased transitions for all sides
✅ Zone resets to canvas size on new game

---

**The zone system is now INSANELY dynamic with independent sides that can create wild asymmetric battlefields! 🔥🎮**

## Examples to Test

### Round 10

Might create a tall narrow zone (left/right shrunk)

### Round 20

Could expand top but shrink bottom → zone pushed upward with bonus space above

### Round 30

Maybe full expansion → entire screen safe + green arrows everywhere!

### Round 40+

Combination of previous changes → completely unpredictable shape!

---

**Every round feels different now! 🌟**
