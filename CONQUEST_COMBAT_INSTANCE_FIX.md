# Conquest Combat Instance Fix

## Problem

When a territory is conquered in battle, the following error occurred during conquest confirmation:

```
❌ No active combat instance
Error: No active combat instance
    at CombatUI.confirmTransfer
```

### Error Sequence

1. Battle completes with conquest
2. `showBattleResults()` detects conquest and schedules `showConquestModal()`
3. `endAttack()` is called (from somewhere) which calls `combatSystem.endCombat()`
4. **Combat instance is cleared**: `currentCombat = null`
5. After 1.5s delay, conquest modal is shown
6. User clicks "Confirm Transfer" button
7. `confirmTransfer()` tries to access `currentCombat` → **ERROR: it's already null**

### Root Cause

The conquest flow had a timing issue where:

- The combat instance was being cleared via `endAttack()` → `combatSystem.endCombat()`
- This happened BEFORE the conquest modal was shown and confirmed
- `confirmTransfer()` relied on `this.combatSystem.currentCombat` being available
- Once cleared, there was no way to complete the conquest

## Solution

Implemented a **conquest persistence system** that stores conquest information separately from the combat instance, ensuring it survives combat clearing.

### Changes Made

#### 1. Added `pendingConquest` Property

**File**: `CombatUI.js` (constructor)

```javascript
constructor(combatSystem, gameUtils) {
  this.combatSystem = combatSystem;
  this.gameUtils = gameUtils || window.GameUtils;
  this.currentAttackingTerritory = null;
  this.currentDefendingTerritory = null;

  // Store conquest info separately so it survives combat instance clearing
  this.pendingConquest = null;

  console.log("🚀 Initializing CombatUI with super-robust element handling");
}
```

**Purpose**: Stores conquest details that persist even after combat instance is cleared.

#### 2. Store Conquest Info in `showBattleResults()`

**File**: `CombatUI.js` (lines ~1537-1556)

```javascript
// Handle conquest
if (isConquest) {
  console.log("🏆 Territory conquered! Preparing to show conquest modal...");

  // CRITICAL: Store conquest info now before combat instance can be cleared
  this.pendingConquest = {
    attackingTerritoryId:
      attackingTerritoryId || this.currentAttackingTerritory,
    defendingTerritoryId:
      defendingTerritoryId || this.currentDefendingTerritory,
    attackerRemainingArmies: result.attackerRemainingArmies,
    storedAt: Date.now(),
  };

  console.log("💾 Stored conquest info:", this.pendingConquest);

  // Small delay to let user see the conquest message
  setTimeout(() => {
    this.showConquestModal();
  }, 1500);
}
```

**Key Points**:

- Stores territory IDs, attacker remaining armies, and timestamp
- Happens IMMEDIATELY when conquest is detected
- Survives any `endAttack()` or `endCombat()` calls that happen later

#### 3. Updated `showConquestModal()` to Use Stored Data

**File**: `CombatUI.js` (lines ~1813-1849)

```javascript
showConquestModal() {
  console.log("🏆 Showing conquest modal for army transfer");

  let attackingTerritoryId, defendingTerritoryId;

  // First priority: Use pendingConquest if available (survives combat clearing)
  if (this.pendingConquest) {
    console.log("✅ Using stored pendingConquest info");
    attackingTerritoryId = this.pendingConquest.attackingTerritoryId;
    defendingTerritoryId = this.pendingConquest.defendingTerritoryId;
  }
  // Second priority: Get from active combat if available
  else if (this.combatSystem.currentCombat && this.combatSystem.currentCombat.isConquered()) {
    console.log("✅ Using active combat info");
    const combat = this.combatSystem.currentCombat;
    attackingTerritoryId = combat.getAttackingTerritory();
    defendingTerritoryId = combat.getDefendingTerritory();
  }
  // Third priority: Use stored territory IDs
  else if (this.currentAttackingTerritory && this.currentDefendingTerritory) {
    console.log("🛠️ Recovering from stored territory IDs");
    attackingTerritoryId = this.currentAttackingTerritory;
    defendingTerritoryId = this.currentDefendingTerritory;
  }
  // Last resort: Try window.transferState
  else if (window.transferState?.sourceTerritory && window.transferState?.destinationTerritory) {
    console.log("🛠️ Recovering from window.transferState");
    attackingTerritoryId = window.transferState.sourceTerritory;
    defendingTerritoryId = window.transferState.destinationTerritory;
  }
  else {
    console.error("❌ Cannot show conquest modal: No territory information available");
    return;
  }

  // ... rest of modal setup using attackingTerritoryId and defendingTerritoryId
}
```

**Multi-Source Fallback Strategy**:

1. **pendingConquest** (most reliable - survives combat clearing)
2. Active combat instance (if still available)
3. Stored territory IDs in CombatUI
4. window.transferState (last resort)

#### 4. Rewrote `confirmTransfer()` with Combat-Independent Logic

**File**: `CombatUI.js` (lines ~2043-2175)

**OLD CODE** (relied on currentCombat):

```javascript
if (!this.combatSystem.currentCombat) {
  console.error("❌ No active combat instance");
  throw new Error("No active combat instance");
}

const sourceId = this.combatSystem.currentCombat.getAttackingTerritory();
const destId = this.combatSystem.currentCombat.getDefendingTerritory();
```

**NEW CODE** (multi-source with fallback):

```javascript
// Get territory IDs - try multiple sources
let sourceId, destId;

// Priority 1: Use pendingConquest (survives combat clearing)
if (this.pendingConquest) {
  console.log("✅ Using pendingConquest for territory IDs");
  sourceId = this.pendingConquest.attackingTerritoryId;
  destId = this.pendingConquest.defendingTerritoryId;
}
// Priority 2: Use active combat if available
else if (this.combatSystem.currentCombat) {
  console.log("✅ Using active combat for territory IDs");
  sourceId = this.combatSystem.currentCombat.getAttackingTerritory();
  destId = this.combatSystem.currentCombat.getDefendingTerritory();
}
// Priority 3: Use stored territory IDs
else if (this.currentAttackingTerritory && this.currentDefendingTerritory) {
  console.log("✅ Using stored territory IDs");
  sourceId = this.currentAttackingTerritory;
  destId = this.currentDefendingTerritory;
}
// Priority 4: Use window.transferState
else if (window.transferState) {
  console.log("✅ Using window.transferState for territory IDs");
  sourceId = window.transferState.sourceTerritory;
  destId = window.transferState.destinationTerritory;
} else {
  console.error("❌ No territory information available");
  throw new Error("No territory information available for conquest");
}

// Try to complete via combat system if combat still active
let result;
if (this.combatSystem.currentCombat) {
  console.log("🎯 Completing conquest via active combat instance");
  result = this.combatSystem.completeConquest(transferAmount);
} else {
  // Combat already ended, perform manual transfer
  console.log("🎯 Combat instance cleared, performing manual transfer");
  result = this._manualConquestTransfer(sourceId, destId, transferAmount);
}

// Clear stored conquest info
this.pendingConquest = null;
```

**Key Features**:

- No longer throws error if `currentCombat` is null
- Uses stored `pendingConquest` as primary source
- Falls back to manual transfer if combat instance cleared
- Cleans up `pendingConquest` after successful transfer

#### 5. Added `_manualConquestTransfer()` Method

**File**: `CombatUI.js` (lines ~2177-2254)

```javascript
/**
 * Manually perform conquest transfer when combat instance is already cleared
 * @private
 * @param {string} sourceId - Source territory ID
 * @param {string} destId - Destination territory ID
 * @param {number} transferAmount - Number of armies to transfer
 * @returns {Object} Result object with success flag
 */
_manualConquestTransfer(sourceId, destId, transferAmount) {
  console.log(`🎯 Manual conquest transfer: ${transferAmount} armies from ${sourceId} to ${destId}`);

  try {
    // Get game state
    const gameState = GameStateManager || this.combatSystem.gameState;

    // Get territories
    const sourceTerritory = gameState.territories[sourceId];
    const destTerritory = gameState.territories[destId];

    // Validate transfer
    if (sourceTerritory.armies <= transferAmount) {
      throw new Error(`Not enough armies in ${sourceId} for transfer`);
    }

    // Get current player from source territory
    const conqueredPlayer = sourceTerritory.owner;

    // Perform the transfer
    sourceTerritory.armies -= transferAmount;
    destTerritory.armies = transferAmount;
    destTerritory.owner = conqueredPlayer;

    // Update map display
    this._updateMapDisplay(sourceId);
    this._updateMapDisplay(destId);

    // Update game state and check continent ownership
    if (gameState.updateTerritory) {
      gameState.updateTerritory(sourceId, sourceTerritory);
      gameState.updateTerritory(destId, destTerritory);
    }

    if (gameState.checkContinentOwnership) {
      gameState.checkContinentOwnership();
    }

    return {
      success: true,
      sourceTerritory: sourceId,
      destinationTerritory: destId,
      armiesTransferred: transferAmount,
      conqueredBy: conqueredPlayer,
    };
  } catch (error) {
    console.error("❌ Manual conquest transfer failed:", error);
    return {
      success: false,
      error: error.message || "Manual transfer failed",
    };
  }
}
```

**Purpose**: Performs conquest directly on game state when combat instance is unavailable.

**Features**:

- Direct territory manipulation
- Army transfer and ownership change
- Map display updates
- Game state synchronization
- Continent ownership recalculation

#### 6. Updated `cancelTransfer()` to Use New Flow

**File**: `CombatUI.js` (lines ~2260-2278)

```javascript
cancelTransfer() {
  console.log("🔄 Using minimum transfer of 1 army");

  // Set the slider/input to 1 first
  if (this.conquestElements.slider) {
    this.conquestElements.slider.value = 1;
  }
  if (this.conquestElements.input) {
    this.conquestElements.input.value = 1;
  }

  // Call confirmTransfer which now has all the recovery logic
  return this.confirmTransfer();
}
```

**Simplification**: Now just sets transfer to 1 and calls `confirmTransfer()`, which handles all the recovery logic.

## Benefits

### 1. **Robust Conquest Flow**

- Conquest can complete even if combat instance is cleared prematurely
- No more "No active combat instance" errors

### 2. **Multiple Fallback Sources**

- Primary: `pendingConquest` (stored at conquest detection)
- Secondary: Active `currentCombat` (if still available)
- Tertiary: Stored territory IDs in CombatUI
- Last resort: `window.transferState`

### 3. **Manual Transfer Capability**

- Can perform conquest directly on game state
- Doesn't require combat instance to be active
- Updates all related systems (map, game state, continents)

### 4. **Clean State Management**

- `pendingConquest` cleared after successful transfer
- Cleared on errors to prevent stuck states
- Timestamp included for debugging

### 5. **Backwards Compatible**

- Still uses combat system method if available
- Falls back to manual transfer only when necessary
- Existing conquest flow preserved

## Verification

### Console Logs to Watch For

**Successful Flow**:

```
🏆 Territory conquered! Preparing to show conquest modal...
💾 Stored conquest info: {attackingTerritoryId: "...", defendingTerritoryId: "..."}
🏆 Showing conquest modal for army transfer
✅ Using stored pendingConquest info
🔄 CombatUI.confirmTransfer called
📊 Transfer amount: 2
✅ Using pendingConquest for territory IDs
📍 Conquest territories: south africa → congo
```

**If Combat Instance Still Active**:

```
🎯 Completing conquest via active combat instance
✅ Conquest completed successfully
```

**If Combat Instance Cleared**:

```
🎯 Combat instance cleared, performing manual transfer
🎯 Manual conquest transfer: 2 armies from south africa to congo
✅ Manual transfer complete:
  south africa: 1 armies (owner: player1)
  congo: 2 armies (owner: player1)
✅ Conquest completed successfully
```

### Testing Scenarios

1. **Normal Conquest Flow** (combat instance active):

   - Start attack
   - Battle until conquest
   - Click "Confirm Transfer"
   - Should complete via `combatSystem.completeConquest()`

2. **Cleared Combat Instance** (the bug we fixed):

   - Start attack
   - Battle until conquest
   - Combat instance gets cleared (by endAttack or other mechanism)
   - Click "Confirm Transfer"
   - Should complete via `_manualConquestTransfer()`

3. **Minimum Transfer**:

   - Conquer territory
   - Click "Use Minimum" button
   - Should transfer exactly 1 army

4. **Custom Transfer**:
   - Conquer territory
   - Adjust slider to different value
   - Click "Confirm Transfer"
   - Should transfer selected number of armies

## Related Files

- `js/CombatUI.js` - All conquest UI logic
- `js/CombatSystem.js` - Combat instance management
- `js/GameStateManager.js` - Territory state management
- `game.html` - Conquest modal HTML

## Related Documentation

- `ARMY_DISPLAY_FIX.md` - Army count display fix
- `CONQUEST_MODAL_EVENT_FIX.md` - Event handler cleanup
- `COMBAT_MANAGER_GUIDE.md` - CombatManager API
- `DUPLICATE_EVENT_HANDLER_FIX.md` - Event listener patterns

## Technical Notes

### Why Not Just Prevent Combat Clearing?

We could prevent `endAttack()` from being called until conquest is complete, but:

1. Harder to track all code paths that might clear combat
2. Would require significant refactoring of existing flow
3. Could introduce new timing issues

The `pendingConquest` approach is more robust because:

- Defensive programming - assumes combat CAN be cleared
- Works regardless of call order or timing
- Provides clear fallback path
- Minimal changes to existing code

### pendingConquest Structure

```javascript
{
  attackingTerritoryId: string,      // Source territory
  defendingTerritoryId: string,      // Conquered territory
  attackerRemainingArmies: number,   // Armies left after battle
  storedAt: number                   // Timestamp (for debugging)
}
```

### Memory Management

- `pendingConquest` is cleared after successful transfer
- Cleared on errors to prevent memory leaks
- Only stores minimal data (territory IDs + armies)
- Timestamp helps identify stale data during debugging

## Future Improvements

1. **Add Timeout**: Clear `pendingConquest` after X minutes if not used
2. **Add Validation**: Verify territories still exist and are valid
3. **Add Events**: Fire events when conquest stored/cleared
4. **Add Metrics**: Track how often manual transfer is used vs combat system

## Conclusion

This fix ensures conquest can complete reliably regardless of combat instance state. The multi-source fallback approach provides robustness while maintaining backwards compatibility with existing code.

The key insight: **Store critical conquest data separately from transient combat instances**.
