# Risk Game - Godot MVP

A strategic board game implementation based on the classic Risk board game, ported from a web-based JavaScript version to Godot Engine.

## Overview

This is a single-player implementation of Risk featuring:
- 42 territories across 6 continents
- 4-phase turn system (Startup, Reinforcement, Attack, Fortification)
- Direct army input combat system
- Continent bonuses for reinforcements
- Victory condition: Control all territories

## Project Structure

```
MVP_GODOT/
├── scenes/          # Godot scene files (.tscn)
│   ├── Main.tscn
│   ├── GameBoard.tscn
│   ├── Territory.tscn
│   ├── UIOverlay.tscn
│   ├── BattleDialog.tscn
│   └── UnitTransferDialog.tscn
├── scripts/         # GDScript game logic
│   ├── GameState.gd
│   ├── TurnManager.gd
│   ├── PhaseManager.gd
│   ├── CombatSystem.gd
│   ├── ReinforcementManager.gd
│   ├── FortificationManager.gd
│   ├── Territory.gd
│   └── UIController.gd
├── resources/       # Data files (JSON, resources)
│   ├── map_data.json
│   └── continents.json
└── assets/          # Visual assets (sprites, fonts, etc.)

```

## Game Phases

### 1. Startup Phase (One-time)
- All 42 territories are randomly distributed to players
- Each territory starts with 1 army
- Players take turns placing remaining armies on their territories
- One army deployed per click on owned territory
- Automatically advances to next player when armies depleted

### 2. Reinforcement Phase (Mandatory)
- Calculate reinforcements: `max(1, floor(territories_owned / 3)) + continent_bonuses`
- Continent bonuses:
  - North America: +5 armies (9 territories)
  - South America: +2 armies (4 territories)
  - Europe: +5 armies (7 territories)
  - Africa: +3 armies (3 territories)
  - Asia: +7 armies (12 territories)
  - Australia: +2 armies (4 territories)
- Deploy all armies to owned territories before proceeding
- Cannot skip this phase

### 3. Attack Phase (Optional)
- Select attacking territory (must have 2+ armies)
- Select adjacent enemy territory to attack
- Direct army input: Enter remaining armies after battle
- If defender reaches 0 armies: Territory conquered
- Unit transfer modal: Move armies to conquered territory (min 1, leave 1 in attacker)
- Can perform multiple attacks or skip phase

### 4. Fortification Phase (Optional)
- Select source territory (must have 2+ armies)
- Select adjacent owned destination territory
- Move armies (must leave at least 1 in source)
- Only ONE fortification per turn
- Can skip phase

## Initial Army Allocation

Based on player count:
- 2 players: 40 armies each
- 3 players: 35 armies each
- 4 players: 30 armies each
- 5 players: 25 armies each
- 6 players: 20 armies each

## Victory Condition

First player to control all 42 territories wins the game.

## Architecture

The game follows a **Manager Pattern** with clear separation of concerns:

- **GameState**: Central state management, territory data, victory checking
- **TurnManager**: Turn progression, player rotation, territory click routing
- **PhaseManager**: 4-phase system validation and transitions
- **CombatSystem**: Attack validation, combat resolution, conquest handling
- **ReinforcementManager**: Reinforcement calculation, deployment
- **FortificationManager**: Army movement between owned territories
- **Territory**: Individual territory node with visual feedback
- **UIController**: HUD updates, phase display, player information

## Technical Implementation Notes

### Data Structures

**Territory:**
```gdscript
{
  "owner": "Player Name",
  "armies": int,
  "neighbors": ["territory_id", ...],
  "continent": "continent_name"
}
```

**Game State:**
```gdscript
{
  "territories": { "territory_id": Territory, ... },
  "players": ["Player 1", "Player 2", ...],
  "current_player_index": int,
  "current_phase": Phase enum,
  "turn_number": int,
  "remaining_armies": { "player": count },
  "player_colors": { "player": Color }
}
```

### Key Algorithms

**Fisher-Yates Shuffle** (Territory Assignment):
```gdscript
func assign_territories_randomly():
    var all_territories = territory_ids.duplicate()
    all_territories.shuffle()
    for i in range(all_territories.size()):
        var player_index = i % players.size()
        territories[all_territories[i]].owner = players[player_index]
        territories[all_territories[i]].armies = 1
```

**Reinforcement Calculation**:
```gdscript
func calculate_reinforcements(player: String) -> int:
    var territory_count = count_player_territories(player)
    var base = max(1, floor(territory_count / 3.0))
    var continent_bonus = calculate_continent_bonuses(player)
    return base + continent_bonus
```

## Getting Started

1. Open project in Godot 4.3+
2. Run the Main scene
3. Enter player names (2-6 players)
4. Follow on-screen phase instructions
5. Use mouse to click territories for actions
6. Press SPACE or "End Phase" button to advance

## Original Source

Ported from a web-based JavaScript implementation featuring:
- 117 modular JavaScript files
- 11,394 line main HTML file
- SessionStorage state persistence
- SVG-based map rendering
- Manager pattern architecture

## License

Educational/Personal use - Based on classic Risk board game mechanics.
