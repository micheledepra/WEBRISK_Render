# RISK Digital - User Input Combat System

## Overview

This RISK game implementation uses a **USER INPUT** system for combat resolution, NOT automatic dice rolling. This document explains how the combat system works and how data flows through the application.

## Key Principle

**🎯 The user manually inputs the battle results (remaining armies after combat). The system does NOT roll dice or automatically determine battle outcomes.**

## Combat System Architecture

### Core Components

1. **CombatValidator.js** (formerly DiceRoller.js)

   - Contains validation logic ONLY
   - Validates army counts before combat
   - Validates user-inputted battle results
   - NO dice rolling functionality
   - Backward compatible alias: `window.DiceRoller`

2. **CombatSystem.js**

   - Manages combat flow and state
   - Processes user input for battle results
   - Handles territory conquest logic
   - Updates game state based on user input

3. **CombatUI.js**

   - Displays combat interface
   - Captures user input for battle results
   - Shows battle outcomes
   - Manages conquest/transfer modals

4. **DirectCombat.js**
   - Provides simplified interface to combat system
   - Validates inputs before processing
   - Handles errors and edge cases

## Combat Flow

### Step 1: Initiate Attack

```
User clicks attacking territory → User clicks defending territory
↓
CombatUI.startAttack() is called
↓
Attack modal displays current army counts for both territories
```

### Step 2: User Input

```
Modal shows:
- Attacking Territory: [Name] - [X armies]
- Defending Territory: [Name] - [Y armies]

User inputs:
- Attacker remaining armies (must be ≥ 1)
- Defender remaining armies (can be 0 for conquest)
```

### Step 3: Validation

```
CombatValidator.validateBattleResult() checks:
✓ Armies don't increase
✓ Attacker has at least 1 army remaining
✓ Defender armies ≥ 0
✓ All values are integers
✓ Losses are non-negative
```

### Step 4: Process Battle

```
CombatUI.executeAttack()
↓
CombatSystem.processDirectCombat()
↓
Update game state with new army counts
↓
Check if defender has 0 armies → Conquest!
```

### Step 5: Display Results

```
CombatUI.showBattleResults()
- Show losses for each side
- Update territory displays
- If conquest → Show transfer modal
```

### Step 6: Conquest Transfer (if applicable)

```
If defender defeated:
↓
CombatUI.showConquestModal()
↓
User selects armies to transfer (must transfer at least 1)
↓
CombatUI.confirmTransfer()
↓
Update ownership and army distribution
```

## Data Flow

### Territory State Sources (Priority Order)

1. `gameState.territories[territoryId]` - Primary source
2. `GameStateManager.getTerritory(territoryId)` - Alternative
3. DOM elements (`[data-territory-id]`) - Fallback

### State Synchronization Points

- **After Combat**: Territory armies updated in `gameState` and via `GameStateManager`
- **After Conquest**: Ownership changed, armies set to 0 for defender
- **After Transfer**: Armies redistributed between conquering and conquered territories
- **Map Display Update**: Visual representation updated via multiple methods

## Key Functions

### CombatValidator

```javascript
// Validate combat can proceed
validateArmiesForCombat(attackerArmies, defenderArmies);
// Returns: { valid, errors[], maxAttackerDice, maxDefenderDice }

// Validate user-inputted battle result
validateBattleResult(attackerStart, defenderStart, attackerEnd, defenderEnd);
// Returns: { valid, errors[], attackerLosses, defenderLosses, isConquest, ... }

// Get max dice count (reference only, not used for combat)
getMaxDiceCount(armies, type);
// Returns: number
```

### CombatSystem

```javascript
// Start a new combat session
startCombat(attackingTerritoryId, defendingTerritoryId);
// Returns: { success, combat, error? }

// Process battle with user input
processDirectCombat(attackerRemaining, defenderRemaining);
// Returns: { success, result, error? }

// End current combat
endCombat();
// Returns: { success, wasConquered }
```

### CombatUI

```javascript
// Show attack modal
startAttack(attackingTerritoryId, defendingTerritoryId);
// Returns: boolean

// Execute attack with user input
executeAttack();
// Reads from input fields, validates, processes

// Show battle results
showBattleResults(result);
// Displays losses, updates UI, checks for conquest

// Show conquest transfer modal
showConquestModal();
// Allows user to transfer armies after conquest
```

## Important Implementation Details

### No Dice Rolling

- All `rollDice()` references have been removed
- No `performCombatRound()` automatic resolution
- No `compareDiceAndDetermineCasualties()` logic used
- Legacy methods exist in CombatValidator for backward compatibility but are NOT called

### User Input Validation

The system validates user input to ensure:

1. **No Army Gain**: Neither side can have more armies after combat
2. **Attacker Minimum**: Attacker must have at least 1 army remaining
3. **Defender Range**: Defender can have 0 armies (conquest) but not negative
4. **Integer Values**: All army counts must be whole numbers
5. **Logical Losses**: Losses must be non-negative and make sense

### Error Recovery

Multiple fallback mechanisms ensure combat works even if components fail:

- Multiple methods to get territory data
- Multiple ways to update map display
- Fallback to direct DOM manipulation if needed
- State recovery from multiple sources

### Conquest Handling

When defender reaches 0 armies:

1. Territory ownership changes immediately
2. Defender armies set to 0
3. Transfer modal opens
4. User MUST transfer at least 1 army to complete conquest
5. Game state and map visuals update after transfer

## Testing User Input Combat

### Valid Battle Example

```
Initial State:
- Attacker: 5 armies
- Defender: 3 armies

User Input:
- Attacker remaining: 3 (lost 2)
- Defender remaining: 1 (lost 2)

Result: ✓ Valid
- Attacker losses: 2
- Defender losses: 2
- No conquest
```

### Conquest Example

```
Initial State:
- Attacker: 5 armies
- Defender: 2 armies

User Input:
- Attacker remaining: 4 (lost 1)
- Defender remaining: 0 (lost 2)

Result: ✓ Valid → Conquest!
- Attacker losses: 1
- Defender losses: 2
- Territory conquered
- Transfer modal opens
```

### Invalid Examples

```
❌ Attacker remaining: 0 (must be ≥ 1)
❌ Defender remaining: 4 (can't gain armies, started with 3)
❌ Attacker remaining: 6 (can't gain armies, started with 5)
❌ Negative values
❌ Non-integer values
```

## Migration Notes

### From Dice Rolling to User Input

If you're migrating from a dice rolling system:

1. **Remove**: All `rollDice()` calls
2. **Remove**: All `performCombatRound()` calls
3. **Replace**: Combat resolution with user input fields
4. **Add**: Validation for user-inputted results
5. **Update**: UI to show input fields instead of dice animations

### Backward Compatibility

For legacy code that references `DiceRoller`:

- `window.DiceRoller` now points to `CombatValidator`
- Validation methods still work
- Dice rolling methods exist but are NOT used
- No functionality breaks due to class rename

## File Structure

```
js/
├── DiceRoller.js          → CombatValidator (validation only)
├── CombatSystem.js        → Core combat state management
├── CombatUI.js            → User interface for combat
├── DirectCombat.js        → Simplified combat interface
├── CombatIntegration.js   → Integration with game systems
└── GameStateManager.js    → Territory state management
```

## Debugging Combat Issues

### Common Issues

**Issue**: "Invalid battle result received"

- **Check**: User input values in modal
- **Verify**: `attackerRemaining` and `defenderRemaining` are valid numbers
- **Ensure**: Values pass validation rules

**Issue**: Territory armies not updating on map

- **Check**: Multiple update methods called in `_updateMapDisplay()`
- **Verify**: GameStateManager is updating territory data
- **Ensure**: Map display refresh is called

**Issue**: Conquest not showing transfer modal

- **Check**: `result.conquered` or `result.territoryConquered` is true
- **Verify**: Territory IDs are stored in `currentAttackingTerritory` and `currentDefendingTerritory`
- **Ensure**: `showConquestModal()` is called

### Debugging Logs

Enable detailed logging by checking console for:

- `🎲 Showing battle results:` - Battle result data
- `🔄 Battle territories:` - Territory IDs involved
- `🏆 Territory conquered!` - Conquest detection
- `✅ Battle result processed successfully:` - Successful processing

## Future Enhancements

Potential improvements while maintaining user input system:

1. **Suggested Results**: Show typical outcomes based on army counts
2. **Battle History**: Log all battles for review
3. **Undo Last Battle**: Allow reverting mistakes
4. **Battle Analytics**: Track win/loss ratios by territory
5. **Custom Rules**: Allow house rules for combat outcomes

## Summary

The RISK Digital combat system is designed around **user input** for battle results, NOT automatic dice rolling. This provides:

- ✅ Full control over game outcomes
- ✅ Support for house rules and custom scenarios
- ✅ Simplified testing and debugging
- ✅ Flexible combat resolution
- ✅ No randomness issues or RNG concerns

All dice rolling code has been removed or disabled, and the system validates user input to ensure logical and fair battles.
