# CombatManager Integration Guide

## Overview

The **CombatManager** is a comprehensive orchestration layer for the Risk combat system that provides a clean, unified API for managing all combat operations. It integrates seamlessly with your existing combat components while following official Risk rules with user-input battle resolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CombatManager                          │
│            (Orchestration & API Layer)                      │
│                                                             │
│  • Battle Flow Control                                     │
│  • State Management                                        │
│  • Validation Coordination                                 │
│  • Statistics Tracking                                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ CombatSystem │    │   CombatUI   │    │  Validators  │
│              │    │              │    │              │
│ • Core Logic │    │ • Visual     │    │ • Rules      │
│ • State Mgmt │    │ • Modals     │    │ • Input      │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Key Features

### ✅ Official Risk Rules Implementation

- Attacker must leave at least 1 army in attacking territory
- Battle resolution via user input (no dice rolling)
- Combat continues until attacker chooses to stop or defender eliminated
- Winner occupies territory if defender is eliminated
- Adjacency requirements enforced
- Ownership rules validated

### ✅ Enhanced Functionality

- **Comprehensive Validation**: Multi-layer validation for all inputs
- **Battle History**: Track all battles with detailed statistics
- **State Management**: Robust tracking of combat state
- **Error Handling**: Graceful error handling with detailed messages
- **Battle Suggestions**: AI-suggested battle outcomes
- **Statistics**: Detailed combat statistics and analytics

### ✅ Integration Features

- Works seamlessly with existing CombatSystem, CombatUI, and validators
- Backward compatible with current code
- Extensive logging for debugging
- Clean, intuitive API

## Installation

The CombatManager is now loaded automatically in the script loading sequence:

```javascript
// Already added to game.html
.then(() => loadScript("js/CombatSystem.js"))
.then(() => loadScript("js/CombatDebugger.js"))
.then(() => loadScript("js/CombatManager.js"))  // ← Added here
.then(() => loadScript("js/CombatUI.js"))
```

## Basic Usage

### Initialization

```javascript
// CombatManager is automatically available after scripts load
// Initialize with game state and UI
const combatManager = new CombatManager(window.gameState, window.combatUI);

// Optional: Initialize with custom configuration
const combatManager = new CombatManager(window.gameState, window.combatUI, {
  enableLogging: true, // Enable detailed console logging
  strictValidation: true, // Enable strict rule validation
});
```

### Starting Combat

```javascript
// Initiate combat between two territories
const result = combatManager.initiateCombat("alaska", "kamchatka");

if (result.success) {
  console.log("Combat initiated!");
  console.log("Battle ID:", result.battleId);
  console.log("Attacker:", result.combatState.attacker.name);
  console.log("Defender:", result.combatState.defender.name);
} else {
  console.error("Cannot attack:", result.error);
  // result.validation contains detailed validation info
}
```

### Processing Battle Rounds

```javascript
// User specifies battle outcome (armies remaining after battle)
const battleResult = combatManager.processBattle({
  attackerRemaining: 4, // Attacker has 4 armies left
  defenderRemaining: 2, // Defender has 2 armies left
});

if (battleResult.success) {
  console.log("Attacker lost:", battleResult.attackerLosses, "armies");
  console.log("Defender lost:", battleResult.defenderLosses, "armies");

  if (battleResult.isConquest) {
    console.log("🏆 Territory conquered!");
    // Proceed to conquest phase
  } else if (battleResult.canContinue) {
    console.log("Battle can continue");
    // User can choose to continue or end
  } else {
    console.log("Attacker cannot continue (insufficient armies)");
  }
} else {
  console.error("Invalid battle result:", battleResult.error);
}
```

### Completing Conquest

```javascript
// After conquest, move armies into conquered territory
const conquestResult = combatManager.completeConquest(3);

if (conquestResult.success) {
  console.log("Conquest complete!");
  console.log("New owner:", conquestResult.conquestState.conqueror);
  console.log(
    "Armies transferred:",
    conquestResult.conquestState.armiesTransferred
  );
} else {
  console.error("Conquest failed:", conquestResult.error);
}
```

### Ending Combat

```javascript
// End combat without conquest (attacker chooses to stop)
const endResult = combatManager.endCombat();

if (endResult.success) {
  console.log("Combat ended after", endResult.finalState.rounds, "rounds");
  console.log(
    "Total attacker losses:",
    endResult.finalState.totalAttackerLosses
  );
  console.log(
    "Total defender losses:",
    endResult.finalState.totalDefenderLosses
  );
}
```

## Advanced Features

### Battle Suggestions

Get AI-suggested battle outcomes to help users:

```javascript
const options = combatManager.getBattleOptions();

console.log("Current state:", options.currentState);
console.log("Valid ranges:", options.constraints);

// Display suggestions to user
options.suggestions.forEach((suggestion) => {
  console.log(`${suggestion.id}: ${suggestion.description}`);
  console.log(`  Attacker: ${suggestion.attackerLosses} losses`);
  console.log(`  Defender: ${suggestion.defenderLosses} losses`);
  console.log(`  Probability: ${suggestion.probability}`);
});
```

Example output:

```
conquest: Conquer territory (defender eliminated)
  Attacker: 1 losses
  Defender: 3 losses
  Probability: High casualties for defender

balanced: Balanced battle (both sides lose armies)
  Attacker: 1 losses
  Defender: 1 losses
  Probability: Even battle

attacker-wins: Attacker advantage (defender loses more)
  Attacker: 0 losses
  Defender: 2 losses
  Probability: Favorable for attacker
```

### Query Methods

```javascript
// Get all attackable territories from a position
const targets = combatManager.getAttackableTargets("alaska");
targets.forEach((target) => {
  console.log(
    `Can attack ${target.name} (${target.armies} armies, owned by ${target.owner})`
  );
});

// Check combat status
if (combatManager.isCombatActive()) {
  console.log("Combat is currently active");
}

if (combatManager.isConquestPending()) {
  console.log("Conquest needs to be completed");
}

// Get current combat state
const state = combatManager.getCurrentCombatState();
if (state) {
  console.log("Battle round:", state.rounds);
  console.log("Attacker armies:", state.attacker.currentArmies);
  console.log("Defender armies:", state.defender.currentArmies);
  console.log("Can continue:", state.canContinue);
}
```

### Statistics and History

```javascript
// Get combat statistics
const stats = combatManager.getStatistics();
console.log("Total battles:", stats.totalBattles);
console.log("Total conquests:", stats.totalConquests);
console.log("Conquest rate:", stats.conquestRate + "%");
console.log("Average battle duration:", stats.averageDuration + "ms");
console.log("Total armies lost:");
console.log("  Attackers:", stats.totalArmiesLost.attacker);
console.log("  Defenders:", stats.totalArmiesLost.defender);

// Get battle history
const history = combatManager.getBattleHistory(5); // Last 5 battles
history.forEach((battle) => {
  console.log(`Battle ${battle.id}:`);
  console.log(`  ${battle.attackingTerritory} → ${battle.defendingTerritory}`);
  console.log(`  Rounds: ${battle.rounds.length}`);
  console.log(`  Status: ${battle.status}`);
  console.log(`  Duration: ${battle.duration}ms`);
});
```

## Complete Battle Flow Example

```javascript
// ═══════════════════════════════════════════════════════════
// COMPLETE BATTLE FLOW EXAMPLE
// ═══════════════════════════════════════════════════════════

// Step 1: Validate attack before starting
console.log("Step 1: Validate attack");
const validation = combatManager.validateAttack("alaska", "kamchatka");
if (!validation.valid) {
  alert("Cannot attack: " + validation.reason);
  // Stop here
}

// Step 2: Initiate combat
console.log("Step 2: Initiate combat");
const initResult = combatManager.initiateCombat("alaska", "kamchatka");
if (!initResult.success) {
  alert("Failed to start combat: " + initResult.error);
  // Stop here
}

console.log("✅ Combat started!");
console.log("Attacker:", initResult.combatState.attacker);
console.log("Defender:", initResult.combatState.defender);

// Step 3: Get battle options (optional - help user decide)
console.log("Step 3: Get battle suggestions");
const options = combatManager.getBattleOptions();
console.log("Suggested outcomes:", options.suggestions);

// Step 4: User inputs battle result
console.log("Step 4: Process battle round");
const battleInput = {
  attackerRemaining: 4, // User decides attacker ends with 4 armies
  defenderRemaining: 2, // User decides defender ends with 2 armies
};

const battleResult = combatManager.processBattle(battleInput);
if (!battleResult.success) {
  alert("Invalid battle result: " + battleResult.error);
  // Let user try again
}

console.log("Battle result:", battleResult);
console.log("Attacker losses:", battleResult.attackerLosses);
console.log("Defender losses:", battleResult.defenderLosses);

// Step 5: Check if battle continues or ends
if (battleResult.isConquest) {
  console.log("Step 5a: Handle conquest");

  // Calculate how many armies to transfer
  const attackerArmiesLeft = battleResult.afterState.attacker.armies;
  const armiesToMove = Math.floor(attackerArmiesLeft / 2); // Move half

  // Complete conquest
  const conquestResult = combatManager.completeConquest(armiesToMove);
  if (conquestResult.success) {
    console.log("🏆 Conquest complete!");
    console.log("Transferred", armiesToMove, "armies");
    console.log("Final state:", conquestResult.conquestState);
  }
} else if (battleResult.canContinue) {
  console.log("Step 5b: Battle can continue");
  // User decides whether to:
  // - Continue attacking: Go back to Step 4
  // - End attack: Go to Step 6
} else {
  console.log("Step 5c: Attacker cannot continue");
  // Automatically end combat
  combatManager.endCombat();
}

// Step 6: User chooses to end combat (if not conquest)
console.log("Step 6: End combat");
const endResult = combatManager.endCombat();
console.log("Combat ended:", endResult.finalState);

// Step 7: Review statistics
console.log("Step 7: View statistics");
const stats = combatManager.getStatistics();
console.log("Updated statistics:", stats);
```

## Integration with Existing UI

The CombatManager works seamlessly with your existing CombatUI:

```javascript
// The CombatUI methods are automatically called by CombatManager:

// When combat starts:
combatManager.initiateCombat("alaska", "kamchatka");
// → Internally calls: combatUI.startAttack('alaska', 'kamchatka')
// → Modal opens automatically

// When battle is processed:
combatManager.processBattle({ attackerRemaining: 4, defenderRemaining: 2 });
// → Internally calls: combatUI.showBattleResults(...)
// → Results displayed automatically

// When combat ends:
combatManager.endCombat();
// → Internally calls: combatUI.endAttack()
// → Modal closes automatically
```

## Error Handling

All CombatManager methods return result objects with consistent structure:

```javascript
const result = combatManager.someMethod(...);

if (result.success) {
  // Operation succeeded
  console.log('Success!', result.data);
} else {
  // Operation failed
  console.error('Error:', result.error);

  // Some results include additional error details
  if (result.validationErrors) {
    console.error('Validation errors:', result.validationErrors);
  }

  if (result.code) {
    // Error code for programmatic handling
    console.error('Error code:', result.code);
  }
}
```

Common error codes:

- `ATTACKER_NOT_FOUND`: Attacking territory doesn't exist
- `DEFENDER_NOT_FOUND`: Defending territory doesn't exist
- `INSUFFICIENT_ARMIES`: Not enough armies to attack
- `SAME_OWNER`: Cannot attack own territory
- `NOT_ADJACENT`: Territories not adjacent

## Best Practices

### 1. Always Validate Before Initiating

```javascript
// Good practice: Validate first
const validation = combatManager.validateAttack(attacker, defender);
if (validation.valid) {
  combatManager.initiateCombat(attacker, defender);
} else {
  showErrorToUser(validation.reason);
}
```

### 2. Check Combat State Before Operations

```javascript
// Before processing battle
if (!combatManager.isCombatActive()) {
  console.error("No active combat");
  return;
}

// Before completing conquest
if (!combatManager.isConquestPending()) {
  console.error("No conquest to complete");
  return;
}
```

### 3. Handle All Result Cases

```javascript
const result = combatManager.processBattle(input);

if (result.success) {
  if (result.isConquest) {
    handleConquest();
  } else if (result.canContinue) {
    askUserToContinue();
  } else {
    autoEndCombat();
  }
} else {
  displayError(result.error);
}
```

### 4. Use Logging for Debugging

```javascript
// Enable detailed logging during development
const combatManager = new CombatManager(gameState, combatUI, {
  enableLogging: true,
});

// Disable in production
const combatManager = new CombatManager(gameState, combatUI, {
  enableLogging: false,
});
```

## API Reference

### Constructor

```typescript
new CombatManager(gameState: Object, combatUI: CombatUI, options?: Object)
```

### Combat Initiation

- `initiateCombat(attackerId: string, defenderId: string): Object`
- `validateAttack(attackerId: string, defenderId: string): Object`

### Battle Processing

- `processBattle(battleInput: {attackerRemaining, defenderRemaining}): Object`
- `getBattleOptions(): Object`

### Conquest Handling

- `completeConquest(armiesToMove: number): Object`

### Combat Control

- `endCombat(): Object`
- `getCurrentCombatState(): Object|null`

### Query Methods

- `getAttackableTargets(territoryId: string): Array`
- `isCombatActive(): boolean`
- `isConquestPending(): boolean`

### Statistics

- `getStatistics(): Object`
- `getBattleHistory(limit?: number): Array`

### Utility

- `reset(): void`

## Troubleshooting

### Problem: "No active combat to process"

**Solution**: Call `initiateCombat()` before calling `processBattle()`

### Problem: "Invalid battle result"

**Solution**: Ensure army counts are valid:

- Attacker must have ≥ 1 army remaining
- Defender can have ≥ 0 armies (conquest)
- Armies cannot increase during combat

### Problem: "No conquest to complete"

**Solution**: Only call `completeConquest()` after defender is eliminated (defenderRemaining = 0)

### Problem: Combat manager not found

**Solution**: Ensure CombatManager.js is loaded before use:

```javascript
if (typeof CombatManager === "undefined") {
  console.error("CombatManager not loaded");
}
```

## Migration from Direct CombatSystem Usage

If you're currently using CombatSystem directly, migrating is simple:

### Before (Old Code):

```javascript
const result = combatSystem.startCombat("alaska", "kamchatka");
// Manual validation
// Manual UI updates
// Manual state tracking
```

### After (New Code with CombatManager):

```javascript
const result = combatManager.initiateCombat("alaska", "kamchatka");
// Automatic validation
// Automatic UI updates
// Automatic state tracking
```

The CombatManager provides the same functionality with:

- ✅ Better error handling
- ✅ Automatic UI integration
- ✅ Enhanced validation
- ✅ Battle history tracking
- ✅ Statistics collection

## Summary

The CombatManager provides:

1. **Clean API**: Simple, intuitive methods for all combat operations
2. **Official Rules**: Strict adherence to Risk rules
3. **User Input**: Battle resolution via user input (no dice)
4. **Validation**: Comprehensive multi-layer validation
5. **Integration**: Seamless integration with existing components
6. **Statistics**: Detailed tracking and analytics
7. **Error Handling**: Graceful error handling with detailed messages
8. **Documentation**: Extensive JSDoc comments and examples

Use it as the primary interface for all combat operations in your Risk game!
