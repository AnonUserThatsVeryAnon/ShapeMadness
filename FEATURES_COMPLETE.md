# 🎮 Mouse Defense - Complete Feature List

## 🚀 Latest Updates (V2 - Dynamic Zones)

### ✨ **FULLSCREEN GAMEPLAY**

- Canvas now uses **entire screen** (dynamically sized)
- No more wasted space - maximum immersion
- Removed borders and fixed sizing

### 🌍 **PROGRESSIVE ZONE SYSTEM**

**Rounds 1-9: Expansion Phase**

- Starts at tiny 400x400 zone
- Grows 20-35% each round
- Reaches full screen by round 10

**Round 10+: Asymmetric Chaos**

- Width and height change **independently**
- Can shrink AND expand at same time
- Creates unique battlefield shapes every 10 rounds

### 🎨 **Tri-Color Zone System**

- 🔴 **RED ZONES**: Inside canvas but outside play zone = DEADLY (40 HP/s)
- 🟢 **GREEN ZONES**: Play zone extended beyond canvas = SAFE bonus space!
- 🟠 **ORANGE ZONES**: Transitioning between states

### 🎯 **Smart Damage System**

- Only damages in RED zones (contracted areas)
- GREEN zones are safe expansion areas
- Enhanced feedback: screen shake, particles, sound, text

---

## 🎮 Core Features

### Player Mechanics

- ✅ WASD + Arrow key movement
- ✅ Mouse-based auto-aiming
- ✅ Invulnerability frames (1 second after hit)
- ✅ Health regeneration (upgrade)
- ✅ Speed, damage, fire rate progression

### Enemy System

- ✅ **5 Enemy Types**:

  - Basic: Standard balanced enemy
  - Fast: Quick and aggressive
  - Tank: High HP, slow
  - Splitter: Breaks into 2 smaller enemies
  - Shooter: Ranged attacks

- ✅ Smart AI pathfinding
- ✅ Difficulty scaling per round
- ✅ Enemy spawning from canvas edges

### Combat

- ✅ Auto-targeting bullet system
- ✅ Homing projectiles
- ✅ Combo system (up to 5x multiplier)
- ✅ Pierce bullets (upgrade)
- ✅ Multi-shot (upgrade)
- ✅ Explosive rounds (upgrade)

### Power-Up System

- ✅ **5 Power-Up Types**:

  - Health: Restore HP
  - Speed: Temporary speed boost
  - Damage: Increased damage
  - Fire Rate: Faster shooting
  - Shield: Temporary invincibility

- ✅ Random drops from enemies
- ✅ Timed duration effects
- ✅ Visual indicators

### Shop & Upgrades

- ✅ **8 Upgrade Paths**:

  1. Max Health (6 levels)
  2. Damage (5 levels)
  3. Fire Rate (5 levels)
  4. Movement Speed (5 levels)
  5. Health Regen (3 levels)
  6. Bullet Pierce (3 levels)
  7. Multi-Shot (3 levels)
  8. Explosive Rounds (3 levels)

- ✅ Between-round shop system
- ✅ Progressive cost scaling
- ✅ Visual progress bars
- ✅ 4-column responsive grid layout

### Hazards

- ✅ **Laser Beams** (Round 5+):

  - 1.5 second warning (yellow)
  - 0.5 second active (red)
  - Spawns from edges across map
  - Always on-screen (never outside canvas)
  - Instant kill if hit

- ✅ **Dynamic Play Zones**:
  - Every 10 rounds changes
  - Asymmetric expansion/contraction
  - Visual danger/safe indicators

### Visual Effects

- ✅ Particle system (explosions, hits, deaths)
- ✅ Floating damage numbers
- ✅ Kill notifications with money display
- ✅ Screen shake on impacts
- ✅ Glowing enemy effects
- ✅ Pulsing zone borders
- ✅ Smooth transition animations

### Audio

- ✅ **Procedural Web Audio**:
  - Shoot sound
  - Hit/damage sound
  - Enemy death sound
  - Power-up pickup
  - Player damage
  - Purchase confirmation
  - All generated, no files needed!

### Progression

- ✅ Round-based system
- ✅ Increasing enemy counts
- ✅ Stronger enemies per round
- ✅ Money earning system
- ✅ High score persistence (localStorage)
- ✅ Combo multipliers

### UI/UX

- ✅ Main menu
- ✅ Pause system (ESC)
- ✅ Game over screen
- ✅ Stats display (HP, money, round, combo)
- ✅ High score tracking
- ✅ Smooth state transitions
- ✅ Responsive button layouts

---

## 📊 Game Balance

### Starting Stats

- Health: 100 HP
- Damage: 25
- Fire Rate: 250ms
- Speed: 4 units/frame

### Zone Mechanics

- Initial: 400x400
- Min Size: 300px (per dimension)
- Max Expansion: 2.5x screen size
- Transition Time: 3 seconds
- Red Zone Damage: 40 HP/second

### Laser Mechanics

- Warning: 1.5 seconds (yellow)
- Active: 0.5 seconds (red)
- Width: 40px
- Damage: Instant death
- Spawn Rate: 30% chance per second (Round 5+)

### Combo System

- Window: 3 seconds
- Max Multiplier: 5x
- Affects: Money earned

---

## 🎯 Unique Selling Points

1. **Progressive Battlefield**: Map literally grows as you play
2. **Asymmetric Zones**: Width/height change independently for unique shapes
3. **Inverted Safety**: Expanded zones (green) are SAFE, contracted (red) are deadly
4. **No Sprite Assets**: Procedural graphics and audio only
5. **Fully Typed**: Complete TypeScript implementation
6. **Local Persistence**: High scores saved automatically
7. **Responsive**: Works on any screen size
8. **Zero Loading**: Instant start, no assets to load

---

## 🛠️ Tech Stack

- **React 19.2.0**: UI framework
- **TypeScript 5.9.3**: Type safety
- **Vite 7.2.4**: Build system
- **Canvas API**: Rendering
- **Web Audio API**: Procedural sounds
- **localStorage**: Data persistence

---

## 📁 Project Structure

```
src/
├── App.tsx                 # Main game loop (1500+ lines)
├── App.css                 # Styles with responsive grid
├── types/
│   └── game.ts            # All interfaces & types
├── utils/
│   ├── audio.ts           # Procedural sound system
│   ├── enemies.ts         # Enemy configs & AI
│   ├── helpers.ts         # Math & utility functions
│   ├── particles.ts       # Particle effects
│   └── upgrades.ts        # Shop & upgrade logic
└── assets/                # (Minimal - just favicon)
```

---

## 🎮 How to Play

### Controls

- **WASD / Arrow Keys**: Move player
- **Mouse**: Aim (auto-fires)
- **ESC**: Pause game
- **Space**: Open shop (between rounds)

### Objective

- Survive as many rounds as possible
- Kill enemies to earn money
- Buy upgrades in shop between rounds
- Avoid red zones and lasers
- Use green expanded zones tactically
- Build combos for bonus money
- Beat your high score!

### Tips

1. **Early rounds**: Focus on upgrades, learn in tight space
2. **Shop priority**: Health → Damage → Fire Rate
3. **Combo timing**: Kill quickly to maintain multiplier
4. **Red zones**: Death sentence - stay in play area!
5. **Green zones**: Safe retreat when overwhelmed
6. **Lasers**: Yellow warning = move, red = too late
7. **Splitters**: Kill fast or face 2 enemies
8. **Shooters**: Keep moving to dodge projectiles

---

## 🔮 Future Roadmap (From BACKLOG.md)

### Potential Additions

- Boss encounters every 10 rounds
- Multiple weapon types (laser, shotgun, etc.)
- Active abilities (dash, shield, time slow)
- More enemy varieties
- Achievement system
- Mobile touch controls
- Online leaderboards
- Multiplayer co-op
- Daily challenges

---

## 📈 Performance

- **60 FPS** target framerate
- Efficient particle pooling
- Canvas-based rendering (GPU accelerated)
- Minimal state updates
- No network calls (offline-first)
- Instant load times

---

## 🎉 What Makes This Special

This game demonstrates:

- **Complete TypeScript architecture**
- **Zero external assets** (all procedural)
- **Advanced Canvas techniques**
- **Dynamic battlefield mechanics**
- **Satisfying progression loops**
- **Professional code organization**
- **Modern React patterns**
- **Responsive fullscreen design**

**The zone system alone is a unique mechanic not seen in most survival shooters!**

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

**Game will open in fullscreen - prepare for intense action!** 🎮🔥

---

**Last Updated**: December 2025
**Version**: 2.0 (Dynamic Zones Update)
**Status**: ✅ Feature Complete & Polished
