# Multiplayer Data Flow - Unified Architecture

## 🎯 Core Principle
**"Randomization of territories takes place ONLY ONCE when session is started. On page refresh, territory and army situation is restored from saved state."**

---

## 📊 Data Storage Architecture

### Storage Layers (Priority Order)

#### 1. **sessionStorage** (Primary - Survives Page Navigation)
```javascript
// Set by: multiplayer/client/lobby.html on game start
// Read by: game.html on every load/refresh
sessionStorage.setItem('riskPlayers', JSON.stringify(['Alice', 'Bob', 'Charlie']))
sessionStorage.setItem('riskPlayerColors', JSON.stringify(['#ff4444', '#4444ff', '#44ff44']))
sessionStorage.setItem('numPlayers', '3')
sessionStorage.setItem('riskGameMode', 'multiplayer')
sessionStorage.setItem('riskSessionCode', 'ABC123')

// Set by: js/GameState.js on every state change
sessionStorage.setItem('risk_game_state', JSON.stringify({
  players: [...],
  territories: {...},
  currentPlayerIndex: 1,
  phase: 'attack',
  turnNumber: 5,
  isNewGame: false  // CRITICAL: Prevents re-randomization
}))
```

**Lifespan**: Until tab/window closes
**Purpose**: Primary game state and player data

#### 2. **localStorage** (Backup - Survives Browser Restart)
```javascript
// Set by: lobby.html for reconnection
localStorage.setItem('riskPlayers', JSON.stringify([...]))
localStorage.setItem('riskPlayerColors', JSON.stringify([...]))
localStorage.setItem('riskGameMode', 'multiplayer')
localStorage.setItem('multiplayerSession', 'ABC123')
localStorage.setItem('multiplayerPlayerIndex', '0')
localStorage.setItem('multiplayerUserId', 'user_xyz')
```

**Lifespan**: Permanent (until cleared)
**Purpose**: Reconnection after browser restart, cross-tab awareness

#### 3. **URL Parameters** (Tertiary - Direct Links)
```
game.html?session=ABC123&players=3&player1=Alice&color1=%23ff4444&player2=Bob&color2=%234444ff&player3=Charlie&color3=%2344ff44
```

**Lifespan**: Single page load
**Purpose**: Direct game links, fallback if storage cleared

---

## 🔄 Complete Data Flow

### Phase 1: Game Start (Lobby → Game)

```
┌─────────────────────────────────────────────────────────────┐
│  1. LOBBY: User creates/joins session                       │
│     - Server assigns players                                │
│     - Each player gets name + color                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. LOBBY: On 'gameStarting' event                          │
│     ✅ Store in sessionStorage:                             │
│        - riskPlayers (array of names)                       │
│        - riskPlayerColors (array of hex colors)             │
│        - numPlayers (count)                                 │
│        - riskGameMode = 'multiplayer'                       │
│        - riskSessionCode = session code                     │
│                                                             │
│     ✅ Backup to localStorage:                              │
│        - Same keys for reconnection                         │
│                                                             │
│     ✅ Build URL with all player data                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. REDIRECT: window.location.href = game.html?session=...  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. GAME.HTML: DOMContentLoaded fires                       │
│     - Detect mode: isMultiplayer = !!urlParams.get('session')│
│     - Load players from sessionStorage.riskPlayers          │
│     - Load colors from sessionStorage.riskPlayerColors      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. GAMESTATE.JS: Constructor                               │
│     ❓ Check: GameState.loadFromSession()                   │
│                                                             │
│     IF saved state exists (risk_game_state):               │
│       ✅ Restore all properties                             │
│       ✅ Set isNewGame = false                              │
│       ✅ SKIP assignTerritoriesRandomly()                   │
│       ✅ RETURN (territories preserved!)                    │
│                                                             │
│     ELSE (first time):                                     │
│       ✅ Initialize empty territories                       │
│       ✅ Set isNewGame = true                               │
│       ✅ CONTINUE to randomization                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  6. TERRITORY ASSIGNMENT (ONLY if isNewGame = true)         │
│     - assignTerritoriesRandomly() runs                      │
│     - Each territory assigned to random player              │
│     - Initial armies placed                                 │
│     - saveToSession() called → stores in risk_game_state    │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Page Refresh (Territory Persistence)

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER: Presses F5 or refreshes page                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. GAME.HTML: DOMContentLoaded fires AGAIN                 │
│     - Detect mode: Still multiplayer (session param exists) │
│     - Load players from sessionStorage.riskPlayers          │
│       (SAME data as before - still in sessionStorage!)      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. GAMESTATE.JS: Constructor runs AGAIN                    │
│     ✅ Check: GameState.loadFromSession()                   │
│     ✅ FOUND: risk_game_state exists!                       │
│                                                             │
│     Restored data:                                         │
│       - territories: { Indonesia: {owner: "Alice", armies: 5} }│
│       - currentPlayerIndex: 2                              │
│       - phase: "attack"                                    │
│       - turnNumber: 8                                      │
│       - isNewGame: false  ⚠️ CRITICAL FLAG                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. TERRITORY ASSIGNMENT: assignTerritoriesRandomly()       │
│     ❌ BLOCKED by guard condition:                          │
│                                                             │
│     if (this.isNewGame === false || hasOwners) {           │
│       console.log('Territories already assigned');         │
│       return; // EXIT - NO RANDOMIZATION                   │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RESULT: Game continues from exact same state            │
│     ✅ Same territories                                     │
│     ✅ Same army counts                                     │
│     ✅ Same turn/phase                                      │
│     ✅ Same current player                                  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Game State Updates (Auto-Save)

```
┌─────────────────────────────────────────────────────────────┐
│  ANY GAME ACTION:                                           │
│  - Deploy armies (ReinforcementManager)                     │
│  - Attack territory (CombatUI)                              │
│  - Fortify position (FortificationManager)                  │
│  - End turn (TurnManager)                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  AUTO-SAVE TRIGGER:                                         │
│    this.gameState.saveToSession()                           │
│                                                             │
│  Saves to: sessionStorage.risk_game_state                   │
│  Includes: territories, armies, phase, turn, isNewGame=false│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Consistency Guarantees

### ✅ Single Player vs Multiplayer Separation

**Single Player:**
- Player data: `sessionStorage.riskPlayers`
- Mode flag: `sessionStorage.riskGameMode = 'singleplayer'`
- Game state: `sessionStorage.risk_game_state`

**Multiplayer:**
- Player data: `sessionStorage.riskPlayers` (SAME KEY!)
- Mode flag: `sessionStorage.riskGameMode = 'multiplayer'`
- Session code: `sessionStorage.riskSessionCode = 'ABC123'`
- Game state: `sessionStorage.risk_game_state` (SAME KEY!)

**Separation mechanism:**
- Mode detected by URL parameter: `?session=ABC123`
- No URL session param = single player
- Has session param = multiplayer
- Dashboard reads `riskGameMode` to determine which mode was last played

### ✅ Territory Randomization Control

**First Load (isNewGame = true):**
```javascript
constructor() {
  // No saved state found
  this.isNewGame = true;
  // ... initialization ...
  this.assignTerritoriesRandomly(); // ✅ RUNS
}
```

**After Refresh (isNewGame = false):**
```javascript
constructor() {
  const savedState = GameState.loadFromSession();
  if (savedState) {
    this.isNewGame = false; // ✅ RESTORED FROM SAVE
    return; // Skip initialization
  }
}

assignTerritoriesRandomly() {
  if (this.isNewGame === false) {
    return; // ❌ BLOCKED - Territories preserved
  }
}
```

### ✅ Cross-Tab Consistency (Multiplayer)

**Problem**: Player opens game in 2 tabs - should see same state

**Solution**:
1. Both tabs load from `sessionStorage.risk_game_state`
2. Each action saves to sessionStorage
3. Tabs stay in sync through shared storage

**Note**: Real-time sync requires server integration (future enhancement)

---

## 🧪 Testing Checklist

### Test 1: Initial Territory Assignment
- [ ] Start multiplayer game
- [ ] Verify territories are randomized
- [ ] Each player has territories
- [ ] Army counts correct

### Test 2: Refresh Persistence
- [ ] During game, press F5
- [ ] Verify same territories
- [ ] Verify same army counts
- [ ] Verify same phase/turn
- [ ] Current player unchanged

### Test 3: Mode Separation
- [ ] Play single player game
- [ ] Save state exists
- [ ] Start multiplayer game
- [ ] Verify NO territory overlap
- [ ] Each mode has independent state

### Test 4: Reconnection
- [ ] Start multiplayer game
- [ ] Close browser completely
- [ ] Reopen same URL
- [ ] Check if localStorage helps reconnect

### Test 5: Auto-Save Verification
- [ ] Deploy armies → check sessionStorage
- [ ] Attack territory → check sessionStorage
- [ ] Fortify → check sessionStorage
- [ ] End turn → check sessionStorage
- [ ] Each action should save state

---

## 🐛 Debugging Commands

### Check Current State
```javascript
// In browser console:

// View player data
JSON.parse(sessionStorage.getItem('riskPlayers'))
JSON.parse(sessionStorage.getItem('riskPlayerColors'))

// View game state
JSON.parse(sessionStorage.getItem('risk_game_state'))

// Check if game is new
const state = JSON.parse(sessionStorage.getItem('risk_game_state'));
console.log('Is new game?', state?.isNewGame);

// Count territories with owners
const state = JSON.parse(sessionStorage.getItem('risk_game_state'));
const owned = Object.values(state.territories).filter(t => t.owner).length;
console.log('Territories with owners:', owned);
```

### Force Clear State
```javascript
// Clear game state (will trigger re-randomization)
sessionStorage.removeItem('risk_game_state');

// Clear player data
sessionStorage.removeItem('riskPlayers');
sessionStorage.removeItem('riskPlayerColors');

// Clear everything
sessionStorage.clear();
```

### Test Territory Persistence
```javascript
// Before refresh
const before = JSON.parse(sessionStorage.getItem('risk_game_state')).territories;
console.log('Before refresh:', before['indonesia']);

// After refresh (manually reload page)
const after = JSON.parse(sessionStorage.getItem('risk_game_state')).territories;
console.log('After refresh:', after['indonesia']);

// Should be IDENTICAL
console.log('Match:', JSON.stringify(before['indonesia']) === JSON.stringify(after['indonesia']));
```

---

## 📝 Summary

**Problem Solved**: Territories were re-randomizing on every refresh
**Root Cause**: `isNewGame` flag not being preserved through save/restore cycle
**Solution**: 
1. Save `isNewGame: false` in every state save
2. Restore `isNewGame` in constructor
3. Guard `assignTerritoriesRandomly()` with `isNewGame` check

**Data Flow Consistency**:
- Lobby stores player data in sessionStorage
- game.html reads from sessionStorage (survives refresh)
- GameState stores game progress in risk_game_state (survives refresh)
- All refreshes load from saved state - territories preserved ✅
