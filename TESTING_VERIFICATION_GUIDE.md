# Phase Management System - Testing & Verification Guide

## ✅ Integration Status: COMPLETE

All four steps have been successfully implemented in the game. The Phase Management System is now fully integrated with:

1. ✅ **Step 1**: Verification block (game.html lines 3598-3639)
2. ✅ **Step 2**: End-turn button integration (RiskUI.js lines 674-709)
3. ✅ **Step 3**: Phase change listeners (game.html lines 3642-3687)
4. ✅ **Step 4**: Debug commands (game.html lines 3747-3838)

## Quick Start: Testing in Browser

### 1. Load the Game

```
Open game.html in your browser
Wait for console messages (should take ~2 seconds)
```

### 2. Check Console Output

You should see output like:

```
🎮 PHASE MANAGEMENT SYSTEM STATUS:
================================
✅ GameState: Phase=deploy, Turn=1
✅ TurnManager: Phase=deploy, Turn=1
✅ PhaseManager: Phase=deploy
✅ PhaseSynchronizer: Connected and ready
   - Phase history entries: 1
   - Listeners registered: 2
✅ PhaseDebugger: Available as window.gameDebugger
================================

⚙️ Setting up phase change listeners...
✅ Phase change listeners registered

🎮 Initializing Phase Management Debug Commands...
✅ Phase debug commands ready: phaseDebug.state(), phaseDebug.nextPhase(), phaseDebug.skip(), phaseDebug.history(), phaseDebug.sync()
```

### 3. Verify System in Console

Open browser Developer Tools (F12) and run:

```javascript
// Check current state across all systems
phaseDebug.state();
```

Expected output:

```
📊 PHASE MANAGEMENT STATE:
================================
GameState:       Phase=deploy, Turn=1, Player=0
TurnManager:     Phase=deploy, Turn=1
PhaseManager:    Phase=deploy
PhaseSynchronizer: Phase=deploy
================================
```

## Testing Scenarios

### Scenario 1: System Synchronization Verification

**Goal**: Verify all three systems stay synchronized

**Steps**:

1. Run `phaseDebug.state()` to check initial state
2. Click "End Turn" button
3. Run `phaseDebug.state()` again
4. Run `phaseDebug.sync()`

**Expected Results**:

- All four systems show same phase
- Console shows: `✅ ALL SYSTEMS SYNCHRONIZED`
- No console errors

```javascript
// Test command sequence
phaseDebug.state(); // Initial state
// Click End Turn button manually
phaseDebug.state(); // Verify state updated
phaseDebug.sync(); // Check synchronization
```

### Scenario 2: Phase Transition Testing

**Goal**: Verify phase transitions follow official Risk rules

**Steps**:

1. Run `phaseDebug.state()` to see current phase
2. Run `phaseDebug.nextPhase()` to advance
3. Check console for phase change message
4. Verify UI updated for new phase

**Expected Results**:

- Phase advances correctly: deploy → reinforce → attack → fortify → deploy
- Console shows: `🔄 Phase changed: oldPhase → newPhase`
- UI updates for new phase (buttons, panels, etc.)

```javascript
// Test command sequence
phaseDebug.state(); // Current phase: deploy
phaseDebug.nextPhase(); // Advance phase
phaseDebug.state(); // Should show: reinforce
phaseDebug.nextPhase(); // Advance phase
phaseDebug.state(); // Should show: attack
```

### Scenario 3: Phase History Tracking

**Goal**: Verify phase transitions are recorded with timestamps

**Steps**:

1. Run several `phaseDebug.nextPhase()` commands
2. Run `phaseDebug.history()` to see all transitions

**Expected Results**:

- History shows all transitions in order
- Each entry has timestamp and phase names
- History limited to last 10 transitions

```javascript
// Test command sequence
phaseDebug.nextPhase();
phaseDebug.nextPhase();
phaseDebug.nextPhase();
phaseDebug.history(); // Shows all 3 transitions with times
```

### Scenario 4: Phase Skip Testing

**Goal**: Verify optional phases can be skipped

**Steps**:

1. Advance to attack phase: `phaseDebug.nextPhase()` multiple times
2. Run `phaseDebug.skip()` to skip attack
3. Verify phase goes straight to fortify

**Expected Results**:

- Attack phase skipped
- Goes directly to fortify
- Console shows: `✅ Skipped: attack → fortify`

```javascript
// Test command sequence
phaseDebug.nextPhase(); // Deploy phase
phaseDebug.nextPhase(); // Reinforce phase
phaseDebug.nextPhase(); // Attack phase
phaseDebug.skip(); // Skip to fortify
phaseDebug.state(); // Should show: fortify
```

### Scenario 5: End-Turn Button Integration

**Goal**: Verify end-turn button properly advances phases

**Steps**:

1. Start game
2. Verify initial phase is "deploy"
3. Click "End Turn" button
4. Check console for success message
5. Verify phase changed

**Expected Results**:

- Button click triggers phase advancement
- Console shows: `✅ Phase advanced: oldPhase → newPhase`
- UI updates reflect new phase
- All systems synchronized

```javascript
// Console verification after clicking End Turn button
phaseDebug.state(); // Verify phase changed
phaseDebug.sync(); // Verify all systems aligned
```

### Scenario 6: Combat System Integration

**Goal**: Verify attack phase triggers combat system

**Steps**:

1. Advance to attack phase via `phaseDebug.nextPhase()` commands
2. Observe console for combat phase messages
3. Verify combat UI becomes active

**Expected Results**:

- Console shows: `⚔️ Attack phase: Enable combat`
- Combat UI activates
- Can launch attacks

```javascript
// Test command sequence
// Keep calling phaseDebug.nextPhase() until attack phase
phaseDebug.nextPhase();
phaseDebug.nextPhase();
phaseDebug.nextPhase();
// Should trigger combat UI and show "⚔️ Attack phase" message
```

### Scenario 7: UI Synchronization

**Goal**: Verify UI updates correctly with phase changes

**Steps**:

1. Watch console and UI during phase transitions
2. Verify button states change appropriately
3. Verify panels update for new phase

**Expected Results**:

- UI updates immediately on phase change
- Buttons enable/disable correctly for phase
- Phase display shows correct phase name

## Debug Commands Reference

### `phaseDebug.state()`

**Purpose**: Display current phase in all four systems
**Output**: Four-line status showing phase in GameState, TurnManager, PhaseManager, PhaseSynchronizer
**When to use**: Verify systems are synchronized, debug phase mismatches

```javascript
phaseDebug.state();
```

### `phaseDebug.nextPhase()`

**Purpose**: Advance to next phase (for testing)
**Output**: Success or failure message with old/new phases
**When to use**: Test phase transitions without clicking buttons

```javascript
phaseDebug.nextPhase();
```

### `phaseDebug.skip()`

**Purpose**: Skip current phase if allowed (attack/fortify only)
**Output**: Success or failure message with old/new phases
**When to use**: Skip optional phases during testing

```javascript
phaseDebug.skip();
```

### `phaseDebug.history()`

**Purpose**: Show last 10 phase transitions with timestamps
**Output**: List of phase changes with times
**When to use**: Verify phase transition sequence, debug phase logic

```javascript
phaseDebug.history();
```

### `phaseDebug.sync()`

**Purpose**: Check if all systems are synchronized
**Output**: Status of each system and overall synchronization status
**When to use**: Verify systems are in sync, debug desynchronization issues

```javascript
phaseDebug.sync();
```

## Troubleshooting Guide

### Issue: Console shows "⚠️ PhaseSynchronizer not available"

**Cause**: PhaseSynchronizer not initialized yet or failed to load

**Solutions**:

1. Wait 2 seconds for initialization
2. Check browser console for script loading errors
3. Verify script loading order in game.html:
   - GameState.js
   - PhaseManager.js
   - TurnManager.js
   - PhaseSynchronizer.js ← Must be after TurnManager
   - PhaseDebugger.js ← Must be after PhaseSynchronizer
   - RiskUI.js

### Issue: `phaseDebug` commands not found

**Cause**: Debug commands not initialized

**Solutions**:

1. Wait for page to fully load
2. Type `phaseDebug` in console - should show object with 5 methods
3. Check console for initialization message
4. Refresh page

### Issue: Phases not advancing

**Cause**: Phase requirements not met or validation rules blocking transition

**Solutions**:

1. Check `phaseDebug.state()` to see current phase
2. Check console for reason why phase can't advance
3. Verify phase requirements are met:
   - Reinforce: Armies must be calculated
   - Attack: Combat must be completed or skipped
   - Fortify: Fortification must be completed or skipped

### Issue: "❌ ALL SYSTEMS SYNCHRONIZED" appears in sync()

**Cause**: Systems are out of sync

**Solutions**:

1. Check which system shows different phase
2. Reload page
3. Check console for errors during phase transitions
4. File a bug report with console logs

### Issue: End-Turn button doesn't work

**Cause**: Button not wired to PhaseSynchronizer or phase requirements not met

**Solutions**:

1. Check console for errors when clicking button
2. Run `phaseDebug.state()` to see current phase
3. Verify phase requirements are met
4. Try `phaseDebug.nextPhase()` to test synchronizer directly
5. If sync works but button doesn't, check RiskUI.js handleEndTurn()

### Issue: Combat system doesn't activate in attack phase

**Cause**: Combat listeners not registered or combat system not initialized

**Solutions**:

1. Check console for "⚔️ Attack phase" message
2. Verify CombatUI is initialized: `window.combatUI` should exist
3. Check CombatUI has `onAttackPhaseStart()` method
4. Look for any errors in console related to combat

## Console Commands for Deep Debugging

### View Full Synchronizer State

```javascript
window.riskUI.phaseSynchronizer.getCurrentState();
```

### View Phase History Array

```javascript
window.riskUI.phaseSynchronizer.phaseHistory;
```

### View All Phase Listeners

```javascript
window.riskUI.phaseSynchronizer.listeners;
```

### Manually Check GameState Phase

```javascript
window.riskUI.gameState.phase;
```

### Manually Check TurnManager Phase

```javascript
window.riskUI.turnManager.currentPhase;
```

### Manually Check PhaseManager Phase

```javascript
window.riskUI.phaseManager.currentPhase;
```

### Check for Script Loading Errors

```javascript
window.scriptLoadingErrors; // If tracking errors
```

## Performance Verification

### Check Initialization Time

1. Open browser console
2. Look for timestamps of initialization messages
3. Should complete within 2 seconds total

### Check Phase Transition Time

```javascript
console.time("phase-advance");
phaseDebug.nextPhase();
console.timeEnd("phase-advance");
```

Should complete in <100ms

## Validation Checklist

### Before Playing

- [ ] Console shows all systems initialized ✅
- [ ] `phaseDebug.state()` shows consistent phase
- [ ] `phaseDebug.sync()` shows synchronized
- [ ] End-turn button is clickable
- [ ] Combat UI appears when advanced to attack phase

### During Gameplay

- [ ] Phases advance correctly with end-turn button
- [ ] UI updates for each phase change
- [ ] Phase history tracks all transitions
- [ ] Combat system activates in attack phase
- [ ] All buttons/panels work for each phase

### After Phase Changes

- [ ] `phaseDebug.state()` shows new phase
- [ ] All four systems show same phase
- [ ] UI elements updated for new phase
- [ ] Console shows no errors

## Expected Console Output Timeline

```
T+0.0s:   Scripts loading...
T+0.5s:   GameState initialized
T+0.7s:   PhaseManager initialized
T+0.9s:   TurnManager initialized
T+1.1s:   PhaseSynchronizer initialized
T+1.3s:   PhaseDebugger initialized
T+1.5s:   ✅ PHASE MANAGEMENT SYSTEM STATUS: [verification block]
T+1.6s:   ⚙️ Setting up phase change listeners...
T+1.7s:   ✅ Phase change listeners registered
T+1.8s:   🎮 Initializing Phase Management Debug Commands...
T+1.9s:   ✅ Phase debug commands ready...
```

## Next Steps

1. **Load Game**: Open game.html in browser
2. **Verify Initialization**: Check console shows all ✅ statuses
3. **Test Commands**: Run `phaseDebug.state()` and `phaseDebug.sync()`
4. **Test Gameplay**: Click end-turn button and watch phases advance
5. **Monitor Console**: Watch for any errors or warnings
6. **Play Full Game**: Complete full game scenario to verify all phases work

## Success Criteria

✅ System passes all tests when:

- All four initialization messages visible in console
- `phaseDebug.state()` shows consistent phase across all systems
- `phaseDebug.sync()` shows `✅ ALL SYSTEMS SYNCHRONIZED`
- End-turn button advances phases correctly
- Combat system activates in attack phase
- No errors or warnings in console during normal gameplay
- Phase history shows all transitions with correct timestamps

---

**Status**: Ready for testing
**Date**: Today
**Last Updated**: Implementation Complete
