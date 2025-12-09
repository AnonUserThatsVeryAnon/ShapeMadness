# 🌐 Dynamic Zone System V2 - Fullscreen & Asymmetric Zones

## 🎉 Major Update - Complete Overhaul!

The zone system has been **completely redesigned** to use fullscreen canvas and support **asymmetric expansion/contraction**!

---

## 🖥️ Fullscreen Canvas

### What Changed

- **Before**: Fixed 1200x800 canvas
- **After**: Dynamic `window.innerWidth` x `window.innerHeight` - uses your **entire screen**!

### Benefits

- No wasted screen space
- Better immersion
- More room to maneuver
- Automatic sizing for any monitor

---

## 🎮 New Zone Progression

### **Rounds 1-9: Expansion Phase** 🌱

The game starts with a **tiny 400x400 zone** in the center and gradually expands!

- **Round 1**: 400x400 (very tight!)
- **Round 2-9**: Grows 20-35% each round
- **Round 10**: Reaches full screen size

**Strategy**: Early rounds are intense claustrophobic battles. Master dodging in tight spaces!

### **Round 10+: Chaos Phase** 🌪️

After reaching full screen, zones become **asymmetric** and unpredictable!

#### Asymmetric Changes

- **Width and height change INDEPENDENTLY**
- Can shrink horizontally while expanding vertically
- Can expand in both directions
- Random 50/50 chance for each axis

#### Example Scenarios

```
Round 10: Width shrinks 25%, height stays same
         → Tall narrow battlefield

Round 20: Width expands 40%, height shrinks 20%
         → Wide but short arena

Round 30: Both expand 30%
         → Massive open battlefield
```

---

## 🎨 Visual Zones Explained

### 🔴 **RED ZONES** (Deadly)

**What**: Areas **inside the canvas** but **outside the play zone**
**Effect**: **40 HP/second damage** - DEADLY!
**Visual**: Red tinted overlay (20% opacity)
**Border**: Red pulsing border

### 🟢 **GREEN ZONES** (Safe Expansion)

**What**: Play zone extends **beyond the visible canvas**
**Effect**: **SAFE TO PLAY** - no damage!
**Visual**: Green tinted edges with arrows
**Border**: Green border when zone is expanded
**Text**: "↑ SAFE ZONE ↑" indicators

### 🟠 **ORANGE ZONES** (Transitioning)

**What**: Zone is currently changing size
**Border**: Orange dashed line
**Duration**: 3 seconds smooth transition

---

## 🎯 Zone Colors & Meanings

| Border Color  | Meaning                             |
| ------------- | ----------------------------------- |
| 🔴 **Red**    | Zone is contracted - danger outside |
| 🟢 **Green**  | Zone is expanded - bonus safe space |
| 🟠 **Orange** | Zone is mixed OR transitioning      |

---

## 💀 Damage System

### Red Zone Damage (OLD STYLE)

- Player in canvas BUT outside zone
- **20 HP per tick** (every 0.5s)
- **40 HP per second** total
- Screen shake + red particles + warning text
- Only ~2.5 seconds to survive with 100 HP

### Green Zone Safety (NEW!)

- Player can venture into green expanded areas
- **No damage** - it's bonus safe space!
- Still see enemies spawning
- Can use tactical retreats

---

## 📊 Technical Implementation

### New Constants

```typescript
const CANVAS_WIDTH = window.innerWidth; // Dynamic!
const CANVAS_HEIGHT = window.innerHeight; // Dynamic!
const INITIAL_ZONE_SIZE = 400; // Start small
const MAX_ZONE_EXPANSION = 2.5; // Can grow 2.5x screen size
const ZONE_DAMAGE = 20; // Per tick (0.5s)
```

### Zone Interface (Updated)

```typescript
interface PlayZone {
  x;
  y;
  width;
  height; // Current position/size
  targetWidth;
  targetHeight; // Where it's moving to
  targetX;
  targetY; // Position target
  isTransitioning; // Animation state
  transitionProgress; // 0-1 completion
  cameraX;
  cameraY; // Camera offset (future use)
}
```

### Zone Change Logic

#### Phase 1 (Rounds 1-9): Guaranteed Expansion

```typescript
expandFactor = 1.2 to 1.35 (20-35% growth)
Cap at full screen size
Always centered
```

#### Phase 2 (Round 10+): Asymmetric Chaos

```typescript
Each axis (width/height):
  - 50% chance to change
  - If changing: 50% shrink, 50% expand

Shrink: 0.7-0.85x (15-30% reduction)
        Min 300px to stay playable

Expand: 1.2-1.5x (20-50% growth!)
        Max 2.5x screen size
        Can extend beyond visible canvas
```

---

## 🎮 Gameplay Impact

### Early Game (Rounds 1-9)

- **Small zones force close combat**
- Learn enemy patterns in confined space
- Build upgrades for later rounds
- Gradually get more breathing room

### Mid Game (Rounds 10-20)

- **Asymmetric zones create variety**
- Adapt strategy to zone shape
- Use expanded areas strategically
- Avoid red zones at all costs

### Late Game (Round 20+)

- **Massive zones or tiny killboxes**
- Zone can expand WAY beyond screen
- Green safe zones offer escape routes
- Ultimate test of adaptation

---

## 🎨 Visual Feedback

### Red Zone Entry

- ⚡ Screen shake (intensity 8)
- 💥 15 red particles burst
- 🔊 Damage sound effect
- ⚠️ "DANGER ZONE!" text (80% frequency)

### Zone Change Messages

| Message            | Meaning                  |
| ------------------ | ------------------------ |
| ✨ ZONE EXPANDING! | Both dimensions growing  |
| ⚠️ ZONE SHRINKING! | Both dimensions reducing |
| 🔄 ZONE SHIFTING!  | One grows, one shrinks   |
| ↔️ WIDER ZONE!     | Only width expanding     |
| ↕️ TALLER ZONE!    | Only height expanding    |
| ⚡ NARROWER ZONE!  | Only width shrinking     |
| ⚡ SHORTER ZONE!   | Only height shrinking    |

---

## 🎯 Strategic Depth

### Width Changes

- **Narrow zones**: Harder to dodge horizontally
- **Wide zones**: More kiting space, easier to create distance

### Height Changes

- **Short zones**: Limited vertical movement
- **Tall zones**: More room to circle-strafe

### Combined Effects

- **Narrow + Tall**: Vertical dodge focus
- **Wide + Short**: Horizontal movement key
- **Both Small**: Maximum intensity
- **Both Large**: Room to breathe and plan

---

## 🚀 CSS Updates

### Fullscreen Implementation

```css
.game-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
```

---

## 🐛 Edge Cases Handled

✅ **Minimum sizes**: Won't shrink below 300px (playable)
✅ **Maximum expansion**: Caps at 2.5x screen size
✅ **Damage zones**: Only applies in red zones, not green
✅ **Border rendering**: Always shows visible portion
✅ **Zone centering**: Properly centered on canvas
✅ **Transition smoothing**: 3-second eased animations
✅ **Player spawning**: Always starts in safe center
✅ **Mixed zones**: Handles expand+shrink simultaneously

---

## 💡 Pro Tips

### For Players

1. **First 9 rounds**: Focus on surviving tight spaces and buying upgrades
2. **Green zones**: Use them! They're safe bonus territory
3. **Red zones**: Death trap - avoid at all costs
4. **Asymmetric shifts**: Adapt movement patterns to zone shape
5. **Expanded zones**: Enemies spawn everywhere, but you have more room

### Strategy Changes

- **Shrinking**: Fight close, aggressive gameplay
- **Expanding**: Kite enemies, use space wisely
- **Mixed**: Unpredictable, stay alert!

---

## 🎮 Controls Reminder

- **WASD/Arrows**: Move
- **Mouse**: Aim (auto-fire)
- **ESC**: Pause
- **Space**: Shop (between rounds)

---

## 📈 Balance Notes

### Why Start Small?

- **Learning curve**: Master basics in controlled space
- **Progressive difficulty**: Gradually increase complexity
- **Build strategy**: Time to invest in upgrades
- **Dramatic growth**: Satisfying to feel the world expand

### Why Asymmetric?

- **Variety**: Every 10 rounds feels different
- **Adaptation**: Tests player flexibility
- **Replayability**: No two games feel identical
- **Strategic depth**: Different builds work better in different shapes

### Why Green Zones?

- **Risk/Reward**: Venture far for safety
- **Counter-intuitive**: "Bigger = safer" breaks expectations
- **Visual clarity**: Green = good, red = bad
- **Tactical options**: More ways to approach encounters

---

## 🔮 Future Enhancements

Possible additions:

- **Camera follow**: Actually move viewport when in expanded zones
- **Minimap**: Show full zone when expanded
- **Zone shapes**: Circles, ovals, irregular polygons
- **Moving zones**: Shift location, not just size
- **Multiple zones**: Safe islands mechanic
- **Zone telegraphing**: Show next zone before transition
- **Zone upgrades**: Shop items to reduce damage or expand zone

---

## 🎊 Summary

**This is a COMPLETE GAME CHANGER!**

✨ **Fullscreen canvas** - uses entire monitor
🌱 **Progressive expansion** - starts tiny, grows to full screen
🎲 **Asymmetric zones** - width and height independent
🟢 **Green safe zones** - expand beyond canvas = safe
🔴 **Red danger zones** - contract within canvas = deadly
🎯 **Strategic variety** - every game feels different!

**The battlefield is alive and constantly changing. Adapt or die!** 🔥

---

**Ready to experience the chaos? Run `npm run dev` and survive the expanding/shrinking madness!** 🚀
