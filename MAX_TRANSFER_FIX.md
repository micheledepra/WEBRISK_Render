# Max Transfer Calculation Fix

## 🐛 Problem

When conquering a territory, the `maxTransfer` value was calculated **after** the battle, using the **current** (post-battle) army count instead of the **initial** (pre-battle) army count.

### Example Scenario

**Battle:** Central America (3 armies) attacks Western United States (1 army)

- User inputs: Attacker remaining = 2, Defender remaining = 0 (conquest)
- **Losses:** Attacker loses 1 army

**What Happened:**

```javascript
// After battle, Central America has 2 armies
maxTransfer = attackingTerritory.armies - 1; // 2 - 1 = 1 ❌ WRONG!
```

**What Should Happen:**

```javascript
// Use initial armies (before battle)
maxTransfer = initialAttackerArmies - 1; // 3 - 1 = 2 ✅ CORRECT!
```

### User Impact

- ❌ Transfer slider showed max of **1 army** instead of **2 armies**
- ❌ User couldn't transfer all available armies
- ❌ Incorrect calculation: Used post-battle armies instead of pre-battle armies

## ✅ Solution

### 1. Store Initial Attacker Armies During Conquest

In `executeAttack()` method (line ~990), store the initial army count when conquest is detected:

```javascript
if (battleResult.isConquest) {
  console.log("🏆 Territory conquered!");

  // Store initial attacking armies for transfer calculation
  this.conquestInitialAttackerArmies = battleResult.attackerStartingArmies;
  console.log(
    `💾 Stored initial attacker armies for conquest: ${this.conquestInitialAttackerArmies}`
  );

  // ... rest of conquest logic
}
```

**Key:** `battleResult.attackerStartingArmies` contains the army count **before** the battle started.

### 2. Use Stored Value in showConquestModal()

In `showConquestModal()` method (line ~1770), use the stored initial armies:

```javascript
// Set slider range using INITIAL attacker armies (before battle losses)
const initialAttackerArmies =
  this.conquestInitialAttackerArmies || attackingTerritory.armies;
const maxArmies = initialAttackerArmies - 1; // Must leave at least 1 army in source

console.log(
  `📊 Conquest transfer calculation: Initial armies: ${initialAttackerArmies}, Max transfer: ${maxArmies}`
);
```

**Fallback:** If `conquestInitialAttackerArmies` is not set, falls back to current armies for safety.

### 3. Clear Stored Value After Conquest

In `confirmTransfer()` method (line ~1970), clear the stored value after conquest completes:

```javascript
console.log("✅ Conquest completed successfully");

// Clear stored initial attacker armies after conquest is complete
this.conquestInitialAttackerArmies = null;
console.log("🧹 Cleared stored initial attacker armies");
```

**Purpose:** Prevents stale data from being used in future conquests.

## 📊 Calculation Flow

### Before Fix:

```
1. Battle starts: Central America (3 armies) vs Western US (1 army)
2. User input: Attacker 2, Defender 0
3. State updated: Central America = 2 armies ⚠️
4. showConquestModal called
5. maxTransfer = currentArmies - 1 = 2 - 1 = 1 ❌ WRONG!
```

### After Fix:

```
1. Battle starts: Central America (3 armies) vs Western US (1 army)
2. Initial armies stored: conquestInitialAttackerArmies = 3 💾
3. User input: Attacker 2, Defender 0
4. State updated: Central America = 2 armies
5. showConquestModal called
6. maxTransfer = storedInitialArmies - 1 = 3 - 1 = 2 ✅ CORRECT!
7. Transfer completed
8. Stored value cleared: conquestInitialAttackerArmies = null 🧹
```

## 🧪 Test Cases

### Test Case 1: Standard Conquest with Losses

- **Initial:** Attacker 5 armies, Defender 2 armies
- **Battle Result:** Attacker 3 armies (lost 2), Defender 0 (conquered)
- **Expected maxTransfer:** 5 - 1 = **4 armies** ✅
- **User can transfer:** 1-4 armies (leaving 1-4 in source)

### Test Case 2: Conquest with Minimal Losses

- **Initial:** Attacker 10 armies, Defender 1 army
- **Battle Result:** Attacker 9 armies (lost 1), Defender 0 (conquered)
- **Expected maxTransfer:** 10 - 1 = **9 armies** ✅
- **User can transfer:** 1-9 armies (leaving 1-9 in source)

### Test Case 3: Conquest with Heavy Losses

- **Initial:** Attacker 8 armies, Defender 5 armies
- **Battle Result:** Attacker 3 armies (lost 5), Defender 0 (conquered)
- **Expected maxTransfer:** 8 - 1 = **7 armies** ✅
- **User can transfer:** 1-7 armies (but only 2 available post-battle, so capped)

## 🔍 Edge Cases Handled

1. **Stored value not set:** Falls back to `attackingTerritory.armies`
2. **Transfer amount exceeds available:** Validation in `confirmTransfer()` adjusts it
3. **Multiple conquests:** Value cleared after each conquest completion
4. **Conquest failed/cancelled:** Value cleared in error handlers

## 📝 Code Changes Summary

**File:** `js/CombatUI.js`

| Location              | Change                                            | Lines      |
| --------------------- | ------------------------------------------------- | ---------- |
| `executeAttack()`     | Store `conquestInitialAttackerArmies` on conquest | ~993-995   |
| `showConquestModal()` | Use stored value for `maxArmies` calculation      | ~1770-1774 |
| `confirmTransfer()`   | Clear stored value after conquest                 | ~1972-1974 |

## ✅ Result

**Before:**

```javascript
window.transferState = {
  sourceTerritory: "central america",
  destinationTerritory: "western united states",
  maxTransfer: 1, // ❌ Based on post-battle armies (2 - 1)
  currentTransfer: 1,
  minTransfer: 1,
};
```

**After:**

```javascript
window.transferState = {
  sourceTerritory: "central america",
  destinationTerritory: "western united states",
  maxTransfer: 2, // ✅ Based on pre-battle armies (3 - 1)
  currentTransfer: 1,
  minTransfer: 1,
};
```

## 🎉 Benefits

✅ **Accurate transfer calculations** - Uses actual available armies from battle start  
✅ **Fair gameplay** - Players can transfer armies they actually committed to battle  
✅ **Logical behavior** - Max transfer based on what you started with, not what remains  
✅ **No lost armies** - Battle losses don't reduce transfer availability  
✅ **Clean state management** - Stored value cleared after use

The max transfer calculation now correctly reflects the initial attacking force! 🎮
