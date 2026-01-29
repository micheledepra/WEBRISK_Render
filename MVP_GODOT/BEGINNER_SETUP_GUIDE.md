# 🎮 COMPLETE GODOT SETUP GUIDE FOR RISK GAME MVP
## For Complete Beginners (Zero Godot Experience Required)

---

## 📋 **WHAT YOU NEED TO KNOW FIRST**

### **Project Overview**
- **Game Type**: Risk board game (strategic territory conquest)
- **Godot Version Required**: **Godot 4.3 or newer** (NOT Godot 3.x)
- **Entry Point**: `scenes/Main.tscn`
- **Project Location**: `c:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\MVP_GODOT\`

### **What's Already Built**
- ✅ 42 territories with neighbor connections
- ✅ 6 continents with bonus mechanics  
- ✅ Complete 4-phase turn system
- ✅ Combat system (console-based for MVP)
- ✅ Save/load functionality
- ✅ Victory detection
- ✅ Full manager architecture

---

## 🔧 **STEP 1: DOWNLOAD AND INSTALL GODOT**

### **What is Godot?**
Godot is a free, open-source game engine. It's the software you'll use to open, run, and edit your Risk game.

### **Download the Correct Version**

1. **Open your web browser** (Chrome, Edge, Firefox, etc.)

2. **Go to**: https://godotengine.org/download/windows/

3. **IMPORTANT**: You need **Godot 4.3 or newer** (NOT Godot 3.x)
   - Look for "**Godot 4.x**" section
   - As of November 2025, latest stable is likely **Godot 4.3** or **4.4+**

4. **Choose the correct download**:
   - Click **"Download Godot 4.x (64-bit)"**
   - You want the **Standard version** (NOT the .NET/C# version)
   - File: `Godot_v4.3-stable_win64.exe`

5. **Download location**: Saves to Downloads folder

### **Install Godot (Super Simple!)**

Godot doesn't "install" traditionally - it's just an .exe file!

1. **Navigate to Downloads folder**
   - Press `Windows Key + E` to open File Explorer
   - Click "Downloads" in left sidebar

2. **Find the file**
   - Look for `Godot_v4.3-stable_win64.exe`

3. **Move it somewhere permanent** (IMPORTANT!)
   - Create folder: `C:\Godot\`
   - **Drag the .exe file** into that folder
   - **Why?** Godot stores settings next to the .exe. Don't delete from Downloads!

4. **Create desktop shortcut** (optional):
   - Right-click the .exe
   - "Send to" → "Desktop (create shortcut)"

5. **Run Godot for first time**:
   - Double-click the .exe
   - Windows security warning? Click "More info" → "Run anyway"
   - Godot opens to **Project Manager** screen

---

## 📂 **STEP 2: OPEN YOUR RISK GAME PROJECT**

### **Import the Project**

1. **Godot should show "Project Manager" window**
   - Shows list of projects (currently empty)

2. **Click "Import" button** (top-right corner)
   - File browser opens

3. **Navigate to project folder**:
   ```
   C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\MVP_GODOT\
   ```
   - **Pro tip**: Copy this path, paste in address bar, press Enter

4. **Select the `project.godot` file**
   - Click **`project.godot`**
   - Click "Open"

5. **Godot imports the project**
   - "Risk Game MVP" appears in Project Manager
   - Click "Edit" to open

6. **First import takes 10-30 seconds**
   - Creating `.import` files (normal!)
   - Let progress bar complete

### **What You Should See**
After import, Godot Editor opens with:
- **Top Menu Bar**: File, Edit, Project, Debug
- **Main Viewport** (center): Gray area showing game scene
- **Scene Tree** (top-left): "Main" node with children
- **FileSystem** (bottom-left): All project files
- **Inspector** (right): Properties of selected nodes
- **Bottom Panel**: Output, Debugger

---

## 🎮 **STEP 3: RUN THE GAME FOR THE FIRST TIME**

### **Your First Play Test**

1. **Make sure `Main.tscn` is open**
   - Tab at top should say "Main.tscn"
   - If not: FileSystem → double-click `scenes/Main.tscn`

2. **Press the Play button**
   - **Top-right corner** of Godot
   - Click **▶️ play button** OR press **F5**

3. **First time only**:
   - "No main scene defined, select one?"
   - Click "Select"
   - Choose `scenes/Main.tscn`
   - Press F5 again

4. **Game window appears!**
   - New window with the game
   - 42 colored rectangles (territories) in a grid
   - UI panel top-left with game info
   - "Turn: 1", "Phase: Startup", "Current Player: Red Player"

### **What to Expect (First Playthrough)**

**Startup Phase** (Initial army placement):
- Each player takes turns placing starting armies
- Click colored rectangles matching current player color
- Each click places 1 army
- Number on territory increases
- Auto-switches to next player when depleted

**Reinforcement Phase** (Every turn):
- Shows "Remaining Armies: X"
- Click your territories to place armies
- Must place ALL before continuing

**Attack Phase** (Optional):
- Click your territory with 2+ armies
- Click adjacent enemy territory
- **MVP Note**: Combat is console-based (check Output panel in editor)

**Fortification Phase** (Optional):
- Click your territory with 2+ armies
- Click adjacent owned territory
- Move armies between them

**End Phase**:
- Click "End Phase" button or press **SPACE**

**Victory**:
- Control all 42 territories → "VICTORY!" message

### **Stop the Game**
- Press **F8** or click **⏹️ Stop button** (top-right)
- Returns to editor

---

## 🗺️ **STEP 4: UNDERSTANDING THE GODOT EDITOR**

### **1. Scene Tree (Top-Left Panel)**
Shows all objects in current scene as hierarchy:

```
Main (Node)
├── GameBoard (Node2D)
│   ├── alaska (Territory)
│   ├── brazil (Territory)
│   └── ... (40 more territories)
└── UIOverlay (CanvasLayer)
    └── Panel
        └── VBox
            ├── TurnLabel
            ├── PhaseLabel
            └── ... (more UI)
```

**What you can do**:
- Click nodes to select (shows properties in Inspector)
- Eye icon: hide/show in editor
- Lock icon: prevent selection
- Right-click: rename, delete, duplicate

### **2. FileSystem (Bottom-Left Panel)**
All project files by folder:

**Important folders**:
- **📁 scenes/**: `.tscn` files (saved node arrangements)
  - `Main.tscn` - Main game scene ⭐
  - `Territory.tscn` - Territory template
  - Dialog scenes

- **📁 scripts/**: `.gd` files (GDScript code/game logic)
  - `Main.gd` - Main controller ⭐
  - `GameState.gd` - Game data storage
  - Manager scripts

- **📁 resources/**: `.json` data files
  - `map_data.json` - 42 territories & connections
  - `continents.json` - 6 continents & bonuses

- **📁 assets/**: Images, sounds, fonts (empty for now)

**What you can do**:
- Double-click `.tscn` → Opens scene
- Double-click `.gd` → Opens script
- Right-click → Create, rename, delete

### **3. Inspector (Right Panel)**
Shows properties of selected node

**Example**: Click "TurnLabel" in Scene Tree:
- Node properties: Name, Transform, Visibility
- Label properties: Text, Font, Colors
- Script section (if attached)

**What you can do**:
- Change properties by clicking
- Changes apply immediately
- Ctrl+S to save

### **4. Main Viewport (Center)**
Visual editor for scene editing

**3 modes** (tabs at top):
- **2D**: For 2D games (your Risk game)
- **3D**: For 3D games (unused)
- **Script**: Code editor

**What you can do**:
- Drag nodes to position
- Zoom: Scroll wheel
- Pan: Middle mouse + drag, or Space + left mouse

### **5. Bottom Panel (Output/Debugger)**

**Important tabs**:
- **Output**: Shows `print()` statements
  - Look here when running to see debug messages
  - Example: "=== Risk Game MVP - Godot Edition ==="

- **Debugger**: Shows errors/warnings
  - Red text = errors (game-breaking)
  - Yellow text = warnings

---

## 📝 **STEP 5: NAVIGATING AND EDITING CODE**

### **Opening the Script Editor**

**Method 1**: Double-click `.gd` file in FileSystem
**Method 2**: Select node → Inspector → Click script
**Method 3**: Click "Script" tab at top of viewport

### **Understanding GDScript Code**

Let's look at `Main.gd`:

```gdscript
extends Node  # This file creates a "Node" object

# Variables (storage containers)
var game_state: GameState
var phase_manager: PhaseManager

# Runs when game starts
func _ready():
    print("=== Risk Game MVP ===")
    initialize_managers()
    initialize_game()

# Creates game managers
func initialize_managers():
    game_state = GameState.new()
    # ... more setup
```

**Key concepts**:
- `#` = Comment (explanation, not code)
- `func` = Function (code block that does something)
- `var` = Variable (stores data)
- `func _ready()` = Auto-runs when scene starts

### **Making Your First Edit**

Change the startup message:

1. **Open `Main.gd`**
2. **Find line 33**:
   ```gdscript
   print("=== Risk Game MVP - Godot Edition ===")
   ```
3. **Change text**:
   ```gdscript
   print("=== Welcome to My Risk Game! ===")
   ```
4. **Save**: Ctrl+S
5. **Run**: F5
6. **Check Output panel**: See your new message!

### **Common Editing Tasks**

**Change number of players** (`Main.gd`):
```gdscript
# Line 28:
var test_players = ["Red Player", "Blue Player", "Green Player", "Yellow Player"]

# Line 29 - add color:
var test_colors = {
    "Red Player": Color.RED,
    "Blue Player": Color.BLUE,
    "Green Player": Color.GREEN,
    "Yellow Player": Color.YELLOW
}
```

**Change reinforcements** (`GameState.gd` ~line 140):
```gdscript
# Change minimum from 1 to 3:
var base_reinforcement = max(3, int(floor(territory_count / 3.0)))
```

---

## 🎨 **STEP 6: EDITING SCENES (VISUAL)**

### **Opening a Scene**
1. FileSystem → `scenes/`
2. Double-click `Main.tscn`
3. Scene Tree and Viewport show that scene

### **Editing UI Elements**

Change "End Phase" button text:

1. **Open `Main.tscn`**
2. **Scene Tree**: Main → UIOverlay → Panel → VBox → EndPhaseButton
3. **Click "EndPhaseButton"**
4. **Inspector** → "Text" property
5. **Change** from "End Phase" to "Next Phase"
6. **Save**: Ctrl+S
7. **Run**: F5 - button now says "Next Phase"!

### **Moving UI Elements**

1. **Select node** (e.g., "Panel")
2. **Viewport**: See blue outline
3. **Drag outline** to move
4. Or change Inspector → Layout → Position

### **Changing Colors**

Change UI panel background:

1. **Select "Panel"**
2. **Inspector** → Theme Overrides → Styles → Panel
3. **Dropdown** → "New StyleBoxFlat"
4. **Click StyleBoxFlat**
5. **Change "Bg Color"**

---

## ⚠️ **COMMON BEGINNER MISTAKES**

### **1. Not Saving Changes**
- ❌ Edit → Run → No changes
- ✅ **Always Ctrl+S after changes**

### **2. Editing Wrong File**
- ❌ Change `Territory.tscn` expecting instant effect
- ✅ Understand: It's a template, instances created at runtime

### **3. Deleting Important Nodes**
- ❌ Delete "UIOverlay" → Crash
- ✅ **Ctrl+Z to undo**

### **4. Running Wrong Scene**
- ❌ F5 while viewing `Territory.tscn`
- ✅ Ensure `Main.tscn` is main scene (Project → Project Settings)

### **5. Ignoring Errors**
- ❌ See red text → Ignore
- ✅ **Read errors! They show line numbers**

### **6. Wrong Godot Version**
- ❌ Download Godot 3.x
- ✅ **Must use Godot 4.3+**

---

## 🔍 **TESTING THE GAME WORKS**

### **Startup Phase Test**
1. Run (F5)
2. Click territories matching player color
3. Watch army numbers increase
4. Notice auto player switching
5. **Expected**: Smooth transition through all players

### **Reinforcement Phase Test**
1. Check "Phase: Reinforcement"
2. See "Remaining Armies: X"
3. Click territories to deploy
4. **Expected**: Can't advance until all placed

### **Attack Phase Test** (Console MVP)
1. Click your territory (2+ armies)
2. Click adjacent enemy
3. **Check Output panel** for battle log
4. Currently requires console commands

### **End Phase Button Test**
1. Click "End Phase" or SPACE
2. **Expected**: Advances phase or next player

### **Victory Test**
1. Play through or edit `GameState.gd` to test
2. **Expected**: "Player X WINS!" message

---

## 🐛 **TROUBLESHOOTING**

### **Game Won't Start**

**Problem**: F5 → Nothing/error
**Solutions**:
1. Check **Debugger panel** for red errors
2. Common: "Invalid main scene" → Set `Main.tscn` as main
3. Check **Output panel** for line numbers

**Problem**: "Script error: Parse error"
**Solution**:
- Typo in `.gd` file
- Error shows exact file and line
- Look for missing `:`, mismatched `"`, wrong indentation

### **Territories Not Clickable**

**Already Fixed**: Recent update added `input_pickable = true` to `Territory.tscn`

If still broken:
1. Open `Territory.tscn`
2. Check Area2D → Inspector → input_pickable = true
3. Check CollisionShape2D has shape set

### **Save Game Location**

Windows: `C:\Users\mchld\AppData\Roaming\Godot\app_userdata\Risk Game MVP\risk_save.json`

**To view**:
1. Press `Windows Key + R`
2. Type `%APPDATA%\Godot\app_userdata`
3. Enter → Open "Risk Game MVP" folder

### **Common Errors**

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid call" | Function doesn't exist | Check spelling/existence |
| "Parser Error: Expected '('" | Missing parenthesis | Find line, add `(` or `)` |
| "Identifier not declared" | Variable doesn't exist | Check spelling/declaration |
| "Invalid get index" | Array/dict item missing | Check key exists first |

---

## 💡 **EXPLORING THE CODE**

### **Where to Start Reading**

**Recommended order**:

1. **`Main.gd`** (scripts/Main.gd)
   - Entry point, easiest to understand
   - Shows connections
   - ~272 lines, well-commented

2. **`GameState.gd`**
   - Game data storage
   - Territory structure
   - ~350 lines

3. **`PhaseManager.gd`**
   - Turn phase logic
   - Validation
   - ~200 lines

4. **`map_data.json`**
   - All 42 territories
   - Neighbor connections
   - Easy JSON format

### **Using Search**

1. **Ctrl+F**: Search current file
2. **Ctrl+Shift+F**: Search ALL files
   - Example: Search "calculate_reinforcements"

### **Understanding Signals**

Signals = communication between code:

```gdscript
# DEFINE signal
signal state_changed()

# EMIT signal (send message)
emit_signal("state_changed")

# CONNECT to signal (listen)
game_state.state_changed.connect(_on_state_changed)

# RESPOND to signal
func _on_state_changed():
    print("State changed!")
```

### **Following Game Flow**

**When you click territory**:

1. `Territory.gd` → `_on_territory_clicked()` → Emits signal
2. `Main.gd` → `_on_territory_clicked()` → Receives signal
3. Calls `turn_manager.handle_territory_click()`
4. `TurnManager.gd` → Routes to phase handler
5. Manager updates `GameState`
6. `GameState` → Emits `state_changed`
7. `Main.gd` → Updates UI
8. You see result!

---

## 📚 **LEARNING RESOURCES**

### **Official Godot**
- Tutorial: https://docs.godotengine.org/en/stable/getting_started/
- GDScript: https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/
- Built-in Help: F1 in Godot

### **Your Project Docs**
Read in order:
1. `QUICK_REFERENCE.md` - Controls & phases
2. `GETTING_STARTED.md` - Game overview
3. `README.md` - Usage details
4. `IMPLEMENTATION_NOTES.md` - Technical docs

### **Video Tutorials**
Search YouTube: "Godot 4 Tutorial for Beginners"
Channels: Brackeys, GDQuest, HeartBeast

---

## 🎯 **YOUR FIRST MODIFICATIONS**

### **Easy (10 minutes)**

1. **Change player names**:
   - `Main.gd` line 28
   - Change "Red Player" to your name
   - F5 to see!

2. **Change button text**:
   - `Main.tscn`
   - Select "EndPhaseButton"
   - Inspector → Text

3. **Change window title**:
   - Project → Project Settings
   - Application → Config → Name

### **Medium (30 minutes)**

1. **Add 4th player**:
   - `Main.gd` line 28: Add "Yellow Player"
   - Line 29: Add color
   - Save & run

2. **Change reinforcement min**:
   - `GameState.gd`
   - Find `calculate_reinforcements`
   - Change `max(1, ...)` to `max(3, ...)`

3. **Make territories bigger**:
   - `Main.gd` ~line 82
   - `territory_size = Vector2(150, 100)`

### **Advanced (1+ hour)**

1. **Connect BattleDialog**:
   - Study `BattleDialog.gd`
   - Connect signals in `Main.gd`
   - Replace console combat

2. **Add sound effects**:
   - Download free sounds
   - Put in `assets/audio/`
   - Create AudioStreamPlayer nodes

3. **Replace colored rectangles**:
   - Create territory shapes
   - Use Polygon2D or SVG
   - Replace ColorRect in `Territory.tscn`

---

## 🚀 **WINDOWS-SPECIFIC NOTES**

### **File Paths**
- Backslashes: `C:\Users\...`
- Or forward: `C:/Users/...` (both work)

### **Antivirus**
- Windows Defender might scan first run
- Normal - Godot is safe
- If blocked: "More info" → "Run anyway"

### **File Extensions**
- Show extensions in File Explorer
- View → Show → File name extensions
- Helps distinguish `.gd` from `.tscn`

### **Performance**
- OneDrive folders can be slower
- Consider moving to local folder if sluggish
- Current: `\OneDrive\Desktop\OOO\Risk\`

### **Keyboard Shortcuts**
- F5: Run project
- F6: Run current scene
- F8: Stop game
- Ctrl+S: Save
- Ctrl+Z: Undo
- Ctrl+Y: Redo
- Ctrl+D: Duplicate

---

## ✅ **SETUP VERIFICATION CHECKLIST**

Before modifying, verify:

- [ ] Godot 4.3+ downloaded and runs
- [ ] MVP_GODOT imported successfully
- [ ] `Main.tscn` opens without errors
- [ ] F5 starts game without errors
- [ ] Can see 42 colored territories
- [ ] Can click territories to place armies
- [ ] UI panel shows game info
- [ ] "End Phase" button works
- [ ] See print statements in Output
- [ ] Game advances through phases
- [ ] Can stop with F8

**All checked? You're ready! 🎉**

---

## 🔜 **WHAT TO DO NEXT**

### **Option 1: Play and Learn**
- Play full game
- Observe phase mechanics
- Check Output panel
- Try to win!

### **Option 2: Make Small Changes**
- Change player names
- Change colors
- Run and see results

### **Option 3: Study Code**
- Read `Main.gd` (well-commented)
- Add `print()` statements
- Use Ctrl+Shift+F to search

### **Option 4: Visual Changes**
- Experiment with UI
- Change button text
- Move elements
- Change colors

### **Option 5: Connect Battle System**
- Study `BattleDialog.tscn`
- Read `BattleDialog.gd`
- Connect in `Main.gd`
- Replace console combat

---

## 📞 **GETTING HELP**

### **In Godot**
- F1: Help browser
- Right-click function → "Lookup Symbol"
- Inspector: Hover properties for tooltips

### **Error Messages**
- Read carefully - they show exact problems
- Copy/paste into Google with "Godot 4"
- Check line numbers

### **Online**
- Official Docs: https://docs.godotengine.org/
- Godot Q&A: https://ask.godotengine.org/
- Discord: Godot Engine official
- Reddit: r/godot

### **Your Project Docs**
Everything needed is already written:
- `QUICK_REFERENCE.md`
- `GETTING_STARTED.md`
- `README.md`
- Code comments in `.gd` files

---

## 🎓 **SUMMARY**

**You now know how to**:
1. ✅ Download/install Godot 4.3+
2. ✅ Import Risk game project
3. ✅ Navigate Godot editor
4. ✅ Run and test game
5. ✅ Open and read code
6. ✅ Edit scenes and UI
7. ✅ Make simple modifications
8. ✅ Troubleshoot errors
9. ✅ Find help
10. ✅ Understand project structure

**Key Takeaways**:
- Godot is just a tool (like Word for games)
- Scenes are blueprints
- Scripts are instructions
- Editor is safe (Ctrl+Z undoes)
- F5 runs, F8 stops
- Ctrl+S saves often!
- Errors are helpful
- Documentation exists!

**You're ready to**:
- Explore and modify Risk game
- Learn GDScript
- Build new features
- Have fun!

---

**Welcome to game development! 🎮✨**
