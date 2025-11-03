# Duplicate Event Handler Fix

## 🐛 Problem

The combat system was executing battles **twice**, causing:

- Duplicate `executeAttack()` calls
- Conquest modal appearing twice
- Warnings: "⚠️ No active conquest in combat system, attempting recovery"

### Console Evidence

```
🎯 DEBUG: executeAttack called  <-- First call (inline onclick)
...
🎯 DEBUG: executeAttack called  <-- Second call (event listener)
```

## 🔍 Root Cause

The attack modal buttons had **duplicate event handlers**:

1. **Inline `onclick` attribute** in HTML
2. **Event listener** attached by `CombatUI.initializeEventListeners()`

### Example (Before Fix):

```html
<!-- WRONG: Both inline onclick AND event listener -->
<button id="attack-modal-execute" onclick="combatUI.executeAttack()">
  <!-- Handler #1 -->
  COMMENCE BATTLE
</button>
```

```javascript
// CombatUI.js line 619
this.elements.executeButton.addEventListener(
  "click",
  () => this.executeAttack() // Handler #2
);
```

When clicked: Both handlers fire → `executeAttack()` runs **twice**

## ✅ Solution

Removed all inline `onclick` handlers from attack modal buttons. Event listeners are now **only** attached by `CombatUI.initializeEventListeners()`.

### Buttons Fixed (game.html)

| Button ID               | Line | Removed Inline Handler               |
| ----------------------- | ---- | ------------------------------------ |
| `attack-modal-execute`  | 2560 | `onclick="combatUI.executeAttack()"` |
| `attack-modal-continue` | 2582 | `onclick="window.continueAttack()"`  |
| `attack-modal-end`      | 2585 | `onclick="window.endAttack()"`       |

### After Fix:

```html
<!-- CORRECT: Only event listener (attached by CombatUI.js) -->
<button id="attack-modal-execute">COMMENCE BATTLE</button>
```

## 📊 Impact

**Before:**

- ❌ `executeAttack()` called 2x per button click
- ❌ Battle executed twice
- ❌ Conquest modal shown twice
- ❌ State updated twice (potentially corrupting data)

**After:**

- ✅ `executeAttack()` called 1x per button click
- ✅ Battle executed once
- ✅ Conquest modal shown once
- ✅ State updated once (clean and accurate)

## 🧪 Testing

After this fix, when you click "COMMENCE BATTLE":

✅ Should see `🎯 DEBUG: executeAttack called` **only once**  
✅ Battle should execute **once**  
✅ Conquest modal should appear **once**  
✅ No "attempting recovery" warnings

## 📝 Best Practice

**Rule:** Never use both inline `onclick` and `addEventListener()` for the same button.

**Choose one approach:**

### Option 1: Event Listeners (Recommended)

```javascript
// In JavaScript
element.addEventListener("click", () => handleClick());
```

### Option 2: Inline Handlers

```html
<!-- In HTML -->
<button onclick="handleClick()">Click Me</button>
```

**CombatUI uses Option 1** (event listeners), so all inline handlers were removed.

## 🎯 Related Files

- ✅ `game.html` - Lines 2560, 2582, 2585 (removed inline onclick)
- ✅ `js/CombatUI.js` - Lines 614-633 (event listeners remain)

The combat system now has clean, single-responsibility event handling! 🎉
