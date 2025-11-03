# 🎮 Phase Management Debug Commands - Quick Reference

## Copy & Paste Ready Commands

Open browser console (F12) and paste these commands:

### 1. Check System Status

```javascript
phaseDebug.state();
```

**What it shows**: Current phase in all 4 systems (GameState, TurnManager, PhaseManager, PhaseSynchronizer)
**Why use it**: Verify all systems are showing the same phase

---

### 2. Verify All Systems Synchronized

```javascript
phaseDebug.sync();
```

**What it shows**: Synchronization status check across all 4 systems
**Why use it**: Ensure no desynchronization issues
**Expected**: `✅ ALL SYSTEMS SYNCHRONIZED`

---

### 3. Advance to Next Phase (Testing)

```javascript
phaseDebug.nextPhase();
```

**What it shows**: Phase transitions from current phase to next
**Why use it**: Test phase advancement without clicking buttons
**Can use**: As many times as needed for testing

---

### 4. Skip Current Phase (Optional Phases Only)

```javascript
phaseDebug.skip();
```

**What it shows**: Skips current phase if allowed (attack/fortify only)
**Why use it**: Test skipping optional phases
**Works for**: Attack and Fortify phases only

---

### 5. View Phase Transition History

```javascript
phaseDebug.history();
```

**What it shows**: Last 10 phase transitions with timestamps
**Why use it**: Verify phase sequence is correct
**Format**: Shows time, old phase, new phase for each transition

---

## All Commands in Sequence (Full Test)

Copy and paste this entire block to run all tests at once:

```javascript
// 1. Initial state check
console.log("%c=== INITIAL STATE ===", "color: blue; font-weight: bold");
phaseDebug.state();

// 2. Verify sync
console.log("%c=== SYNC CHECK ===", "color: blue; font-weight: bold");
phaseDebug.sync();

// 3. Advance phase
console.log("%c=== ADVANCE PHASE ===", "color: blue; font-weight: bold");
phaseDebug.nextPhase();

// 4. Check new state
console.log("%c=== NEW STATE ===", "color: blue; font-weight: bold");
phaseDebug.state();

// 5. View history
console.log("%c=== HISTORY ===", "color: blue; font-weight: bold");
phaseDebug.history();
```

---

## Individual Tests

### Test 1: Initial Verification (Run on Game Load)

```javascript
phaseDebug.state();
```

✅ Should show: All systems = "deploy", Turn = 1, Player = 0

---

### Test 2: Click End-Turn, Then Check

```javascript
// 1. Click "End Turn" button manually
// 2. Then run:
phaseDebug.state();
phaseDebug.sync();
```

✅ Should show: All systems = "reinforce"
✅ Should show: ALL SYSTEMS SYNCHRONIZED

---

### Test 3: Phase Sequence (Deploy → Reinforce → Attack → Fortify)

```javascript
phaseDebug.nextPhase(); // deploy → reinforce
phaseDebug.state();
phaseDebug.nextPhase(); // reinforce → attack
phaseDebug.state();
phaseDebug.nextPhase(); // attack → fortify
phaseDebug.state();
phaseDebug.nextPhase(); // fortify → deploy
phaseDebug.state();
```

✅ Should see: Phase progresses through all 4 phases
✅ Should see: All systems always synchronized

---

### Test 4: History Tracking

```javascript
phaseDebug.nextPhase();
phaseDebug.nextPhase();
phaseDebug.nextPhase();
phaseDebug.history(); // Shows all 3 transitions
```

✅ Should show: 3 entries with timestamps and phase transitions

---

### Test 5: Skip Optional Phase

```javascript
// First get to attack phase
phaseDebug.nextPhase();
phaseDebug.nextPhase();
phaseDebug.state(); // Should show: attack

// Now skip it
phaseDebug.skip(); // Skip attack → fortify
phaseDebug.state(); // Should show: fortify
```

✅ Should see: attack → fortify transition skipped properly

---

### Test 6: Full Game Cycle

```javascript
// Run through one complete cycle
phaseDebug.nextPhase();
phaseDebug.state();
phaseDebug.nextPhase();
phaseDebug.state();
phaseDebug.nextPhase();
phaseDebug.state();
phaseDebug.nextPhase();
phaseDebug.state();
// Should be back at deploy phase
```

✅ Should see: deploy → reinforce → attack → fortify → deploy

---

### Test 7: Continuous Monitoring

```javascript
// Watch the console as you play normally
// Click "End Turn" button in game
// Console should show: ✅ Phase advanced: oldPhase → newPhase
// Then run:
phaseDebug.state();
```

✅ Should see: All systems synchronized with correct phase

---

## Expected Console Output Examples

### When All Working Correctly ✅

```
📊 PHASE MANAGEMENT STATE:
================================
GameState:       Phase=attack, Turn=1, Player=0
TurnManager:     Phase=attack, Turn=1
PhaseManager:    Phase=attack
PhaseSynchronizer: Phase=attack
================================

🔍 SYNCHRONIZATION CHECK:
✅ gameState: attack
✅ turnManager: attack
✅ phaseManager: attack
✅ synchronizer: attack
✅ ALL SYSTEMS SYNCHRONIZED
```

### When Phases Advancing ✅

```
⏭️ Advancing to next phase...
✅ Phase advanced: attack → fortify
```

### When Viewing History ✅

```
📜 PHASE TRANSITION HISTORY:
1. 14:32:45: deploy → reinforce
2. 14:33:12: reinforce → attack
3. 14:33:45: attack → fortify
```

---

## Troubleshooting Commands

### If phaseDebug not working:

```javascript
// Check if it exists
window.phaseDebug;

// If undefined, wait and try again:
setTimeout(() => phaseDebug.state(), 3000);
```

### If commands return errors:

```javascript
// Check if systems initialized
window.riskUI;
window.riskUI.phaseSynchronizer;
window.riskUI.gameState;
```

### If desynchronized (⚠️ rare):

```javascript
// Check what's different
phaseDebug.state();
phaseDebug.sync();

// Refresh page
location.reload();

// Verify after reload
phaseDebug.state();
```

---

## Command Cheat Sheet

| Command                  | Does What                         | When to Use                  |
| ------------------------ | --------------------------------- | ---------------------------- |
| `phaseDebug.state()`     | Show current phase in all systems | Verify systems aligned       |
| `phaseDebug.sync()`      | Check synchronization             | Ensure no desync issues      |
| `phaseDebug.nextPhase()` | Advance to next phase             | Test without clicking button |
| `phaseDebug.skip()`      | Skip optional phase               | Test skipping attack/fortify |
| `phaseDebug.history()`   | Show last 10 transitions          | Verify phase sequence        |

---

## Success Indicators ✅

Look for these in console output:

✅ `✅ ALL SYSTEMS SYNCHRONIZED`
✅ All 4 systems show same phase
✅ `✅ Phase advanced: oldPhase → newPhase`
✅ Timestamps in history
✅ No error messages or warnings

---

## Common Patterns

### Pattern 1: Verify Game Started Correctly

```javascript
phaseDebug.state(); // Check initial state
```

Expected: Phase=deploy, Turn=1

---

### Pattern 2: Test Phase Advancement

```javascript
phaseDebug.nextPhase(); // Advance
phaseDebug.state(); // Check
phaseDebug.sync(); // Verify aligned
```

---

### Pattern 3: Debug Issue

```javascript
phaseDebug.state(); // What's the current state?
phaseDebug.sync(); // Are systems aligned?
phaseDebug.history(); // What happened recently?
```

---

### Pattern 4: Full System Check

```javascript
phaseDebug.state();
phaseDebug.sync();
phaseDebug.history();
```

---

## Keyboard Shortcuts

### Copy Commands Faster

1. Open this file on screen
2. Open browser console (F12)
3. Click command code block
4. Ctrl+C to copy
5. Ctrl+V in console to paste
6. Enter to execute

---

## Console Styling Tips

### Colored Output

```javascript
console.log("%c✅ SUCCESS", "color: green; font-weight: bold");
console.log("%c⚠️ WARNING", "color: orange; font-weight: bold");
console.log("%c❌ ERROR", "color: red; font-weight: bold");
```

### Clear Console

```javascript
clear();
```

### See All Variables

```javascript
window.riskUI;
```

---

## Remember

- 🎯 **phaseDebug.state()** - Most used command
- 🎯 **phaseDebug.sync()** - Check for desync issues
- 🎯 **phaseDebug.nextPhase()** - Test without clicking
- 🎯 **phaseDebug.history()** - See what happened
- 🎯 **phaseDebug.skip()** - Skip optional phases

---

**Tip**: Pin this file in VS Code for quick reference while testing!

_Last Updated: Today_
