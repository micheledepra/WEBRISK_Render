# Turn and Phase Management System - Implementation Guide

## Overview

This document describes the unified turn and phase management system for the Risk game. The system synchronizes state across three core components using a centralized `PhaseSynchronizer`.

## Architecture

### Core Components

#### 1. **GameState.js**

- Stores all game data (territories, players, phase, turn number)
- Manages territory ownership and army counts
- Calculates reinforcements based on official Risk rules
- Maintains player rotation and turn tracking

#### 2. **TurnManager.js**

- Handles user interactions and territory clicks
- Processes territory claims, deployments, attacks, and fortifications
- Tracks selected territories and dice results
- Now integrates with PhaseSynchronizer for coordinated phase changes

#### 3. **PhaseManager.js**

- Manages UI display and phase indicators
- Enforces phase requirements (armies must be fully deployed before advancing)
- Highlights valid territories for current phase
- Handles skip phase for optional phases (attack, fortify)
- Now uses PhaseSynchronizer for phase transitions

#### 4. **PhaseSynchronizer.js** (NEW)

- **Central orchestrator** for all phase transitions
- Maintains single source of truth for game state
- Validates all phase transitions against official Risk rules
- Tracks phase history and transitions
- Notifies all listeners of phase changes
- Handles turn advancement and player rotation

#### 5. **PhaseDebugger.js** (NEW)

- Comprehensive debugging utility
- Tracks and validates synchronization
- Records phase transition history
- Provides performance metrics
- Generates debug reports

### Phase Sequences

#### Initial Game Setup

```
initial-setup → initial-placement → deploy → attack → fortify
                                    ↑                      ↓
                                    ←──── (repeat for each player) ←
```

#### Regular Game (repeating)

```
reinforce → attack → fortify → [next player's reinforce...]
   ↑                   ↓
   └─── (full turn = all players complete fortify) ←
```

**Note:** When the last player completes fortify, the turn number increments and the first player begins their reinforce phase.

## Phase Definitions

| Phase                 | Description                     | Skippable | Requirement             |
| --------------------- | ------------------------------- | --------- | ----------------------- |
| **initial-setup**     | Claim territories               | No        | All territories claimed |
| **initial-placement** | Place initial armies            | No        | All armies placed       |
| **deploy**            | Deploy initial armies (initial) | No        | All armies deployed     |
| **reinforce**         | Deploy turn reinforcements      | No        | All armies deployed     |
| **attack**            | Attack enemies                  | **Yes**   | None                    |
| **fortify**           | Move armies within territory    | **Yes**   | None                    |

## Implementation Guide

### 1. Initialize the System

```javascript
// In RiskUI.initGame()
this.gameState = new GameState(players, colors);
this.turnManager = new TurnManager(this.gameState);
this.phaseManager = new PhaseManager(this.gameState, this);

// Create and wire PhaseSynchronizer
this.phaseSynchronizer = new PhaseSynchronizer(
  this.gameState,
  this.turnManager,
  this.phaseManager
);

// Connect all systems to synchronizer
this.turnManager.setPhaseSynchronizer(this.phaseSynchronizer);
this.phaseManager.setPhaseSynchronizer(this.phaseSynchronizer);

// Subscribe to phase changes
this.phaseSynchronizer.onPhaseChange((data) => {
  console.log(`Phase: ${data.oldPhase} → ${data.newPhase} (Turn ${data.turn})`);
  this.updatePhaseUI(data);
});
```

### 2. Handle Phase Transitions

**Advance to Next Phase:**

```javascript
// PhaseManager or UI button handler
if (this.phaseManager.advancePhase()) {
  console.log("Phase advanced successfully");
} else {
  console.log("Cannot advance - requirements not met");
}
```

**Skip Phase:**

```javascript
// Only for attack and fortify phases
if (this.phaseManager.skipPhase()) {
  console.log("Phase skipped");
}
```

### 3. Monitor Phase Changes

```javascript
// Subscribe to phase changes
this.phaseSynchronizer.onPhaseChange((data) => {
  const { oldPhase, newPhase, turn, player, config } = data;

  // Update UI
  updatePhaseDisplay(config.name);
  updateTurnCounter(turn);
  updatePlayerIndicator(player);

  // Phase-specific logic
  if (newPhase === "attack") {
    enableAttackUI();
  } else if (newPhase === "fortify") {
    enableFortifyUI();
  }
});
```

## Key Features

### ✅ Official Risk Rules Compliance

- Correct initial army counts (40/35/30/25/20 for 2-6 players)
- Proper reinforcement calculation (1 per 3 territories, minimum 3, plus continent bonuses)
- Continent bonus tracking
- Territory connectivity validation

### ✅ Single Source of Truth

- All phase transitions flow through PhaseSynchronizer
- GameState, TurnManager, and PhaseManager stay synchronized
- No conflicting state in multiple systems

### ✅ Phase Requirements Validation

- Deploy/Reinforce phases require all armies to be placed
- Initial setup requires all territories claimed
- Attack and Fortify can be skipped

### ✅ Player Rotation

- Automatic player advancement
- Turn number increments when all players complete a round
- Proper handling of initial setup vs. regular game transitions

### ✅ Comprehensive Debugging

- Phase history tracking
- Synchronization verification
- Performance metrics
- Debug reports and log export

## Common Usage Patterns

### Pattern 1: End Turn Button

```javascript
handleEndTurn() {
    if (this.gameState.phase === 'fortify') {
        // Attempt to advance from fortify
        if (this.phaseManager.advancePhase()) {
            // Successfully moved to next player's reinforce
            this.updateUI();
        }
    }
}
```

### Pattern 2: Check Phase Requirements

```javascript
checkIfCanAdvance() {
    if (this.phaseManager.canAdvancePhase()) {
        return true; // All requirements met
    } else {
        // Show error message with specific requirement
        const message = this.phaseManager.getCurrentPhaseConfig().minRequirement;
        showNotification(message);
        return false;
    }
}
```

### Pattern 3: Handle Territory Click

```javascript
handleTerritoryClick(territoryId) {
    const result = this.turnManager.handleTerritoryClick(territoryId);

    if (result) {
        // Update visuals
        this.updateAllTerritoryVisuals();

        // Check if phase is complete
        if (this.phaseManager.canAdvancePhase()) {
            // Enable "Next Phase" button
            document.getElementById('next-phase-btn').disabled = false;
        }
    }
}
```

## Debugging

### Enable Debug Mode

```javascript
// Create debugger
const debugger = new PhaseDebugger(
    gameState,
    turnManager,
    phaseManager,
    phaseSynchronizer
);

// Enable logging
debugger.enableLogging();

// Print state
debugger.printGameState();
debugger.printManagerStates();

// Verify synchronization
debugger.verifySynchronization();

// View phase history
debugger.printPhaseHistory();

// Generate report
debugger.printReport();

// Export logs
debugger.downloadLogs();
```

### Check Synchronization

```javascript
if (debugger.verifySynchronization()) {
    console.log('✅ All systems synchronized');
} else {
    console.error('❌ Synchronization mismatch - check debug report');
}
```

## Error Handling

### Invalid Phase Transition

```javascript
const result = this.phaseSynchronizer.transitionPhase("invalid-phase");
if (!result.success) {
  console.error(`Transition failed: ${result.reason}`);
  // reason: "Invalid transition from X to Y"
}
```

### Phase Requirements Not Met

```javascript
if (!this.phaseManager.canAdvancePhase()) {
  this.phaseManager.showPhaseRequirementMessage();
  // Shows notification with specific requirement
}
```

## Performance Considerations

1. **Phase transitions are synchronous** - No async operations in transition logic
2. **Event listeners are optimized** - Only relevant listeners are called
3. **Phase history is bounded** - Automatically maintains max 100 records
4. **No polling** - Event-driven architecture for efficiency

## Migration from Old System

If you have existing code that directly manipulates phases:

### Before (Old Way)

```javascript
// ❌ Direct phase manipulation
this.gameState.phase = "attack";
this.turnManager.currentPhase = "attack";
this.phaseManager.currentPhase = "attack";
```

### After (New Way)

```javascript
// ✅ Use PhaseSynchronizer
this.phaseSynchronizer.transitionPhase("attack");
// All systems automatically synchronized
```

## Testing Phase Management

### Test 1: Initial Setup Sequence

```javascript
// Verify all territories get claimed
assert(phaseManager.isInitialSetupComplete() === false);
// Claim all territories...
assert(phaseManager.isInitialSetupComplete() === true);
assert(gameState.phase === "initial-placement");
```

### Test 2: Deployment Completeness

```javascript
// Verify armies must be fully deployed
const remaining = gameState.remainingArmies[player];
assert(phaseManager.canAdvancePhase() === (remaining === 0));
```

### Test 3: Player Rotation

```javascript
// Verify player cycles correctly
const p1 = gameState.getCurrentPlayer();
gameState.nextPlayer();
const p2 = gameState.getCurrentPlayer();
assert(p1 !== p2);
// After full rotation...
gameState.nextPlayer(); // Back to p1
assert(gameState.turnNumber === 2); // Turn incremented
```

### Test 4: Synchronization

```javascript
// Verify all systems stay in sync
const before = {
  gameState: gameState.phase,
  turnManager: turnManager.currentPhase,
  phaseManager: phaseManager.currentPhase,
};

phaseSynchronizer.advanceToNextPhase();

const after = {
  gameState: gameState.phase,
  turnManager: turnManager.currentPhase,
  phaseManager: phaseManager.currentPhase,
};

assert(after.gameState === after.turnManager);
assert(after.turnManager === after.phaseManager);
```

## Troubleshooting

### Issue: Phases not advancing

**Solution:** Verify phase requirements are met

```javascript
debugger.checkPhaseRequirements();
```

### Issue: Out of synchronization

**Solution:** Check synchronization status

```javascript
if (!debugger.verifySynchronization()) {
    // Manually resync
    turnManager.syncPhaseDisplay();
    phaseManager.updatePhaseDisplay();
}
```

### Issue: Phase transitions too slow

**Solution:** Check performance metrics

```javascript
debugger.printReport(); // Check metrics.slowestTransition
```

## API Reference

### PhaseSynchronizer

#### Methods

- `transitionPhase(phase)` - Execute phase transition
- `advanceToNextPhase()` - Advance to next phase in sequence
- `skipPhase()` - Skip current phase (attack/fortify only)
- `endTurn()` - Move to next player
- `onPhaseChange(callback)` - Subscribe to phase changes
- `getPhaseHistory(limit)` - Get recent phase transitions
- `getPhaseConfig(phase)` - Get phase configuration

### PhaseManager

#### Methods

- `advancePhase()` - Advance to next phase (with validation)
- `skipPhase()` - Skip current phase
- `canAdvancePhase()` - Check if phase can advance
- `canSkipPhase()` - Check if phase can be skipped
- `updatePhaseDisplay()` - Update UI display

### PhaseDebugger

#### Methods

- `enableLogging()` / `disableLogging()` - Toggle logging
- `verifySynchronization()` - Check system sync
- `printGameState()` - Print game state
- `printManagerStates()` - Print manager states
- `printPhaseHistory()` - Print transition history
- `generateReport()` - Create comprehensive report
- `downloadLogs()` - Export debug logs

## Further Reading

- `PhaseSynchronizer.js` - Detailed implementation
- `PhaseDebugger.js` - Debugging utilities
- `GameState.js` - Core game data structures
- `TurnManager.js` - Turn and action handling
- `PhaseManager.js` - UI phase display
