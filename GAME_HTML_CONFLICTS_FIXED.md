# game.html Combat Logic Conflicts - FIXED

## 🎯 Problem Summary

**Issue:** Multiple conflicting functions in `game.html` were racing to update the army count displays in the attack modal, causing incorrect troop counts to appear in:

- `#attack-modal-attacking-armies`
- `#attack-modal-defending-armies`

**Root Cause:** Legacy combat management code in `game.html` was never removed when the modular combat system (`CombatUI.js`, `CombatSystem.js`, etc.) was introduced, creating race conditions.

## 🔍 Conflicting Code Identified

### 1. **Duplicate Battle State Management**

**Before (Lines ~3764):**

```javascript
// Battle Management System
window.battleState = {
  attackingTerritory: null,
  defendingTerritory: null,
  initialAttackerArmies: 0,
  initialDefenderArmies: 0,
  minAttackerArmies: 1,
  minDefenderArmies: 0,
};
```

**Conflicted with:**

- `CombatUI.js`: `this.currentAttackingTerritory`, `this.currentDefendingTerritory`
- `CombatSystem.js`: `this.currentCombat`
- `GameStateManager`: Territory state management

### 2. **Multiple Army Count Update Locations**

| Location          | Function                     | Issue                                    |
| ----------------- | ---------------------------- | ---------------------------------------- |
| `game.html:3650`  | `selectAttackingTerritory()` | Updated `#attack-modal-attacking-armies` |
| `game.html:3625`  | `selectDefendingTerritory()` | Updated `#attack-modal-defending-armies` |
| `game.html:3775`  | `openBattleModal()`          | Updated both army displays               |
| `CombatUI.js:636` | `startAttack()`              | Updated both army displays               |
| `CombatUI.js:782` | `startAttack()` setTimeout   | Force updated both displays              |

**Result:** Race condition - whichever function executed last "won", often with stale/incorrect data.

### 3. **Deprecated Functions Still Active**

These functions in `game.html` were actively manipulating combat UI:

- ❌ `window.openBattleModal()` - 50+ lines of UI manipulation code
- ❌ `window.closeBattleModal()` - Reset battle state
- ❌ `window.adjustBattleArmies()` - Modified army input fields
- ❌ `window.updateBattlePreview()` - Updated preview displays
- ❌ `window.resolveBattle()` - 120+ lines of battle resolution logic
- ❌ `window.selectDefendingTerritory()` - 60+ lines updating modal UI

## ✅ Solution Implemented

### Changes to `game.html`

**1. Replaced Battle Management System (Lines 3764-4002)**

**After:**

```javascript
// ========================================================================
// DEPRECATED: Legacy Battle Management System
// This code is kept ONLY for backward compatibility
// All new code should use CombatUI.js for combat management
// ========================================================================

// DEPRECATED: Use CombatUI state management instead
window.battleState = {
  attackingTerritory: null,
  defendingTerritory: null,
  initialAttackerArmies: 0,
  initialDefenderArmies: 0,
  minAttackerArmies: 1,
  minDefenderArmies: 0,
};

// DEPRECATED: Redirect to CombatUI.startAttack()
window.openBattleModal = function (attackingTerritoryId, defendingTerritoryId) {
  console.warn(
    "⚠️ openBattleModal() is DEPRECATED. Redirecting to CombatUI.startAttack()"
  );

  if (window.combatUI && typeof window.combatUI.startAttack === "function") {
    console.log("✅ Using CombatUI.startAttack() for combat management");
    return window.combatUI.startAttack(
      attackingTerritoryId,
      defendingTerritoryId
    );
  }

  // Fallback
  if (window.openAttackModal) {
    return window.openAttackModal();
  }
};

// DEPRECATED: Redirect to window.closeAttackModal()
window.closeBattleModal = function () {
  console.warn(
    "⚠️ closeBattleModal() is DEPRECATED. Use window.closeAttackModal() instead"
  );

  if (window.closeAttackModal) {
    return window.closeAttackModal();
  }

  // Fallback
  const modal =
    document.getElementById("battle-modal") ||
    document.getElementById("attack-modal");
  if (modal) modal.style.display = "none";
};

// DEPRECATED: No-op (handled by CombatUI now)
window.adjustBattleArmies = function (side, delta) {
  console.warn(
    "⚠️ adjustBattleArmies() is DEPRECATED. User inputs are now handled in CombatUI.js"
  );
};

// DEPRECATED: No-op (handled by CombatUI now)
window.updateBattlePreview = function () {
  console.warn(
    "⚠️ updateBattlePreview() is DEPRECATED. Preview updates are handled in CombatUI.js"
  );
};

// DEPRECATED: Redirect to CombatUI.executeAttack()
window.resolveBattle = function () {
  console.warn(
    "⚠️ resolveBattle() is DEPRECATED. Redirecting to CombatUI.executeAttack()"
  );

  if (window.combatUI && typeof window.combatUI.executeAttack === "function") {
    console.log("✅ Using CombatUI.executeAttack() for battle resolution");
    return window.combatUI.executeAttack();
  }

  console.error("❌ CombatUI not available. Cannot resolve battle.");
  alert("Combat system not initialized. Please refresh the page.");
};
```

**2. Replaced selectDefendingTerritory() (Lines 3625-3680)**

**Before:** 60+ lines updating modal UI, army displays, input fields

**After:**

```javascript
// DEPRECATED: Redirects to CombatUI
window.selectDefendingTerritory = function (territoryId) {
  console.warn(
    "⚠️ selectDefendingTerritory() is DEPRECATED. Territory selection is now handled by CombatUI.js"
  );

  if (
    window.combatUI &&
    typeof window.combatUI.handleTerritoryClick === "function"
  ) {
    console.log(
      "✅ Using CombatUI.handleTerritoryClick() for territory selection"
    );
    return window.combatUI.handleTerritoryClick(territoryId);
  }

  // Fallback: Store in attack state only (don't update UI)
  if (window.attackState) {
    window.attackState.defendingTerritory = territoryId;
  }

  return false;
};
```

**3. Already Fixed: selectAttackingTerritory() (Line 3596)**

Was already redirecting to CombatUI - no changes needed.

## 📊 Impact Analysis

### Code Removed/Deprecated

| Function                     | Lines Removed  | Status                           |
| ---------------------------- | -------------- | -------------------------------- |
| `openBattleModal()`          | ~50 lines      | ✅ Redirects to CombatUI         |
| `closeBattleModal()`         | ~10 lines      | ✅ Redirects to closeAttackModal |
| `adjustBattleArmies()`       | ~15 lines      | ✅ No-op with warning            |
| `updateBattlePreview()`      | ~30 lines      | ✅ No-op with warning            |
| `resolveBattle()`            | ~120 lines     | ✅ Redirects to CombatUI         |
| `selectDefendingTerritory()` | ~60 lines      | ✅ Redirects to CombatUI         |
| **TOTAL**                    | **~285 lines** | **Replaced with ~80 lines**      |

### Benefits

✅ **Single Source of Truth**: Only `CombatUI.js` updates army count displays  
✅ **No Race Conditions**: Eliminated competing functions trying to update same elements  
✅ **Backward Compatibility**: Old function names still work (redirect to new system)  
✅ **Clear Deprecation Path**: Console warnings guide developers to new APIs  
✅ **Reduced Complexity**: ~200 lines of duplicate logic removed  
✅ **Easier Debugging**: Clear console messages show which system is handling combat

## 🧪 Testing Checklist

After these changes, verify:

### 1. Army Count Display Accuracy

- [ ] Click attacking territory → Correct army count shown in modal
- [ ] Click defending territory → Correct army count shown in modal
- [ ] Army counts match `gameState.territories[id].armies` exactly
- [ ] No flickering or value changes after modal opens
- [ ] Console shows single log from CombatUI, not multiple sources

### 2. Combat Flow

- [ ] Territory selection works correctly
- [ ] Attack modal opens with correct data
- [ ] Battle execution updates armies correctly
- [ ] Map display updates after combat
- [ ] Conquest scenarios work properly

### 3. Console Messages

- [ ] See deprecation warnings for legacy functions
- [ ] See "Using CombatUI..." messages when redirects work
- [ ] No errors about undefined functions
- [ ] No race condition warnings

### 4. Backward Compatibility

- [ ] Old code calling `openBattleModal()` still works
- [ ] Old code calling `resolveBattle()` still works
- [ ] Console warns about deprecated usage
- [ ] Functions redirect to new system correctly

## 🔧 Developer Notes

### For Future Development

**DO:**

- ✅ Use `window.combatUI.startAttack(attacker, defender)` to start combat
- ✅ Use `window.combatUI.executeAttack()` to resolve battles
- ✅ Use `window.combatUI.handleTerritoryClick(id)` for territory selection
- ✅ Read army counts from `window.gameState.territories[id].armies`
- ✅ Update displays through `CombatUI` methods only

**DON'T:**

- ❌ Call `window.openBattleModal()` - use `combatUI.startAttack()` instead
- ❌ Call `window.resolveBattle()` - use `combatUI.executeAttack()` instead
- ❌ Update `#attack-modal-attacking-armies` directly - let CombatUI handle it
- ❌ Maintain state in `window.battleState` - use CombatUI state instead
- ❌ Create new functions that manipulate combat modal UI

### Migration Path

If you have legacy code calling these functions:

```javascript
// OLD (still works, but deprecated)
window.openBattleModal("alaska", "northwest-territory");
window.resolveBattle();

// NEW (recommended)
window.combatUI.startAttack("alaska", "northwest-territory");
window.combatUI.executeAttack();
```

The old calls will work (redirect to new system) but will log warnings to help you find and update them.

## 📝 Files Modified

- ✅ `game.html` - Lines 3764-4002 (Battle Management System)
- ✅ `game.html` - Lines 3625-3680 (selectDefendingTerritory)

## 🎉 Result

**Before:** 4+ competing functions updating army displays → race conditions → incorrect troop counts

**After:** Single source of truth (CombatUI.js) → consistent data → accurate troop counts

The combat system now has a clear, unambiguous flow with proper state management and no conflicting logic!
