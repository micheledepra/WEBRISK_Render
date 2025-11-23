# Quick Start Guide - Multiplayer Turn-Based System

## 🚀 Quick Test (5 Minutes)

### Prerequisites
- Node.js installed
- Two browser tabs ready

### Step 1: Start the Server
```powershell
cd c:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\multiplayer\server
npm install  # If not already done
node server.js
```

Expected output:
```
🚀 Server running on http://localhost:3000
🎮 GameEngine initialized
✅ Server ready for multiplayer sessions
```

### Step 2: Open Lobby (Tab 1)
```
http://localhost:3000/multiplayer-lobby.html
```

1. Create a new session (generates session code like `ABC123`)
2. Add 2 players (e.g., "Red Empire", "Blue Kingdom")
3. Select colors for each player
4. Click "Start Game"

### Step 3: Game Loads (Tab 1)
- Automatically navigates to `game.html?session=ABC123`
- Connects to WebSocket server
- Sends initialization request
- Receives deterministic territory assignment

**Check Console:**
```
🌐 MULTIPLAYER: Initializing WebSocket client...
✅ Connected to multiplayer server
📤 Game initialization request sent to server
🎮 Game initialized on server
✅ State synced: Turn 1, Phase: startup
```

### Step 4: Open Same Session (Tab 2)
```
http://localhost:3000/game.html?session=ABC123
```

**Critical Check:** Both tabs should show:
- ✅ **Identical territory owners**
- ✅ **Same army counts**
- ✅ **Same colors**

### Step 5: Test Turn-Based Interaction

#### Tab 1 (Red's Turn):
1. Click on a red territory
2. Deploy armies
3. **Tab 1**: See immediate update
4. **Tab 2**: See update in real-time

#### Tab 2 (Blue's Turn - after Red advances phase):
- Should show "Waiting for Turn" overlay
- Cannot click territories (blocked)
- Sees Red's actions in real-time

### Step 6: Test State Persistence
1. Make a few moves
2. Refresh Tab 1 (`Ctrl+R` or `F5`)
3. Game should restore from Firebase
4. State matches Tab 2 exactly

---

## 🧪 Detailed Test Scenarios

### Test 1: Territory Assignment Consistency
**Goal:** Verify both clients get identical territory distribution

1. Open Tab 1: `game.html?session=TEST1`
2. Open Tab 2: `game.html?session=TEST1`
3. Compare territory owners

**Expected:**
```
Tab 1: alaska → Red, kamchatka → Blue, ...
Tab 2: alaska → Red, kamchatka → Blue, ...  ✅ IDENTICAL
```

**Failure Case:** Territories differ → Seed not being used

---

### Test 2: Real-Time Deployment Sync
**Goal:** Verify army deployments broadcast to all clients

**Tab 1 (Red's turn):**
1. Check alaska has 3 armies
2. Deploy 2 more armies
3. Alaska should now have 5 armies

**Tab 2 (observing):**
- Should immediately update to 5 armies without refresh
- Console shows: `🔄 Game state update received`

**Expected Console (Both Tabs):**
```
📤 Sending game:deploy
✅ Deployment successful
🔄 Synchronizing local state with server
   ✅ State synced: Turn 1, Phase: startup
```

---

### Test 3: Turn-Based Blocking
**Goal:** Verify only current player can interact

**Setup:** Red's turn in startup phase

**Tab 1 (Red's client):**
- Can click territories ✅
- Can deploy armies ✅
- Can see reinforcement panel ✅

**Tab 2 (Blue's client):**
- Sees "Waiting for Turn" overlay ✅
- Cannot click territories (blocked by overlay) ✅
- Sees current player: "Red Empire" ✅

**Test Action from Tab 2:**
Try to click territory → Should not register (overlay blocks it)

---

### Test 4: Phase Advancement Sync
**Goal:** Verify phase changes broadcast correctly

**Tab 1:**
1. Deploy all remaining armies
2. Click "Next Phase" button
3. Phase changes: `startup → reinforcement`

**Both Tabs Should:**
- Update phase immediately
- Update turn management UI
- Show phase progress bar transition
- Log: `📢 Phase changed: startup → reinforcement`

---

### Test 5: Battle Synchronization
**Goal:** Verify attack results sync across clients

**Setup:** Phase = attack

**Tab 1 (Attacker):**
1. Click attacking territory (3+ armies)
2. Click adjacent enemy territory
3. Select dice count, click attack
4. See dice roll results

**Tab 2 (Defender/Observer):**
- Sees same battle modal appear
- Sees same dice results (e.g., Attacker: [5,4,2], Defender: [6,3])
- Sees army counts update identically

**Expected Console (Both):**
```
⚔️ Battle result received
   Attacker lost: 1, Defender lost: 1
🔄 Synchronizing local state with server
```

---

### Test 6: Page Refresh Recovery
**Goal:** Verify Firebase persistence works

**Tab 1:**
1. Make several moves (deploy, attack, etc.)
2. Note current state: Turn 3, Phase: attack, Red has Alaska with 7 armies
3. Refresh page (`F5`)

**Expected:**
- Game reloads from Firebase
- Same turn number, phase, and armies
- Can continue playing seamlessly
- Console: `♻️ SAVED GAME DETECTED - Restor

ing previous session...`

---

### Test 7: Multi-Tab Concurrent Access
**Goal:** Ensure server prevents simultaneous actions

**Setup:** Red's turn

**Simultaneously on both tabs:**
- Tab 1: Deploy 3 armies to alaska
- Tab 2: Deploy 3 armies to kamchatka

**Expected:**
- Only Tab 1's action succeeds (Red controls both in current setup)
- Tab 2 gets error: `❌ Action failed: Not your turn` (if Blue's territory)
- OR both succeed if same client controls both players

---

## 🐛 Troubleshooting

### Problem: "Session not found"
**Cause:** Server restarted, session lost from memory
**Solution:** Reload lobby, create new session

### Problem: Territories don't match between tabs
**Cause:** Seed not propagating correctly
**Check:**
```javascript
// Both tabs should log same seed
console.log(window.gameState.initializationSeed); 
```
**Solution:** Ensure server logs `Seed: 1234567890` during initialization

### Problem: "Not your turn" error when it IS your turn
**Cause:** Client-player mapping mismatch
**Check:**
```javascript
console.log(window.multiplayerSession.players); // Your controlled players
console.log(window.gameState.getCurrentPlayer()); // Current active player
```
**Solution:** Verify lobby passes correct player assignments

### Problem: State doesn't sync after action
**Cause:** WebSocket disconnected
**Check:**
```javascript
console.log(window.multiplayerClient.socket.connected); // Should be true
```
**Solution:** Check server logs, ensure Socket.IO room joined

### Problem: Waiting overlay doesn't hide
**Cause:** Turn check not updating after state sync
**Solution:** 
```javascript
// Manual check in console
isMyTurn(); // Should return true when your turn
updateTurnBasedInteraction(); // Force update
```

---

## 📊 Expected Console Output

### Game Initialization (Both Tabs)
```
🎮 RISK DIGITAL - GAME INITIALIZATION
════════════════════════════════════════════════
📍 Game Mode: 🌐 MULTIPLAYER
   Session Code: ABC123

🌐 Loading MULTIPLAYER player data from sessionStorage...
   ✅ Loaded 2 players from sessionStorage
   👥 Players: Red Empire, Blue Kingdom
   🎨 Colors: #ff0000, #0000ff

🌐 MULTIPLAYER: Initializing WebSocket client...
   User ID: Red Empire
   Client ID: socket-xyz-123
   Controlling Players: Red Empire, Blue Kingdom

✅ Multiplayer client initialized and event handlers registered

🎯 Initializing RiskUI...
✅ RiskUI initialized in MULTIPLAYER mode

🌐 MULTIPLAYER: Requesting server-side game initialization...
✅ Connected to multiplayer server
📤 Game initialization request sent to server

🎮 Game initialized on server: {success: true, gameState: {...}, seed: 1704123456}
🔄 Synchronizing local state with server...
   ✅ State synced: Turn 1, Phase: startup
   Current player: Red Empire

🎮 Turn check: YOUR TURN
✅ UI updated across all components
```

### Server Console
```
🎮 Server: Initializing game for session ABC123
   👥 Players: Red Empire, Blue Kingdom
   🎲 Seed: 1704123456789

🎲 Server: Initializing territories (seed: 1704123456789)
   Red Empire: 21 territories, 19 armies remaining
   Blue Kingdom: 21 territories, 19 armies remaining
✅ Server: Territory initialization complete

✅ Game initialized for session ABC123
   Players: Red Empire, Blue Kingdom
   Seed: 1704123456789
   Client-Player Mapping: { 'socket-xyz': ['Red Empire', 'Blue Kingdom'] }
   💾 Persisted to Firebase
```

### Deployment Action
```
CLIENT:
📤 Sending game:deploy: {sessionCode: 'ABC123', userId: 'Red Empire', territoryId: 'alaska', armyCount: 3}

SERVER:
🪖 Deploy request: Red Empire → alaska (3 armies) [client: socket-xyz]
✅ Server: Red Empire deployed 3 to alaska
   Territory now has 6 armies
   Player has 16 armies remaining
✅ Deployment successful, state broadcasted to ABC123

BOTH CLIENTS:
🔄 Game state update received: {action: {type: 'deploy', player: 'Red Empire', ...}}
🔄 Synchronizing local state with server...
   ✅ State synced: Turn 1, Phase: startup
✅ UI updated across all components
```

---

## ✅ Success Criteria

Your implementation is working correctly if:

- [ ] Both tabs show **identical** territory assignments on load
- [ ] Actions in Tab 1 **immediately** appear in Tab 2 (< 100ms)
- [ ] Only current player's tab allows interaction (others see overlay)
- [ ] Page refresh restores game state from Firebase
- [ ] Console shows no errors or warnings
- [ ] Server logs show all broadcasts: `✅ ... broadcasted to ABC123`
- [ ] Phase changes sync across all tabs
- [ ] Battle results (dice rolls) are identical in both tabs
- [ ] Turn advancement switches active client correctly

---

## 🎓 Advanced Testing

### Test with 3+ Browser Tabs
```
Tab 1: localhost:3000/game.html?session=ABC
Tab 2: localhost:3000/game.html?session=ABC  
Tab 3: localhost:3000/game.html?session=ABC
```
All should show identical state at all times.

### Test with Different Browsers
- Chrome Tab: Player 1's client
- Firefox Tab: Player 2's client
- Verify state sync works cross-browser

### Test Network Latency
- Use browser DevTools → Network → Throttling → Slow 3G
- Verify state still syncs (may be delayed)

### Test Server Restart Mid-Game
1. Play a few turns
2. Stop server (`Ctrl+C`)
3. Restart server (`node server.js`)
4. Refresh clients
5. Session should reload from Firebase

---

## 📞 Support

If you encounter issues:
1. Check server console for errors
2. Check browser console (both tabs)
3. Verify Firebase connection
4. Check `MULTIPLAYER_TURN_SYNC_IMPLEMENTATION.md` for architecture details

**Common Issue:** "game:initialized not firing"
→ Check Socket.IO connection: `multiplayerClient.socket.connected`

**Common Issue:** "Territory mismatch"
→ Check seed: `gameState.initializationSeed` should match across tabs
