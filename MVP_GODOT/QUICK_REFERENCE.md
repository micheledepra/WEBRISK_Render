# Risk Game MVP - Quick Reference Card

## 🎮 Controls
| Action | Key/Mouse |
|--------|-----------|
| Select Territory | Left Click |
| End Phase | SPACE or Button |
| Save Game | CTRL + S |

## 📋 Game Phases

### 1️⃣ Startup (One-time)
- **Goal**: Place all initial armies
- **Action**: Click owned territory → place 1 army
- **Advance**: Automatic when depleted

### 2️⃣ Reinforcement (Every Turn)
- **Goal**: Deploy reinforcement armies
- **Formula**: max(1, territories÷3) + continent bonuses
- **Action**: Click owned territory → place 1 army
- **Advance**: When all armies deployed

### 3️⃣ Attack (Optional)
- **Goal**: Conquer enemy territories
- **Action**: Click attacker (2+ armies) → Click adjacent enemy
- **Console**: `resolve_combat(att_remaining, def_remaining)`
- **Conquest**: `complete_conquest("territory", army_count)`
- **Advance**: Click button or SPACE

### 4️⃣ Fortification (Optional)
- **Goal**: Move armies between owned territories
- **Action**: Click source (2+ armies) → Click adjacent owned
- **Limit**: One fortification per turn
- **Advance**: Click button or SPACE

## 🏆 Victory
Control all 42 territories!

## 💾 Save Locations
- **Save File**: `user://risk_save.json`
- **Windows**: `%APPDATA%\Godot\app_userdata\Risk Game MVP\`
- **Linux**: `~/.local/share/godot/app_userdata/Risk Game MVP/`
- **macOS**: `~/Library/Application Support/Godot/app_userdata/Risk Game MVP/`

## 🐛 Debug Commands (Godot Console)

```gdscript
# Get main node
var main = get_node("/root/Main")

# Check current state
print(main.game_state.get_current_player())
print(main.game_state.turn_number)
print(main.phase_manager.current_phase)

# Manual combat
main.resolve_combat(5, 0)  # Attacker: 5, Defender: 0 (conquest)
main.complete_conquest("brazil", 3)  # Move 3 armies

# Force save
main.game_state.save_game()

# Check territory
print(main.game_state.get_territory("brazil"))

# List player territories
var territories = main.game_state.get_player_territories("Red Player")
print(territories)
```

## 🌍 Map Data

### Continents (Bonuses)
- North America: 9 territories, +5 armies
- South America: 4 territories, +2 armies
- Europe: 7 territories, +5 armies
- Africa: 6 territories, +3 armies
- Asia: 12 territories, +7 armies
- Australia: 4 territories, +2 armies

### Initial Armies by Player Count
| Players | Armies Each |
|---------|-------------|
| 2 | 40 |
| 3 | 35 |
| 4 | 30 |
| 5 | 25 |
| 6 | 20 |

## ⚠️ Common Mistakes

❌ Attacking with only 1 army
✅ Need 2+ armies to attack (1 must remain)

❌ Forgetting to deploy all reinforcements
✅ Must deploy ALL before advancing

❌ Multiple fortifications in one turn
✅ Only ONE fortification per turn

❌ Attacking non-adjacent territory
✅ Territories must share a border

❌ Moving armies to enemy territory in fortification
✅ Fortification only between owned territories

## 📊 Game Flow Diagram

```
START
  ↓
Startup Phase (place all armies)
  ↓
Turn 1 Begins
  ↓
┌─────────────────┐
│ REINFORCEMENT   │ (mandatory)
│ Deploy armies   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ ATTACK          │ (optional)
│ Conquer enemies │
└────────┬────────┘
         ↓
┌─────────────────┐
│ FORTIFICATION   │ (optional)
│ Move armies     │
└────────┬────────┘
         ↓
Next Player → Back to Reinforcement
         ↓
Check Victory → END or Continue
```

## 🔧 Customization Quick Edits

**Add more players** (`Main.gd` line 28):
```gdscript
var test_players = ["Red", "Blue", "Green", "Yellow"]
```

**Change reinforcement minimum** (`GameState.gd` line 140):
```gdscript
var base_reinforcement = max(3, int(floor(territory_count / 3.0)))
```

**Adjust territory size** (`Main.gd` line 75):
```gdscript
var territory_size = Vector2(150, 100)
```

## 📁 File Quick Access

| File | Purpose |
|------|---------|
| `Main.gd` | Main controller, manager setup |
| `GameState.gd` | State, save/load, victory |
| `PhaseManager.gd` | Phase cycle logic |
| `CombatSystem.gd` | Attack and conquest |
| `map_data.json` | Territory neighbors |
| `continents.json` | Continent bonuses |

## 🎯 Testing Checklist

- [ ] Game starts without errors
- [ ] Can click territories
- [ ] Armies deploy correctly
- [ ] Reinforcements calculated correctly
- [ ] Attack system works
- [ ] Conquest transfers ownership
- [ ] Fortification moves armies
- [ ] Victory detected
- [ ] Save/load works

## 💡 Pro Tips

1. **Control Continents Early** - Bonuses are powerful
2. **Australia Strategy** - Only 4 territories, easiest to hold
3. **South America** - Small bonus but easy to defend
4. **Avoid Asia** - Large bonus but hard to defend
5. **Fortify Borders** - Move armies to contested territories

## 🚀 Next Steps After MVP

1. Connect BattleDialog.tscn to combat
2. Add proper territory shapes
3. Implement AI opponents
4. Add sound effects
5. Create main menu
6. Add multiplayer

---

**Need Help?** Check GETTING_STARTED.md for detailed guide!
