# 🎮 Mouse Defense

A polished, fast-paced survival shooter game built with React, TypeScript, and Canvas API. Fight off endless waves of enemies, upgrade your abilities, and see how long you can survive!

![Game Preview](https://img.shields.io/badge/Status-Playable-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)

## ✨ Features

### Core Gameplay

- **Smooth WASD Movement** - Responsive controls with acceleration/deceleration
- **Auto-Targeting System** - Automatically shoots at nearest enemy
- **5 Enemy Types** with unique behaviors:
  - 💥 Basic - Standard enemies
  - ⚡ Fast - Quick but fragile
  - 🛡️ Tank - Slow but tough
  - 🔄 Splitter - Splits into two when killed
  - 🎯 Shooter - Keeps distance from player

### Progression System

- **Upgrade Shop** - 8 different upgrade paths between rounds
- **Power-Ups** - Health, Speed, Damage, Fire Rate, Shield
- **Combo System** - Build multipliers for higher scores
- **High Score Tracking** - Persistent localStorage saves

### Game Feel & Polish

- **Procedural Audio** - Sound effects generated with Web Audio API
- **Particle Effects** - Explosions, trails, and visual feedback
- **Screen Shake** - Impact on hits and deaths
- **Invulnerability Frames** - Fair damage system
- **Smooth Animations** - 60 FPS canvas rendering

### Upgrades Available

1. ❤️ **Max Health** - Increase survivability
2. 💥 **Damage** - Hit harder
3. ⚡ **Fire Rate** - Shoot faster
4. 🏃 **Movement Speed** - Move quicker
5. 💚 **Health Regen** - Passive healing
6. 🎯 **Piercing Shots** - Bullets go through enemies
7. 🔥 **Multi-Shot** - Fire additional bullets
8. 💣 **Explosive Rounds** - Area damage on impact

## 🚀 Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (Vite requirement)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd VibeCodeMouseDefender

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🎮 How to Play

### Controls

- **WASD** or **Arrow Keys** - Move your character
- **Auto-Shoot** - Automatically targets nearest enemy
- **ESC** - Pause game

### Objective

Survive as many rounds as possible! Each round spawns more enemies. Between rounds, visit the shop to upgrade your abilities. Build combos for score multipliers and try to beat your high score!

### Tips

- Keep moving! Standing still is dangerous
- Prioritize Fast enemies - they're easy to kill but deadly in numbers
- Balance your upgrades - don't neglect health
- Collect power-ups when safe
- Use invulnerability frames wisely after taking damage
- Build combos by killing enemies quickly (3 second timer)

## 🏗️ Project Structure

```
src/
├── types/
│   └── game.ts          # TypeScript interfaces and types
├── utils/
│   ├── audio.ts         # Web Audio API sound system
│   ├── enemies.ts       # Enemy spawning and AI
│   ├── helpers.ts       # Math and utility functions
│   ├── particles.ts     # Particle effect system
│   └── upgrades.ts      # Shop and upgrade logic
├── App.tsx              # Main game component
├── App.css              # Game styling
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## 🎯 Game Design Philosophy

This game follows best practices from the BACKLOG and ROADMAP:

1. **Feedback Loop** - Every action has immediate visual/audio feedback
2. **Flow State** - Balanced difficulty curve that scales with player
3. **Risk/Reward** - Combo system encourages aggressive play
4. **Pattern Recognition** - Enemy behaviors are learnable
5. **Power Fantasy** - Players feel powerful with upgrades
6. **Clear Visual Language** - Distinct enemy colors and sizes
7. **Skill Expression** - Good players can push combos higher
8. **Meaningful Choices** - Shop upgrades create different builds
9. **Fair Challenge** - Deaths feel earned with iframes

## 🔧 Technical Highlights

- **Canvas Rendering** - Smooth 60 FPS with optimized draw calls
- **Object Pooling** - Efficient particle management
- **State Management** - React hooks with refs for game loop
- **TypeScript** - Full type safety throughout
- **Modular Architecture** - Separated concerns for maintainability
- **Performance Optimized** - Delta time, frame capping, efficient collision

## 📈 Future Enhancements

See [ROADMAP.md](./ROADMAP.md) and [BACKLOG.md](./BACKLOG.md) for planned features:

- Boss encounters every 5 rounds
- Additional weapon types
- Multiplayer co-op mode
- Daily challenges
- More enemy types
- Campaign mode
- Mobile support

## 🤝 Contributing

Contributions welcome! Please check the BACKLOG.md for prioritized features.

## 📝 License

MIT License - Feel free to use this project for learning or as a base for your own games!

## 🎨 Credits

Built with ❤️ using:

- React 19
- TypeScript
- Vite
- Canvas API
- Web Audio API

---

**Enjoy the game! Try to beat your high score! 🏆**
