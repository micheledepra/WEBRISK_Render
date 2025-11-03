# Two Army Attacker Input Range Fix

## Problem

When an attacker initiated battle with exactly **2 armies**, they could not edit the battle results because the input range was locked.

### Error Scenario

1. Attacker has 2 armies, Defender has 5 armies
2. User clicks to attack
3. Attack modal opens
4. **Attacker input is locked**: min=1, max=1, value=1
5. User **cannot change the value** (slider/input stuck at 1)
6. Battle executes with attacker losing 1 army (forced outcome)

### Root Cause

In `CombatUI.js` `updateAttackModalInfo()` method (lines ~939-944):

```javascript
// OLD CODE (BUGGY)
this.elements.attackerArmyInput.min = 1;
this.elements.attackerArmyInput.max = attackingTerritory.armies - 1; // When armies=2, max=1
this.elements.attackerArmyInput.value = Math.max(
  1,
  attackingTerritory.armies - 1
); // value=1
```

When attacker has 2 armies:

- `min = 1` (must leave 1 army)
- `max = 2 - 1 = 1` (cannot exceed 1)
- `value = Math.max(1, 1) = 1` (default to 1)

Result: **min === max === 1** → Input is LOCKED, user cannot change it!

### Why This Logic Was Wrong

The original logic tried to enforce "must leave 1 army in source territory" by setting `max = armies - 1`. This was incorrect because:

1. **The input represents "remaining armies AFTER battle"**, not "armies to transfer"
2. When attacker has 2 armies:
   - Remaining=1 means attacker lost 1 army ✓ Valid
   - Remaining=2 means attacker lost 0 armies ✓ Also valid!
3. The attacker should be able to choose **zero losses** (all armies survive)

## Solution

Changed the attacker input max value to allow **full range of possible outcomes**.

### Code Changes

**File**: `CombatUI.js` (lines ~935-954)

```javascript
// NEW CODE (FIXED)
if (this.elements.attackerArmyInput) {
  this.elements.attackerArmyInput.min = 1; // Must leave at least 1 army
  this.elements.attackerArmyInput.max = attackingTerritory.armies; // Can have 0 losses (all armies remain)

  // Default: suggest losing 1 army, but ensure it's valid
  const defaultRemaining = Math.max(1, attackingTerritory.armies - 1);
  this.elements.attackerArmyInput.value = Math.min(
    defaultRemaining,
    attackingTerritory.armies
  );

  console.log(
    `📊 Attacker input range: min=1, max=${attackingTerritory.armies}, value=${this.elements.attackerArmyInput.value}`
  );
}
```

### Key Changes

| Aspect    | Old Value                 | New Value                                   | Reason                            |
| --------- | ------------------------- | ------------------------------------------- | --------------------------------- |
| **min**   | 1                         | 1                                           | Unchanged - attacker must survive |
| **max**   | `armies - 1`              | `armies`                                    | Allow zero losses                 |
| **value** | `Math.max(1, armies - 1)` | `Math.min(Math.max(1, armies - 1), armies)` | Ensure valid default              |

### Example: 2 Army Attacker

**OLD (Buggy)**:

```javascript
armies = 2
min = 1
max = 2 - 1 = 1  ← LOCKED!
value = 1
Range: [1, 1] ← User cannot change
```

**NEW (Fixed)**:

```javascript
armies = 2
min = 1
max = 2  ← Can select 1 or 2
value = 1 (default suggests losing 1)
Range: [1, 2] ← User can choose 0 or 1 losses
```

### Possible Outcomes Now

For attacker with 2 armies:

- **Remaining = 1**: Attacker lost 1 army, defender lost X armies
- **Remaining = 2**: Attacker lost 0 armies, defender lost X armies

Both are valid! User chooses based on their desired battle outcome.

## Benefits

### 1. **User Control Restored**

- Users can now set any valid battle outcome
- No more forced losses for 2-army attackers

### 2. **Consistent with Risk Rules**

- Attackers CAN have zero losses in a battle
- Only requirement: must have at least 1 army remaining

### 3. **Flexible Battle Outcomes**

- Users can simulate various battle scenarios:
  - Decisive attacker victory (0 losses)
  - Close battle (both sides lose armies)
  - Pyrrhic victory (attacker loses more)

### 4. **Better UX**

- Input range always allows meaningful choices
- No confusion about locked inputs
- Clear console logging shows ranges

## Verification

### Test Cases

#### Test 1: 2 Army Attacker

```
Initial State:
- Attacker: 2 armies
- Defender: 5 armies

Attack Modal Opens:
- Attacker min: 1 ✓
- Attacker max: 2 ✓
- Attacker default: 1 ✓
- User can select: [1, 2] ✓

Battle Execution Options:
1. Remaining=1 → Attacker lost 1 army ✓
2. Remaining=2 → Attacker lost 0 armies ✓
```

#### Test 2: 3 Army Attacker

```
Initial State:
- Attacker: 3 armies
- Defender: 2 armies

Attack Modal Opens:
- Attacker min: 1 ✓
- Attacker max: 3 ✓
- Attacker default: 2 ✓
- User can select: [1, 2, 3] ✓

Battle Execution Options:
1. Remaining=1 → Attacker lost 2 armies ✓
2. Remaining=2 → Attacker lost 1 army ✓
3. Remaining=3 → Attacker lost 0 armies ✓
```

#### Test 3: 10 Army Attacker

```
Initial State:
- Attacker: 10 armies
- Defender: 8 armies

Attack Modal Opens:
- Attacker min: 1 ✓
- Attacker max: 10 ✓
- Attacker default: 9 ✓
- User can select: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] ✓

Battle Execution Options:
- Any value from 1-10 is valid
- Represents 9-0 losses respectively ✓
```

### Console Logs to Watch For

```
📊 Attacker input range: min=1, max=2, value=1
📊 Defender input range: min=0, max=5, value=4
```

These logs confirm the input ranges are set correctly.

## Related Code

### Input Validation

The battle execution still validates results using `CombatValidator`:

```javascript
const validator = new CombatValidator();
const validation = validator.validateBattleResult(
  attackingTerritory.armies, // Starting armies
  defendingTerritory.armies,
  attackerRemaining, // After battle
  defenderRemaining
);
```

The validator ensures:

- ✓ Attacker remaining >= 1 (cannot lose all)
- ✓ Defender remaining >= 0 (can lose all in conquest)
- ✓ Losses are non-negative
- ✓ Total armies don't increase

### Related Files

- `js/CombatUI.js` - Main fix location
- `js/CombatValidator.js` - Battle result validation
- `js/CombatSystem.js` - Combat rules enforcement

### Related Issues

- Army display fix (`ARMY_DISPLAY_FIX.md`)
- Conquest modal fix (`CONQUEST_COMBAT_INSTANCE_FIX.md`)
- Event handler fix (`CONQUEST_MODAL_EVENT_FIX.md`)

## Technical Notes

### Why Not Just Disable for 2 Armies?

We could have added special logic like:

```javascript
if (attackingTerritory.armies === 2) {
  // Special case handling
}
```

But this is BAD because:

1. Creates unnecessary edge cases
2. Doesn't solve the underlying issue
3. Would need similar checks for 3, 4, etc. armies

The correct fix is to **use the right formula for all cases**.

### Input Semantics

**Critical**: The input represents "**remaining armies after battle**", NOT:

- ❌ "armies to attack with"
- ❌ "armies to transfer"
- ❌ "losses to inflict"

Understanding this semantic is key to setting correct ranges:

- **min = 1**: Attacker must have at least 1 army remaining
- **max = total armies**: Attacker can have zero losses (all survive)

### Default Value Strategy

The default suggests "reasonable battle outcome" (attacker loses 1 army):

```javascript
const defaultRemaining = Math.max(1, attackingTerritory.armies - 1);
```

But we ensure it's within valid range:

```javascript
this.elements.attackerArmyInput.value = Math.min(
  defaultRemaining,
  attackingTerritory.armies // Don't exceed max
);
```

This gives users a sensible starting point while allowing full flexibility.

## Conclusion

This fix resolves the locked input issue for 2-army attackers by correctly setting the input range to allow zero losses. The solution:

- ✅ Allows user control for all army counts
- ✅ Maintains Risk game rules
- ✅ Provides flexible battle outcomes
- ✅ Works consistently across all scenarios

The key insight: **Input max should equal total armies** (allowing zero losses), not armies-1 (which incorrectly forces at least one loss).
