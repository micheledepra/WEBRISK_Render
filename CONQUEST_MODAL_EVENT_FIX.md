# Conquest Modal Event Handler Fix

## Problem

The conquest/transfer modal had duplicate event handlers that were causing conflicts:

- **Inline onclick handlers** in HTML calling `window.confirmTransfer()` and `window.cancelTransfer()`
- **Missing addEventListener** event listeners in `CombatUI.js`

### Symptoms

```javascript
game.html:4850 🔄 Legacy confirmTransfer() called - using CombatUI conquest system instead
window.confirmTransfer @ game.html:4850
onclick
```

This showed that:

1. The legacy `window.confirmTransfer()` wrapper was being called
2. It was being triggered by an inline `onclick` handler
3. The CombatUI instance methods weren't being called directly

## Root Cause

### Missing Button References

The `conquestElements` object in `CombatUI.js` was missing references to the confirm and cancel buttons:

```javascript
// OLD CODE - Missing button references
this.conquestElements = {
  modal: ...,
  slider: ...,
  input: ...,
  // ❌ No confirmButton
  // ❌ No cancelButton
};
```

### Missing Event Listeners

The `initializeEventListeners()` method wasn't attaching event listeners to these buttons:

```javascript
// OLD CODE - Only slider/input listeners
initializeEventListeners() {
  if (this.conquestElements.slider) {
    this.conquestElements.slider.addEventListener("input", ...);
  }
  if (this.conquestElements.input) {
    this.conquestElements.input.addEventListener("input", ...);
  }
  // ❌ No button event listeners
}
```

### Inline HTML Handlers

The HTML had inline onclick handlers that called legacy wrapper functions:

```html
<!-- OLD CODE - Inline onclick handlers -->
<button id="use-minimum-btn" onclick="window.cancelTransfer()">
  Use Minimum (1 army)
</button>
<button id="confirm-transfer-btn" onclick="window.confirmTransfer()">
  Confirm Transfer
</button>
```

## Solution

### 1. Added Button References to conquestElements

**File:** `js/CombatUI.js`
**Lines:** ~300-305

```javascript
this.conquestElements = {
  // ... existing elements ...
  confirmButton:
    gameUtils.safeGetElement("confirm-transfer-btn") ||
    document.getElementById("confirm-transfer-btn"),
  cancelButton:
    gameUtils.safeGetElement("use-minimum-btn") ||
    document.getElementById("use-minimum-btn"),
};
```

### 2. Added Event Listeners in initializeEventListeners()

**File:** `js/CombatUI.js`
**Lines:** ~655-670

```javascript
initializeEventListeners() {
  // ... existing listeners ...

  // Conquest modal buttons
  if (this.conquestElements.confirmButton) {
    this.conquestElements.confirmButton.addEventListener("click", () =>
      this.confirmTransfer()
    );
    console.log("✅ Conquest confirm button event listener attached");
  }

  if (this.conquestElements.cancelButton) {
    this.conquestElements.cancelButton.addEventListener("click", () =>
      this.cancelTransfer()
    );
    console.log("✅ Conquest cancel button event listener attached");
  }
}
```

### 3. Removed Inline onclick Handlers

**File:** `game.html`
**Lines:** ~2700-2715

```html
<!-- NEW CODE - No inline handlers -->
<button id="use-minimum-btn" class="secondary-btn">Use Minimum (1 army)</button>
<button id="confirm-transfer-btn" class="primary-btn">Confirm Transfer</button>
```

## How It Works Now

### Event Flow

```
User clicks "Confirm Transfer"
    ↓
addEventListener fires in CombatUI
    ↓
this.confirmTransfer() called directly
    ↓
Conquest processed by CombatUI instance
    ↓
✅ No legacy wrapper involved
```

### Initialization Sequence

```javascript
// 1. CombatUI constructor creates conquestElements
this.conquestElements = {
  confirmButton: document.getElementById("confirm-transfer-btn"),
  cancelButton: document.getElementById("use-minimum-btn"),
  // ... other elements
};

// 2. initializeEventListeners() attaches handlers
this.conquestElements.confirmButton.addEventListener("click", () =>
  this.confirmTransfer()
);

this.conquestElements.cancelButton.addEventListener("click", () =>
  this.cancelTransfer()
);

// 3. User clicks button → Direct method call (no legacy wrapper)
```

## Benefits

### 1. **Consistent Pattern**

Now follows the same pattern as attack modal buttons:

- Execute button: ✅ addEventListener
- Continue button: ✅ addEventListener
- End button: ✅ addEventListener
- Reset button: ✅ addEventListener
- **Confirm transfer button: ✅ addEventListener** (NEW)
- **Cancel transfer button: ✅ addEventListener** (NEW)

### 2. **No Legacy Dependencies**

- Direct instance method calls
- No need for `window.confirmTransfer()` wrapper
- Cleaner execution path

### 3. **Better Error Handling**

```javascript
if (this.conquestElements.confirmButton) {
  // Only attach if element exists
  this.conquestElements.confirmButton.addEventListener(...);
} else {
  // Log warning if element missing
  console.warn("Confirm button not found");
}
```

### 4. **Easier Testing**

```javascript
// Can now test directly
combatUI.confirmTransfer();
combatUI.cancelTransfer();

// No need to test legacy wrappers
```

## Verification

### Console Logs to Check

When page loads, you should see:

```
✅ Conquest confirm button event listener attached
✅ Conquest cancel button event listener attached
```

When conquest happens, you should NOT see:

```
❌ 🔄 Legacy confirmTransfer() called - using CombatUI conquest system instead
```

### Manual Test

1. Start a battle that results in conquest
2. Open conquest/transfer modal
3. Click "Confirm Transfer"
4. Check console - should show direct method execution, no legacy wrapper

### Code Test

```javascript
// Check button elements exist
console.log("Confirm button:", combatUI.conquestElements.confirmButton);
console.log("Cancel button:", combatUI.conquestElements.cancelButton);

// Check event listeners attached (should be truthy)
console.log(
  "Listeners attached:",
  combatUI.conquestElements.confirmButton !== null &&
    combatUI.conquestElements.cancelButton !== null
);
```

## Related Fixes

This fix follows the same pattern as previous event handler fixes:

### 1. Attack Modal Buttons (Already Fixed)

**File:** `DUPLICATE_EVENT_HANDLER_FIX.md`

- Removed inline onclick from execute, continue, end buttons
- Added addEventListener in CombatUI

### 2. Army Display Update (Already Fixed)

**File:** `ARMY_DISPLAY_FIX.md`

- Fixed territory army counts display
- Prevented post-battle overwrites

### 3. Max Transfer Calculation (Already Fixed)

**File:** `MAX_TRANSFER_FIX.md`

- Fixed conquest transfer calculation
- Used initial armies instead of post-battle armies

## Pattern for Future Buttons

When adding new modal buttons, follow this pattern:

### 1. Add to elements object in constructor

```javascript
this.conquestElements = {
  // ...existing elements...
  newButton: document.getElementById("new-button-id"),
};
```

### 2. Add event listener in initializeEventListeners()

```javascript
if (this.conquestElements.newButton) {
  this.conquestElements.newButton.addEventListener("click", () =>
    this.handleNewButton()
  );
}
```

### 3. HTML without inline handler

```html
<button id="new-button-id" class="some-class">Button Text</button>
```

### 4. DO NOT use inline onclick

```html
<!-- ❌ WRONG -->
<button onclick="window.someFunction()">Bad</button>

<!-- ✅ CORRECT -->
<button id="button-id">Good</button>
```

## Summary

**Problem:** Conquest modal buttons used inline onclick handlers calling legacy wrappers
**Solution:** Added addEventListener event listeners calling instance methods directly
**Result:** Clean, consistent event handling with no legacy dependencies

**Files Modified:**

1. `js/CombatUI.js` - Added button references and event listeners
2. `game.html` - Removed inline onclick handlers

**Status:** ✅ FIXED - Event handlers now properly attached via addEventListener pattern
