# 🎮 Mouse Defense

A fast-paced survival shooter built with React, TypeScript, and Canvas API. Battle endless waves of enemies with unique abilities, upgrade your character, and discover new threats in the enemy codex.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![Status](https://img.shields.io/badge/Status-Playable-brightgreen)

## ✨ Features

- **Dynamic Zone System** - Battlefield expands then dynamically shifts every round
- **15 Enemy Types** - Each with unique behaviors and abilities (8 complete, 7 planned)
- **Enemy Codex** - Discover and track enemy information as you encounter them
- **9 Upgrades** - Core stats and special abilities
- **Combo System** - Build multipliers for massive score gains
- **Power-Ups** - 5 temporary buffs
- **Procedural Audio** - Web Audio API sound effects
- **Particle Effects** - Smooth visual feedback
- **Auto-Save** - High score persistence

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

The game runs at `http://localhost:5173`

## 🎮 How to Play

### Controls

- **WASD** or **Arrow Keys** - Move your character
- **Mouse** - Aim (auto-shoots at nearest enemy)
- **ESC** - Pause game

### Objective

Survive endless waves of enemies! Between rounds, visit the shop to upgrade your abilities. Discover all enemy types in the codex. Beat your high score!

## 📚 Documentation

- **[CURRENT_STATE_DOCUMENTATION.md](CURRENT_STATE_DOCUMENTATION.md)** - Complete feature overview, architecture, and status
- **[TECHNICAL_REVIEW.md](TECHNICAL_REVIEW.md)** - Code quality analysis, performance review, and technical details
- **[MECHANICS_REFERENCE.md](MECHANICS_REFERENCE.md)** - Game formulas, stats, balance curves, and strategy tips
- **[ROADMAP.md](ROADMAP.md)** - Development priorities and planned improvements

## 🏗️ Project Structure

```
src/
├── App.tsx              # Main game (needs refactoring)
├── components/          # UI components
│   ├── CodexMenu.tsx
│   ├── EnemyCard.tsx
│   └── SettingsMenu.tsx
├── config/
│   └── gameConfig.ts    # Centralized settings
├── hooks/
│   └── useGameLoop.ts   # Fixed timestep loop
├── store/
│   └── gameStore.ts     # Zustand store (not yet used)
├── systems/             # Game logic modules
│   ├── CollisionSystem.ts
│   ├── DamageSystem.ts
│   ├── EnemyBehaviorSystem.ts
│   └── SaveSystem.ts
├── types/
│   ├── game.ts
│   └── codex.ts
└── utils/
    ├── audio.ts
    ├── codex.ts
    ├── enemies.ts
    ├── particles.ts
    ├── upgrades.ts
    └── ...
```

## 🧪 Testing

```bash
npm run test        # Run all tests
npm run test:ui     # Open Vitest UI
```

Current coverage: ~15% (target: 60%)

## 🎯 Current Status

**Overall Grade: B+ (Very Good)**

✅ **Strengths**:

- Fully playable and polished
- Innovative dynamic zone system
- Excellent TypeScript coverage
- Smooth 60 FPS gameplay
- Comprehensive game mechanics

⚠️ **Needs Work**:

- App.tsx too large (2,510 lines - refactoring in progress)
- Low test coverage (15% - expanding)
- 7 enemy types incomplete (planned)
- Performance optimizations needed

See [ROADMAP.md](ROADMAP.md) for detailed development plan.

## 🛠️ Tech Stack

- **React 19.2.0** - UI framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.2.4** - Build tool
- **Zustand 5.0.9** - State management (planned integration)
- **Vitest 4.0.15** - Testing framework
- **Web Audio API** - Procedural sound effects
- **Canvas API** - Game rendering

## 🤝 Contributing

See [ROADMAP.md](ROADMAP.md) for current priorities and planned features.

Key areas for contribution:

1. App.tsx refactoring (critical)
2. Test coverage (high priority)
3. Enemy implementations (7 remaining)
4. Performance optimizations

## 📝 License

This project is open source and available under the MIT License.

## 🎓 Learning Resources

This codebase demonstrates:

- Canvas-based game development in React
- Fixed timestep game loops
- Entity-component patterns
- Procedural audio generation
- TypeScript game development
- Performance optimization techniques

---

**Built with ❤️ using React + TypeScript + Vite**
