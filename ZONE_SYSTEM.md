# 🗺️ Dynamic Play Zone System

## ✨ Feature Overview

Every 10 rounds, the playable area **dynamically shrinks or expands**, creating a battle royale-style mechanic that keeps gameplay fresh and challenging!

---

## 🎮 How It Works

### Trigger Timing

- **Activates**: Every 10 rounds (round 10, 20, 30, etc.)
- **Automatic**: Happens at the start of each milestone round

### Zone Changes

- **50% chance to SHRINK** 🔴
  - Reduces zone by 15-25%
  - Cannot go below **400x400 minimum**
  - Shows warning: "⚠️ ZONE SHRINKING! ⚠️"
- **50% chance to EXPAND** 🟢
  - Increases zone by 15-25%
  - Cannot exceed **original canvas size**
  - Shows message: "✨ ZONE EXPANDING! ✨"

### Transition

- **Duration**: 3 seconds smooth animation
- **Easing**: EaseInOutQuad for professional feel
- **Border**: Animated dashed line during transition
- **Warning**: Border pulses in orange while changing

---

## 💀 Danger Zone Mechanics

### Outside Zone = DANGER

- **Red tinted overlay** marks deadly areas
- **Continuous damage**: 5 HP every 0.5 seconds
- **Warning text**: "OUT OF ZONE!" appears randomly
- **Respects iframes**: Won't damage if invulnerable

### Visual Indicators

- **Red overlay** (15% opacity) outside safe zone
- **Pulsing red border** around play area
- **Orange dashed border** during transitions

---

## 🎯 Strategic Impact

### Round 10

Zone change forces adaptation - maybe shrinks to 680x680

### Round 20

Another change - could expand back to 880x880

### Round 30+

Continues alternating, creating unpredictable battlefield

---

## 📊 Technical Details

### Size Limits

```typescript
MIN_ZONE_SIZE = 400px      // Half of original
MAX_ZONE_SIZE = 800px      // Original canvas size
```

### Damage System

```typescript
ZONE_DAMAGE = 5 HP         // Per tick
Tick Rate = 0.5 seconds    // 10 damage per second
```

### Transition

```typescript
DURATION = 3 seconds
EASING = EaseInOutQuad
CENTER = Always centered on canvas
```

---

## 🎨 Visual Design

### Safe Zone

- **Clear area**: Normal dark background
- **Border**: Pulsing red line (opacity 0.5-1.0)

### Danger Zone

- **Overlay**: Red tint (rgba(255, 0, 0, 0.15))
- **Particles**: Red damage particles when hit

### Transition State

- **Border**: Orange dashed line
- **Animation**: Smooth size interpolation
- **Feedback**: Large floating text announcement

---

## 🔧 Implementation Details

### New Types (`types/game.ts`)

```typescript
interface PlayZone {
  x;
  y;
  width;
  height; // Current zone
  targetWidth;
  targetHeight; // Goal size
  targetX;
  targetY; // Goal position
  isTransitioning; // Animation flag
  transitionProgress; // 0-1 completion
}
```

### Zone Change Logic

1. Check if round % 10 === 0
2. Random 50/50 shrink or expand
3. Calculate new size within limits
4. Center the zone on canvas
5. Start transition animation
6. Show notification text

### Damage Application

1. Check if player outside zone bounds
2. Respect player radius for accurate detection
3. Apply damage every 0.5 seconds
4. Show warning text occasionally (30% chance)
5. Only damage if not invulnerable

---

## 🎮 Gameplay Tips

### For Players

- **Watch the border** - Know your safe area
- **Plan during transitions** - 3 seconds to reposition
- **Use iframes wisely** - Good time to cross danger zones
- **Enemy spawns** - Still use full canvas, zone only affects player

### Strategy Changes

- **Shrinking zones**: Forces closer combat, more intense
- **Expanding zones**: More room to kite and dodge
- **Late game**: Multiple zone changes create variety

---

## 🚀 Future Enhancements

Possible additions:

- **Multiple zones**: Safe islands instead of one big area
- **Moving zones**: Shift location, not just size
- **Zone upgrades**: Shop item to reduce damage
- **Visual effects**: More particles at zone edges
- **Audio**: Warning sounds before transitions
- **Prediction**: Show next zone location

---

## 📈 Balance Notes

### Round 10 Example

```
Original: 1200x800
Shrink 20%: 960x640 (centered at 120, 80)
Damage: 5 HP per 0.5s = 10 HP/second outside
```

### Round 20 Example

```
Previous: 960x640
Expand 20%: 1152x768 (centered at 24, 16)
More breathing room for intense battles
```

---

## 🐛 Edge Cases Handled

✅ **Minimum size**: Cannot shrink below 400px
✅ **Maximum size**: Cannot expand beyond canvas
✅ **Center alignment**: Always centered for fairness
✅ **Player spawning**: Always in safe zone center
✅ **Enemy spawning**: Uses full canvas (they're not affected)
✅ **Invulnerability**: Zone damage respects iframes
✅ **Transition canceling**: Cannot trigger new change during animation

---

## 🎯 Testing Checklist

- [x] Round 10 triggers zone change
- [x] Visual red overlay appears
- [x] Border pulses correctly
- [x] Player takes damage outside zone
- [x] Transition animation smooth (3s)
- [x] Notification text displays
- [x] Size limits respected
- [x] Centered on canvas
- [x] No errors in console

---

**Zone system fully implemented and tested! Adds exciting battle royale-style pressure to late game! 🎮🔥**
