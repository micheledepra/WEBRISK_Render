# Getting Started with Risk Game Godot MVP

## Quick Start

1. **Open Project in Godot**
   - Open Godot Engine 4.3 or newer
   - Click "Import" and navigate to the `MVP_GODOT` folder
   - Select `project.godot`
   - Click "Import & Edit"

2. **Run the Game**
   - Press F5 or click the Play button
   - The game will start with 3 test players (Red, Blue, Green)
   - Territories are automatically distributed randomly

3. **Basic Controls**
   - **Left Click**: Select/interact with territory
   - **SPACE**: End current phase (when allowed)
   - **CTRL+S**: Save game

## Game Flow

### Phase 1: Startup (Initial Deployment)
- All 42 territories are randomly distributed to players
- Each territory starts with 1 army
- Players take turns placing remaining armies
- Click any owned territory to place 1 army
- Automatically advances to next player when depleted
- Phase ends when all players have placed all armies

### Phase 2: Reinforcement (Every Turn)
- Calculate reinforcements:
  - Base: `max(1, territories_owned / 3)` rounded down
  - Plus continent bonuses if you control all territories in continent
- Click owned territories to deploy 1 army at a time
- Must deploy ALL armies before advancing
- Cannot skip this phase

### Phase 3: Attack (Optional)
1. Click your territory with 2+ armies (attacker)
2. Click adjacent enemy territory (defender)
3. Battle dialog appears (or console for MVP)
4. Enter remaining armies after combat
5. If defender reaches 0: Conquest occurs
   - Transfer dialog appears
   - Move armies to conquered territory (min 1, leave 1 in attacker)
6. Can attack multiple times or skip phase

### Phase 4: Fortification (Optional)
1. Click your territory with 2+ armies (source)
2. Click adjacent owned territory (destination)
3. Enter number of armies to move (must leave 1 in source)
4. Only ONE fortification per turn
5. Can skip phase

## MVP Combat System

The MVP uses **console-based combat** for simplicity:

### Battle Process:
1. Click attacker territory, then defender territory
2. Console displays battle information
3. In Godot editor console, call:
   ```gdscript
   resolve_combat(attacker_remaining, defender_remaining)
   ```
   Example: `resolve_combat(5, 0)` means attacker has 5 left, defender eliminated

4. If conquest (defender = 0), call:
   ```gdscript
   complete_conquest("territory_id", armies_to_transfer)
   ```
   Example: `complete_conquest("brazil", 3)` moves 3 armies to Brazil

### Full Implementation (Future):
- Replace console commands with BattleDialog.tscn
- See `scenes/BattleDialog.tscn` for UI structure
- Connect signals in Main.gd to show/hide dialog

## Understanding the Architecture

### Core Systems

**GameState** (`scripts/GameState.gd`)
- Central state management
- Territory data storage
- Save/load functionality
- Victory checking

**PhaseManager** (`scripts/PhaseManager.gd`)
- 4-phase turn cycle
- Phase validation
- Phase transition logic

**TurnManager** (`scripts/TurnManager.gd`)
- Routes territory clicks to appropriate handler
- Turn progression
- Player rotation

**CombatSystem** (`scripts/CombatSystem.gd`)
- Attack validation
- Combat resolution
- Conquest handling

**ReinforcementManager** (`scripts/ReinforcementManager.gd`)
- Reinforcement calculation
- Army deployment

**FortificationManager** (`scripts/FortificationManager.gd`)
- Army movement between owned territories
- One fortification per turn enforcement

### Data Files

**map_data.json**
- 42 territories with neighbor relationships
- Continent assignments
- Forms the game board structure

**continents.json**
- 6 continents with bonus values
- Territory lists for each continent

## Customization

### Adding More Players
Edit `Main.gd`:
```gdscript
var test_players = ["Red", "Blue", "Green", "Yellow", "Orange", "Purple"]
var test_colors = {
    "Red": Color.RED,
    "Blue": Color.BLUE,
    "Green": Color.GREEN,
    "Yellow": Color.YELLOW,
    "Orange": Color.ORANGE,
    "Purple": Color.PURPLE
}
```

### Changing Territory Layout
Edit `Main.gd` in `create_territory_nodes()`:
```gdscript
var territories_per_row = 7  # Adjust grid layout
var territory_size = Vector2(120, 80)  # Adjust size
var padding = 20  # Adjust spacing
```

### Modifying Reinforcement Rules
Edit `GameState.gd` in `calculate_reinforcements()`:
```gdscript
var base_reinforcement = max(3, int(floor(territory_count / 3.0)))  # Minimum 3 instead of 1
```

## Debugging

### Console Commands
In Godot editor console (while game is running):

**Check game state:**
```gdscript
print(get_node("/root/Main").game_state.territories)
print(get_node("/root/Main").game_state.get_current_player())
```

**Manual combat resolution:**
```gdscript
get_node("/root/Main").resolve_combat(5, 2)
```

**Manual conquest:**
```gdscript
get_node("/root/Main").complete_conquest("brazil", 3)
```

**Save game:**
```gdscript
get_node("/root/Main").game_state.save_game()
```

**Load game:**
```gdscript
get_node("/root/Main").game_state.load_game()
```

### Common Issues

**Territories not clickable:**
- Check collision shapes are set up in Territory.tscn
- Verify game_state and turn_manager references are set

**Phase won't advance:**
- Check `can_complete_phase()` return value
- Ensure all reinforcements deployed in reinforcement phase

**Combat not working:**
- Use console commands for MVP: `resolve_combat(attacker, defender)`
- Check CombatSystem signals are connected

## Next Steps - Full Implementation

### 1. Proper Territory Shapes
- Replace colored rectangles with polygon shapes
- Import SVG paths or create custom collision polygons
- Add proper territory borders

### 2. Battle Dialog Integration
- Connect BattleDialog.tscn to combat flow
- Remove console-based combat
- Add visual dice rolling (optional)

### 3. UI Enhancements
- Add player stats panel
- Show continent control status
- Add turn history log
- Improve phase instructions

### 4. Visual Effects
- Territory hover effects
- Attack arrows
- Conquest animations
- Phase transition effects

### 5. AI Opponents
- Create AIPlayer class
- Implement decision-making algorithms
- Add difficulty levels

### 6. Map Improvements
- Create proper world map background
- Add territory borders and coastlines
- Implement zoom/pan controls
- Add minimap

### 7. Audio
- Background music
- Sound effects for actions
- Victory fanfare

### 8. Settings Menu
- Player configuration
- Game rules options
- Visual settings

## File Structure Summary

```
MVP_GODOT/
├── project.godot           # Godot project configuration
├── README.md               # Project overview
├── GETTING_STARTED.md      # This file
├── scenes/                 # Scene files
│   ├── Main.tscn          # Main game scene
│   ├── Territory.tscn     # Territory node template
│   ├── BattleDialog.tscn  # Combat dialog (for full impl)
│   └── UnitTransferDialog.tscn  # Transfer dialog (for full impl)
├── scripts/                # GDScript files
│   ├── Main.gd            # Main controller
│   ├── GameState.gd       # State management
│   ├── PhaseManager.gd    # Phase system
│   ├── TurnManager.gd     # Turn coordination
│   ├── CombatSystem.gd    # Combat logic
│   ├── ReinforcementManager.gd  # Reinforcement system
│   ├── FortificationManager.gd  # Fortification system
│   ├── Territory.gd       # Territory node script
│   ├── BattleDialog.gd    # Battle UI (for full impl)
│   └── UnitTransferDialog.gd  # Transfer UI (for full impl)
├── resources/              # Data files
│   ├── map_data.json      # Territory relationships
│   └── continents.json    # Continent definitions
└── assets/                 # Visual/audio assets (empty for MVP)
```

## Testing Checklist

- [ ] Game starts and initializes managers
- [ ] Territories are distributed to players
- [ ] Startup phase: Can place armies on owned territories
- [ ] Startup phase: Auto-advances when player depleted
- [ ] Reinforcement phase: Calculates correct army count
- [ ] Reinforcement phase: Can deploy to owned territories
- [ ] Reinforcement phase: Cannot advance until all deployed
- [ ] Attack phase: Can select attacker with 2+ armies
- [ ] Attack phase: Can select adjacent enemy
- [ ] Attack phase: Combat resolves correctly
- [ ] Attack phase: Conquest transfers ownership
- [ ] Attack phase: Can skip phase
- [ ] Fortification phase: Can select source with 2+ armies
- [ ] Fortification phase: Can move to adjacent owned territory
- [ ] Fortification phase: Only one fortification per turn
- [ ] Fortification phase: Can skip phase
- [ ] Victory: Detects when player owns all territories
- [ ] Save/Load: Game state persists correctly

## Support & Resources

- **Original Web Version**: See parent directory for reference implementation
- **Godot Docs**: https://docs.godotengine.org/
- **Risk Rules**: Classic Risk board game rules apply

Enjoy building your Risk game in Godot! 🎮
