# MVP_GODOT - File Index

## 📖 Documentation (Start Here!)

### For Users
1. **[README.md](README.md)** - Project overview, game rules, features
2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Controls, phases, debug commands ⭐ BEST FOR QUICK START
3. **[GETTING_STARTED.md](GETTING_STARTED.md)** - Detailed usage guide, customization

### For Developers
4. **[SUMMARY.md](SUMMARY.md)** - Project completion status, statistics, next steps
5. **[IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)** - Web-to-Godot port details, design decisions
6. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Complete file documentation, dependencies
7. **[SVG_TERRITORY_SYSTEM.md](SVG_TERRITORY_SYSTEM.md)** - ⭐ **NEW!** SVG-based territory system documentation
8. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Migration from old polygon system to SVG
9. **[INDEX.md](INDEX.md)** - This file

## 🗺️ SVG Territory System (NEW!)

### Territory SVG Files
- **[../territories_svg/](../territories_svg/)** - 42 individual SVG files (one per territory)
  - `alaska.svg`, `brazil.svg`, `china.svg`, etc.
  - Each file contains the geographic shape for one territory
  - Files named using snake_case matching territory IDs

### Conversion Tools
- **[tools/svg_to_godot_polygons.py](tools/svg_to_godot_polygons.py)** - Converts SVG files to Godot format
  - Parses SVG path data
  - Generates polygon coordinates
  - Calculates centroids for positioning
  - Outputs to `data/territory_polygons.json`

### Generated Data
- **[data/territory_polygons.json](data/territory_polygons.json)** - Generated polygon data from SVG
  - Contains polygon vertices for each territory
  - Includes display names and centroids
  - ~13,843 vertices total across 42 territories
  - **Auto-generated - do not edit manually!**

## 🎬 Scenes (Godot Scene Files)

### Main Scenes
- **[scenes/Main.tscn](scenes/Main.tscn)** - Root game scene
  - Instantiates all managers
  - Creates UI overlay with labels and buttons
  - Spawns 42 territory instances with SVG shapes
  
- **[scenes/Territory.tscn](scenes/Territory.tscn)** - Territory node template ⭐ UPDATED FOR SVG
  - **Polygon2D** for accurate SVG shape rendering
  - **CollisionPolygon2D** for precise click detection
  - Labels for name, army count, owner
  - Supports dynamic coloring and hover effects

### Dialog Scenes (Full Implementation Ready)
- **[scenes/BattleDialog.tscn](scenes/BattleDialog.tscn)** - Combat resolution UI
- **[scenes/UnitTransferDialog.tscn](scenes/UnitTransferDialog.tscn)** - Post-conquest transfer UI

## 📜 Scripts (Game Logic)

### Core Controllers
- **[scripts/Main.gd](scripts/Main.gd)** ⭐ START HERE (UPDATED FOR SVG)
  - Main controller and entry point
  - Loads SVG polygon data from JSON
  - Initializes all managers
  - Creates territories with SVG shapes
  - Handles UI updates and user input
  - Contains debug functions

### State Management
- **[scripts/GameState.gd](scripts/GameState.gd)** ⭐ CORE STATE
  - Central game state storage
  - Territory data management
  - Save/load functionality
  - Victory detection

### Game Managers
- **[scripts/PhaseManager.gd](scripts/PhaseManager.gd)**
  - 4-phase turn cycle
  - Phase validation
  - Phase transition logic

- **[scripts/TurnManager.gd](scripts/TurnManager.gd)**
  - Territory click routing
  - Turn progression
  - Coordinates all managers

- **[scripts/CombatSystem.gd](scripts/CombatSystem.gd)**
  - Attack validation
  - Combat resolution
  - Conquest handling

- **[scripts/ReinforcementManager.gd](scripts/ReinforcementManager.gd)**
  - Reinforcement calculation
  - Army deployment

- **[scripts/FortificationManager.gd](scripts/FortificationManager.gd)**
  - Army movement validation
  - Fortification execution

### UI Controllers
- **[scripts/Territory.gd](scripts/Territory.gd)** ⭐ UPDATED FOR SVG
  - Individual territory behavior with SVG polygon rendering
  - Dynamic coloring based on owner
  - Visual updates based on state
  - Click handling and hover effects
  - Supports display names from SVG data

- **[scripts/BattleDialog.gd](scripts/BattleDialog.gd)**
  - Battle UI controller (full impl)

- **[scripts/UnitTransferDialog.gd](scripts/UnitTransferDialog.gd)**
  - Transfer UI controller (full impl)

## 📊 Resources (Game Data)

- **[resources/map_data.json](resources/map_data.json)** ⭐ MAP DATA (UPDATED)
  - 42 territories with neighbor relationships
  - Continent assignments
  - **Updated IDs:** `western_united_states`, `eastern_united_states`

- **[resources/continents.json](resources/continents.json)** ⭐ CONTINENT DATA (UPDATED)
  - 6 continents with bonuses
  - Territory lists per continent
  - **Updated IDs:** Match SVG filenames

## 🎨 Assets

- **[assets/](assets/)** - Empty folder for visual/audio assets
  - Place custom territory textures here
  - Add sound effects and music
  - Store custom fonts

## ⚙️ Configuration

- **[project.godot](project.godot)** - Godot project configuration
- **[icon.svg](icon.svg)** - Project icon (blue circle with "R")

---

## 🗺️ Navigation Guide

### "I want to understand the architecture"
1. Read [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md)
2. Study [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
3. Check [scripts/Main.gd](scripts/Main.gd) for manager initialization

### "I want to play the game"
1. Open project in Godot 4.3+
2. Press F5 to run
3. Follow [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for controls

### "I want to modify the game"
1. Read [GETTING_STARTED.md](GETTING_STARTED.md) → Customization section
2. Edit [scripts/Main.gd](scripts/Main.gd) for player setup
3. Edit [scripts/GameState.gd](scripts/GameState.gd) for game rules

### "I want to enhance the visuals"
1. Replace ColorRect in [scenes/Territory.tscn](scenes/Territory.tscn) with Polygon2D
2. Add textures to [assets/](assets/) folder
3. Update [scripts/Territory.gd](scripts/Territory.gd) to load textures

### "I want to implement full combat UI"
1. Connect BattleDialog signals in [scripts/Main.gd](scripts/Main.gd)
2. See [scripts/BattleDialog.gd](scripts/BattleDialog.gd) for signal definitions
3. Remove console-based combat from Main.gd

### "I want to add AI"
1. Create new file: `scripts/AIPlayer.gd`
2. Implement decision-making logic
3. Hook into TurnManager for AI turns

---

## 📂 File Organization

```
MVP_GODOT/
├── 📘 Documentation (7 files)
│   ├── README.md
│   ├── QUICK_REFERENCE.md ⭐ Quick start
│   ├── GETTING_STARTED.md
│   ├── SUMMARY.md
│   ├── IMPLEMENTATION_NOTES.md
│   ├── PROJECT_STRUCTURE.md
│   └── INDEX.md (this file)
│
├── 🎬 Scenes (4 files)
│   ├── Main.tscn ⭐ Entry point
│   ├── Territory.tscn
│   ├── BattleDialog.tscn
│   └── UnitTransferDialog.tscn
│
├── 📜 Scripts (10 files)
│   ├── Main.gd ⭐ Main controller
│   ├── GameState.gd ⭐ Core state
│   ├── PhaseManager.gd
│   ├── TurnManager.gd
│   ├── CombatSystem.gd
│   ├── ReinforcementManager.gd
│   ├── FortificationManager.gd
│   ├── Territory.gd
│   ├── BattleDialog.gd
│   └── UnitTransferDialog.gd
│
├── 📊 Resources (2 files)
│   ├── map_data.json ⭐ 42 territories
│   └── continents.json ⭐ 6 continents
│
├── 🎨 Assets (empty)
│   └── (ready for expansion)
│
└── ⚙️ Config (2 files)
    ├── project.godot
    └── icon.svg
```

**Total Files**: 26 (including this index)

---

## 🎯 Key Files by Purpose

### To Run the Game
1. Open `project.godot` in Godot
2. Run `scenes/Main.tscn`

### To Understand Mechanics
1. `scripts/GameState.gd` - Data structures
2. `scripts/PhaseManager.gd` - Game flow
3. `scripts/CombatSystem.gd` - Combat rules

### To Modify Gameplay
1. `scripts/Main.gd` - Player setup (line 28)
2. `scripts/GameState.gd` - Reinforcement rules (line 140)
3. `resources/continents.json` - Continent bonuses

### To Debug
1. `scripts/Main.gd` - Debug functions (line 200+)
2. `QUICK_REFERENCE.md` - Console commands

---

## 📊 Statistics

| Category | Count |
|----------|-------|
| Total Files | 26 |
| Documentation | 7 |
| Scene Files | 4 |
| Script Files | 10 |
| Resource Files | 2 |
| Config Files | 2 |
| Asset Folders | 1 (empty) |

---

## 🚀 Quick Actions

### First Time Setup
```bash
1. Open Godot 4.3+
2. Import project (select project.godot)
3. Press F5 to run
```

### During Development
```bash
# Edit player count
→ scripts/Main.gd line 28

# Edit game rules
→ scripts/GameState.gd

# Edit UI
→ scenes/Main.tscn

# Edit territory appearance
→ scenes/Territory.tscn
```

### For Testing
```bash
# Run game
F5

# Stop game
F8

# Open console
View → Debugger

# Execute debug command
resolve_combat(5, 0)
```

---

## 🔗 External References

- **Original Web Version**: `../game.html` (parent directory)
- **Godot Engine Docs**: https://docs.godotengine.org/
- **GDScript Reference**: https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/

---

## ✅ Project Status

**Status**: COMPLETE ✅
**Version**: MVP 1.0
**Date**: November 25, 2025
**Total Development**: Analysis + Implementation Complete

---

**Need help?** Start with [QUICK_REFERENCE.md](QUICK_REFERENCE.md)!
