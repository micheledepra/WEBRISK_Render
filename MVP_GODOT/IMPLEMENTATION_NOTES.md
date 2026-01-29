# Implementation Notes - Web to Godot Port

## Overview
This document details the architectural decisions and implementation strategy for porting the web-based Risk game to Godot Engine.

## Original Web Architecture Analysis

### Source Structure
- **Main File**: game.html (11,394 lines)
  - Embedded CSS (6,500+ lines)
  - Embedded JavaScript initialization
  - All modal dialogs defined inline

- **JavaScript Modules**: 117+ files in `js/` directory
  - Manager pattern for separation of concerns
  - Sequential module loading via Promise chains
  - SessionStorage for state persistence

### Key Design Patterns
1. **Manager Pattern**: Dedicated manager classes for each game system
2. **Event-Driven Updates**: CustomEvents for UI synchronization
3. **State Centralization**: Single GameState object as source of truth
4. **Phase Synchronization**: PhaseSynchronizer coordinates managers

## Godot Port Strategy

### Architectural Mappings

| Web Component | Godot Equivalent | Notes |
|--------------|------------------|-------|
| GameState.js | GameState.gd (Node) | Extends Node instead of class |
| TurnManager.js | TurnManager.gd (Node) | Manager pattern preserved |
| PhaseManager.js | PhaseManager.gd (Node) | Enum for phases instead of strings |
| CombatSystem.js | CombatSystem.gd (Node) | Direct army input simplified |
| RiskUI.js | Main.gd (Node) | Main controller scene |
| Territory SVG | Territory.tscn (Node2D) | ColorRect + Area2D for clicks |
| SessionStorage | FileAccess JSON | user:// directory for saves |
| CustomEvents | Godot Signals | Native signal system |

### Manager System Translation

**Web Pattern:**
```javascript
class TurnManager {
	constructor(gameState, phaseManager, ...) {
		this.gameState = gameState;
		this.phaseManager = phaseManager;
	}
}
```

**Godot Pattern:**
```gdscript
class_name TurnManager
extends Node

var game_state: GameState
var phase_manager: PhaseManager

func initialize(state, phase_mgr, ...):
	game_state = state
	phase_manager = phase_mgr
```

**Rationale**: Godot nodes use explicit initialization instead of constructors, allowing flexible scene tree setup.

### State Management

**Web (SessionStorage):**
```javascript
sessionStorage.setItem('riskGameState', JSON.stringify(state));
const saved = JSON.parse(sessionStorage.getItem('riskGameState'));
```

**Godot (FileAccess):**
```gdscript
var save_file = FileAccess.open("user://risk_save.json", FileAccess.WRITE)
save_file.store_string(JSON.stringify(save_data))

var load_file = FileAccess.open("user://risk_save.json", FileAccess.READ)
var json = JSON.new()
json.parse(load_file.get_as_text())
```

**Rationale**: FileAccess provides persistent storage across game sessions, similar to SessionStorage behavior.

### Territory System

**Web (SVG Paths):**
```javascript
<path id="brazil" d="M123,456 L..." class="territory" />
```
- Precise geographic shapes
- Complex path definitions
- CSS styling for colors

**Godot (Node2D + Area2D):**
```gdscript
# Territory.tscn structure:
Territory (Node2D)
  ├─ ColorRect (visual representation)
  ├─ Area2D (click detection)
  │   └─ CollisionShape2D (rectangular bounds)
  ├─ NameLabel (territory name)
  ├─ ArmyLabel (army count)
  └─ OwnerLabel (owner name)
```

**Rationale**: 
- MVP uses simple rectangles for rapid prototyping
- ColorRect provides easy color changes for player ownership
- Area2D enables mouse click detection
- Full implementation can use Polygon2D for accurate shapes

### Combat System

**Web (Direct Army Input):**
```javascript
// Player enters remaining armies after "mental" battle
openBattleModal(attacker, defender);
// User inputs: attackerRemaining, defenderRemaining
resolveCombat(attackerRemaining, defenderRemaining);
```

**Godot MVP (Console-based):**
```gdscript
# Console-based for MVP simplicity
print("Battle: %s vs %s" % [attacker, defender])
print("Call: resolve_combat(attacker_remaining, defender_remaining)")

# Full implementation uses BattleDialog.tscn
show_battle_dialog(attacker, defender)
```

**Rationale**: 
- Console approach minimizes UI complexity for MVP
- BattleDialog.tscn prepared for full implementation
- Direct input system is simpler than dice rolling simulation

### Phase Management

**Web (String-based):**
```javascript
phase = 'startup' | 'reinforcement' | 'attack' | 'fortification'
```

**Godot (Enum-based):**
```gdscript
enum Phase { STARTUP, REINFORCEMENT, ATTACK, FORTIFICATION }
current_phase: Phase = Phase.STARTUP
```

**Rationale**: 
- Enums provide type safety
- Better autocomplete in Godot editor
- Prevents string typos

## Key Algorithm Ports

### 1. Fisher-Yates Shuffle (Territory Assignment)

**Web:**
```javascript
for (let i = territories.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[territories[i], territories[j]] = [territories[j], territories[i]];
}
```

**Godot:**
```gdscript
territory_ids.shuffle()  # Built-in Fisher-Yates
```

**Rationale**: Godot provides shuffle() method on Arrays, simplifying implementation.

### 2. Reinforcement Calculation

**Algorithm (identical in both):**
```
base = max(1, floor(territories_owned / 3))
continent_bonus = sum of controlled continents
total = base + continent_bonus
```

**Implementation differences:**
- Web: Iterates through `Object.values(territories)`
- Godot: Iterates through `territories.values()`

### 3. Adjacency Checking

**Both versions:**
- Store neighbor arrays with each territory
- Simple array membership check: `neighbors.includes(target)` (Web) or `neighbors.has(target)` (Godot)

## Simplified Features for MVP

### 1. Territory Visuals
**Web**: SVG paths with precise geographic shapes
**MVP**: Rectangular ColorRects in grid layout
**Reason**: Faster implementation, focus on mechanics

### 2. Combat Resolution
**Web**: Modal dialog with input fields
**MVP**: Console commands
**Reason**: Reduces UI complexity for initial port

### 3. Map Layout
**Web**: Proper world map with continents
**MVP**: Grid of labeled rectangles
**Reason**: Map data intact, visuals can be enhanced later

### 4. Animations
**Web**: CSS animations for territory effects
**MVP**: Simple color changes
**Reason**: Core gameplay priority over visual polish

### 5. Audio
**Web**: MusicPlayer system with multiple tracks
**MVP**: No audio
**Reason**: Optional feature for full implementation

## Data Structure Comparison

### Territory Object

**Web:**
```javascript
territories[id] = {
	owner: "Player Name",
	armies: number,
	neighbors: [array],
	continent: "continent-name"
}
```

**Godot:**
```gdscript
territories[id] = {
	"owner": "Player Name",
	"armies": number,
	"neighbors": [array],
	"continent": "continent-name"
}
```

**Difference**: Godot dictionaries use string keys, identical structure otherwise.

### Game State

**Both versions contain:**
- territories: Dictionary of territory data
- players: Array of player names
- current_player_index: Int
- current_phase: String/Enum
- turn_number: Int
- remaining_armies: Dictionary (player → count)
- player_colors: Dictionary (player → color)

## Signal System (Web Events → Godot Signals)

**Web CustomEvents:**
```javascript
document.dispatchEvent(new CustomEvent('phaseChanged', { detail: phase }));
document.addEventListener('phaseChanged', handler);
```

**Godot Signals:**
```gdscript
signal phase_changed(new_phase: Phase)
phase_changed.emit(Phase.ATTACK)
phase_manager.phase_changed.connect(_on_phase_changed)
```

**Advantages**:
- Type-safe parameters
- Direct node connections
- Automatic cleanup when nodes freed

## Testing Strategy

### Unit Testing Equivalent
**Web**: Manual console testing with debug commands
**Godot**: Same approach via Godot editor console

**Debug commands available:**
- `resolve_combat(att, def)` - Manually resolve battle
- `complete_conquest(id, armies)` - Finish conquest
- `game_state.save_game()` - Force save
- Access any manager through node path

### Integration Testing
Both versions rely on manual playtesting with focus on:
1. Phase transitions
2. Reinforcement calculation accuracy
3. Combat resolution correctness
4. Victory condition detection
5. Save/load state integrity

## Performance Considerations

### Web Version
- 42 DOM territory elements
- SVG rendering
- Event delegation for clicks
- SessionStorage I/O

### Godot Version
- 42 Node2D instances
- ColorRect rendering (very fast)
- Direct signal connections
- FileAccess I/O

**Expected Performance**: Godot version should be significantly faster due to:
- Native engine rendering
- Compiled GDScript vs interpreted JavaScript
- Efficient scene tree architecture

## Future Enhancement Path

### Phase 1: MVP (Current)
- ✅ Core mechanics functional
- ✅ Console-based combat
- ✅ Grid territory layout
- ✅ Basic UI

### Phase 2: Visual Polish
- Replace rectangles with proper territory shapes
- Integrate BattleDialog and UnitTransferDialog
- Add territory borders and highlights
- Implement hover effects

### Phase 3: Advanced Features
- AI opponents
- Multiplayer networking (Godot's built-in ENet)
- Advanced map with zoom/pan
- Card system (if desired)

### Phase 4: Content Expansion
- Multiple map variants
- Custom game rules
- Tournament mode
- Statistics tracking

## Lessons Learned

### What Translated Well
1. **Manager Pattern**: Node-based managers work excellently
2. **State Management**: Dictionary-based state is natural in GDScript
3. **Phase System**: Enum-based phases cleaner than strings
4. **Reinforcement Algorithm**: Identical logic, identical results

### What Required Adaptation
1. **UI Structure**: Scene tree vs DOM requires different organization
2. **Event System**: Signals replace CustomEvents (improvement)
3. **Territory Rendering**: ColorRect simpler than SVG for MVP
4. **Module Loading**: Godot's scene instancing replaces Promise chains

### Godot Advantages
1. **Built-in Editor**: Visual scene editing vs hand-coding HTML
2. **Type Safety**: Static typing available in GDScript
3. **Performance**: Native engine vs browser rendering
4. **Deployment**: Standalone executables vs web hosting

### Web Advantages
1. **No Installation**: Browser-based accessibility
2. **Cross-Platform**: Automatic via web standards
3. **Live Updates**: Change code without redeployment
4. **SVG Precision**: Complex territory shapes easier

## Conclusion

The port successfully maintains the core architecture and gameplay mechanics of the web version while leveraging Godot's strengths. The Manager pattern translates naturally to Node-based classes, and Godot's signal system provides cleaner event handling than web CustomEvents.

The MVP prioritizes functional accuracy over visual fidelity, establishing a solid foundation for future enhancements. All core Risk mechanics are preserved:
- 4-phase turn cycle
- Official reinforcement rules
- Continent bonuses
- Attack/conquest system
- Fortification movement
- Victory detection

The simplified territory visuals and console-based combat are intentional MVP choices, with full UI implementations prepared in scene files for easy integration.
