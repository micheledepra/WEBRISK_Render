# Army Display Count Fix

## Problem

The attack modal was displaying incorrect army counts in `#attack-modal-attacking-armies` and `#attack-modal-defending-armies`. The displayed values did not match the actual territory army counts.

### Symptoms

- Opening attack modal showed wrong army counts
- Army counts would change unexpectedly during battle
- Display showed post-battle armies instead of starting armies

### Root Causes Identified

#### 1. **Post-Battle Army Update (PRIMARY ISSUE)**

**Location:** `CombatUI.js` lines ~1367-1381 (now removed)

**Problem:** The `showBattleResults()` method was updating the territory display elements with **remaining armies** after the battle, overwriting the starting army counts.

```javascript
// OLD CODE (REMOVED):
if (result.attackerRemainingArmies !== undefined) {
  if (this.elements.attackerArmies) {
    this.elements.attackerArmies.textContent = `${result.attackerRemainingArmies} armies`;
  }
}
```

**Why this was wrong:**

- The display elements `#attack-modal-attacking-armies` and `#attack-modal-defending-armies` are meant to show the **STARTING** armies when the battle began
- Updating them to show remaining armies caused confusion
- User enters "remaining armies" in input fields - those values should not overwrite the starting display

**Fix:** Removed the code that updates these display elements in `showBattleResults()`. Now they always show the starting army counts throughout the entire battle.

#### 2. **Data Source Inconsistency (SECONDARY ISSUE)**

**Location:** `CombatUI.js` `updateAttackModalInfo()` method

**Problem:** The method was only checking `GameStateManager` for territory data, but there are multiple possible data sources:

- `GameStateManager.getTerritory()`
- `window.gameState.territories`
- `combatSystem.gameState.territories`

If the primary source was out of sync, wrong data would be displayed.

**Fix:** Enhanced `updateAttackModalInfo()` to:

1. Query ALL data sources
2. Log data from each source for debugging
3. Use GameStateManager as primary, with fallbacks
4. Force re-fetch fresh data in setTimeout to ensure accuracy

## Changes Made

### 1. Removed Post-Battle Army Display Update

**File:** `js/CombatUI.js`
**Method:** `showBattleResults()`
**Lines:** ~1363-1381

**Before:**

```javascript
// Update UI with remaining armies
if (result.attackerRemainingArmies !== undefined) {
  if (this.elements.attackerArmies) {
    this.elements.attackerArmies.textContent = `${result.attackerRemainingArmies} armies`;
  }
}

if (result.defenderRemainingArmies !== undefined) {
  if (this.elements.defenderArmies) {
    this.elements.defenderArmies.textContent = `${result.defenderRemainingArmies} armies`;
  }
}
```

**After:**

```javascript
// DO NOT UPDATE THE TERRITORY DISPLAY ARMIES HERE
// Those elements (#attack-modal-attacking-armies and #attack-modal-defending-armies)
// should ALWAYS show the STARTING armies, not the remaining armies
// The remaining armies are shown in the battle result text and can be entered by user
console.log(
  "💡 Keeping territory army displays at starting values (not updating to remaining armies)"
);
```

### 2. Enhanced Data Source Checking

**File:** `js/CombatUI.js`
**Method:** `updateAttackModalInfo()`
**Lines:** ~742-860

**Enhancements:**

1. **Multi-Source Query:** Checks all three data sources and logs results
2. **Comprehensive Logging:** Shows army counts from each source for comparison
3. **Smart Fallback:** Uses GameStateManager first, then window.gameState, then combatSystem.gameState
4. **Fresh Data Validation:** Re-fetches data in setTimeout to override competing systems
5. **Detailed Console Output:** Every update is logged with emoji markers for easy tracking

**Key Features:**

```javascript
// Query all sources
const sources = {
  GameStateManager: GameStateManager.getTerritory(territoryId),
  windowGameState: window.gameState.territories[territoryId],
  combatSystemState: this.combatSystem.gameState.territories[territoryId],
};

// Log all sources for debugging
console.log("📊 Territory data from all sources:", sources);

// Use primary with fallbacks
let territory =
  sources.GameStateManager ||
  sources.windowGameState ||
  sources.combatSystemState;

// Force refresh after 100ms
setTimeout(() => {
  const freshData =
    GameStateManager.getTerritory(territoryId) ||
    window.gameState?.territories[territoryId];
  this.elements.attackerArmies.textContent = `${freshData.armies} armies`;
}, 100);
```

## How It Works Now

### Battle Flow

1. **Modal Opens:** `startAttack()` → `updateAttackModalInfo()`
   - Queries all data sources
   - Displays **STARTING** armies (e.g., "3 armies", "2 armies")
   - Sets input field defaults
2. **User Input:** User enters remaining armies in input fields
   - Attacker input: armies remaining after battle (min: 1)
   - Defender input: armies remaining after battle (min: 0 for conquest)
3. **Execute Attack:** User clicks "COMMENCE BATTLE!"
   - `executeAttack()` validates input
   - Updates game state with new army counts
   - Calls `showBattleResults()`
4. **Show Results:** `showBattleResults()` displays outcome
   - **DOES NOT** update territory display elements
   - Territory displays still show starting armies
   - Battle result text shows losses and remaining armies
5. **Continue/End:** User can continue or end attack
   - `continueAttack()`: Updates input fields with new current armies
   - `endAttack()`: Closes modal

### Display Element Behavior

| Element                               | Shows                   | Updates When                |
| ------------------------------------- | ----------------------- | --------------------------- |
| `#attack-modal-attacking-armies`      | Starting armies         | Only when modal opens       |
| `#attack-modal-defending-armies`      | Starting armies         | Only when modal opens       |
| `#attack-modal-attacker-armies-input` | User's target remaining | User types, continue attack |
| `#attack-modal-defender-armies-input` | User's target remaining | User types, continue attack |
| Battle result text                    | Losses and remaining    | After each battle           |

## Testing

### Test Scenario 1: Basic Attack

1. Western United States (3 armies) attacks Alberta (2 armies)
2. **Expected Display:**
   - Attacker display: "3 armies" ✅
   - Defender display: "2 armies" ✅
3. User enters: Attacker remaining = 2, Defender remaining = 1
4. Click "COMMENCE BATTLE!"
5. **Expected Display:**
   - Attacker display: STILL "3 armies" ✅ (not changed to "2 armies")
   - Defender display: STILL "2 armies" ✅ (not changed to "1 army")
   - Result text: "Attacker lost 1 army. Defender lost 1 army." ✅

### Test Scenario 2: Conquest

1. Central America (5 armies) attacks Venezuela (2 armies)
2. **Expected Display:**
   - Attacker display: "5 armies" ✅
   - Defender display: "2 armies" ✅
3. User enters: Attacker remaining = 3, Defender remaining = 0
4. Click "COMMENCE BATTLE!"
5. **Expected Display:**
   - Attacker display: STILL "5 armies" ✅
   - Defender display: STILL "2 armies" ✅
   - Result text: "Territory Conquered!" ✅

### Test Scenario 3: Continue Attack

1. Start battle: Attacker (5) vs Defender (3)
2. First round: Attacker → 4, Defender → 2
3. Click "Continue Attack"
4. **Expected Display:**
   - Attacker display: STILL "5 armies" ✅ (original starting value)
   - Defender display: STILL "3 armies" ✅ (original starting value)
   - Attacker input: Now defaults to 3 (current-1) ✅
   - Defender input: Now defaults to 1 (current-1) ✅

## Console Logging

The fix includes extensive logging for debugging:

### When Modal Opens

```
🔍 updateAttackModalInfo called with combat: {attackingTerritory: "western-united-states", ...}
📊 Territory data from all sources:
  GameStateManager: {attacker: {name: "western united states", armies: 3, ...}, ...}
  windowGameState: {attacker: {name: "western united states", armies: 3, ...}, ...}
  combatSystemState: {attacker: {name: "western united states", armies: 3, ...}, ...}
✅ Using territory data: {attacker: {name: "western united states", armies: 3}, ...}
📝 Set attacker name: "western united states"
📝 Set attacker armies display: "3 armies"
📝 Set defender name: "alberta"
📝 Set defender armies display: "2 armies"
🔄 Force-updated attacker armies: "3 armies"
🔄 Force-updated defender armies: "2 armies"
```

### During Battle Results

```
💡 Keeping territory army displays at starting values (not updating to remaining armies)
✅ Battle results displayed successfully
Final armies: {attacker: 2, defender: 1, isConquest: false}
```

## Benefits

1. **Consistency:** Display always shows starting armies, never post-battle values
2. **Clarity:** Users can see original army counts throughout entire battle
3. **Accuracy:** Multiple data source checking ensures correct values
4. **Debuggability:** Comprehensive logging makes issues easy to identify
5. **User Experience:** Less confusion about what values mean

## Edge Cases Handled

- ✅ Data source out of sync (checks all sources)
- ✅ GameStateManager not available (falls back gracefully)
- ✅ Competing systems updating values (setTimeout override)
- ✅ Multiple battle rounds (displays never change from starting values)
- ✅ Conquest scenarios (displays show pre-conquest armies)

## Files Modified

1. `js/CombatUI.js`
   - `showBattleResults()` method: Removed army display updates
   - `updateAttackModalInfo()` method: Enhanced data source checking and logging

## Related Systems

### Not Modified (Working Correctly)

- ✅ `startAttack()` - Correctly initializes modal
- ✅ `executeAttack()` - Correctly reads user input
- ✅ `continueAttack()` - Correctly updates input fields only
- ✅ `endAttack()` - Correctly closes modal
- ✅ `showConquestModal()` - Works with correct army counts

### No Conflicts With

- ✅ CombatSystem.js - State management unchanged
- ✅ CombatValidator.js - Validation unchanged
- ✅ GameStateManager - Data queries unchanged
- ✅ CombatIntegration.js - Different display elements (not affected)

## Future Considerations

If you need to show updated army counts during battle:

1. Create **separate** display elements for "Current Armies"
2. Keep `#attack-modal-attacking-armies` showing starting values
3. Add new elements like `#attack-modal-attacking-current` for current values
4. Update documentation to clarify the difference

## Verification Steps

To verify the fix is working:

1. Open browser console
2. Start an attack
3. Check console for "📊 Territory data from all sources" log
4. Verify all sources show same army counts
5. Check "📝 Set attacker/defender armies display" logs
6. Execute battle
7. Check for "💡 Keeping territory army displays at starting values" log
8. Verify display elements still show starting armies
9. Check battle result text for correct losses

## Summary

**Problem:** Army display elements showed incorrect/changing values during battle
**Root Cause:** Post-battle updates overwriting starting army displays
**Solution:** Remove post-battle display updates, enhance data source reliability
**Result:** Display elements now consistently show starting armies throughout battle
**Status:** ✅ FIXED - Ready for testing
