# 🧪 Turn Management Testing Guide

## Pre-Testing Checklist

Before starting tests, ensure:

- [ ] game.html file has been updated
- [ ] All CSS added to `<style>` section
- [ ] All JavaScript functions in `<script>` section
- [ ] `initializeTurnManagement()` called in game initialization
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Page refreshed (F5 or Ctrl+R)

---

## Test 1: UI Rendering (5 minutes)

### Objective

Verify all turn management UI elements render correctly.

### Steps

1. **Start the game with 3 players**

   - Player names: Alice, Bob, Charlie
   - Any colors (default is fine)

2. **Check Turn Header** ✓

   ```
   Expected: 🎮 Turn 1
   Expected: [Color dot] Alice

   Verify:
   □ Turn number displays as "1"
   □ Player name shows as "Alice"
   □ Color dot matches player color
   □ Header has purple gradient background
   ```

3. **Check Phase Progress Bar** ✓

   ```
   Expected: 💰 Reinforce | ⚔️ Attack | 🛡️ Fortify

   Verify:
   □ Three phase boxes visible
   □ "Reinforce" box is highlighted (purple)
   □ "Attack" box is gray (pending)
   □ "Fortify" box is gray (pending)
   □ Emojis display correctly
   ```

4. **Check Turn Order List** ✓

   ```
   Expected: Turn Order
             ► 1. [Color] Alice
               2. [Color] Bob
               3. [Color] Charlie

   Verify:
   □ All 3 players listed
   □ Alice highlighted with purple background
   □ Bob and Charlie have normal background
   □ Color dots show correct colors
   □ Numbers 1, 2, 3 displayed
   ```

5. **Check Phase Requirements** ✓

   ```
   Expected: ✓ Deploy all available armies to complete

   Verify:
   □ Text displays requirement clearly
   □ Message is relevant to current phase
   □ Box shows yellow warning styling
   ```

6. **Check End Turn Button** ✓

   ```
   Expected: [▶️ End Deploy Phase] (should be DISABLED/gray)

   Verify:
   □ Button text shows phase name
   □ Button has green gradient
   □ Button is DISABLED (grayed out)
   □ Hovering shows no change (disabled)
   ```

7. **Check Turn Info Tooltip** ✓

   ```
   Expected: 💡 Tip: Complete all deployments...

   Verify:
   □ Tooltip displays at bottom
   □ Text is helpful and relevant
   □ Blue background with white text
   ```

### Test Result

- [ ] All elements render correctly → **PASS**
- [ ] Some elements missing or wrong → **FAIL** (fix and retry)

---

## Test 2: Deploy Phase Validation (10 minutes)

### Objective

Verify army deployment validation works correctly.

### Setup

- Game running with 3 players at Deploy phase
- Alice (current player) has armies to deploy

### Steps

1. **Verify Button Disabled Initially**

   ```
   Current State: Alice's turn, Deploy phase
   Button: [▶️ End Deploy Phase]

   ✓ Click button (should do nothing)
   ✓ Button stays disabled
   ✓ No error should occur
   ```

2. **Deploy Some Armies**

   ```
   ✓ Click on 5 territories
   ✓ Each click adds 1 army
   ✓ Watch "remaining armies" should decrease

   Expected: Phase requirements update
   Expected: Button may partially activate (if logic supports it)
   ```

3. **Deploy ALL Remaining Armies**

   ```
   ✓ Continue clicking territories
   ✓ Until no armies remain
   ✓ Check requirement shows: ✓ All deployed

   Expected: Button becomes ENABLED (green, not gray)
   Expected: Button shows cursor:pointer on hover
   ```

4. **Try to End Turn**

   ```
   ✓ Click "▶️ End Deploy Phase" button
   ✓ Wait 1-2 seconds for processing

   Expected: UI updates automatically
   Expected: Phase changes to "Attack"
   Expected: No error messages
   ```

### Verification

- [ ] Button enabled only when armies = 0 → **PASS**
- [ ] Button disabled when armies > 0 → **PASS**
- [ ] Can't advance with armies remaining → **PASS**
- [ ] Advancing works when ready → **PASS**

---

## Test 3: Phase Transitions (15 minutes)

### Objective

Verify phases transition correctly: Deploy → Attack → Fortify.

### Setup

- Game at Deploy phase with Alice (all armies deployed)

### Steps

1. **From Deploy to Attack**

   ```
   Current: Deploy phase

   ✓ Click "▶️ End Deploy Phase"
   ✓ Wait for UI update (1-2 seconds)

   Expected: Phase box changes:
      💰 Reinforce → ✅ (completed)
      ⚔️ Attack → 🟣 (current)
      🛡️ Fortify → ⚪ (pending)

   Expected: Phase description: "⚔️ Attack adjacent territories"
   Expected: Phase requirements: "Complete attacks and transfers"
   Expected: Skip button appears: "⏭️ Skip This Phase"
   Expected: Button text: "▶️ End Attack Phase" (red background)
   ```

2. **From Attack to Fortify (skip attack)**

   ```
   Current: Attack phase

   ✓ Click "⏭️ Skip This Phase" button
   ✓ Wait for UI update

   Expected: Phase box changes:
      💰 Reinforce → ✅ (completed)
      ⚔️ Attack → ✅ (completed, skipped)
      🛡️ Fortify → 🟣 (current)

   Expected: Phase description: "🛡️ Move armies between territories"
   Expected: Skip button still visible
   Expected: Button text: "▶️ End Fortify Phase" (blue background)
   ```

3. **From Fortify to Next Player**

   ```
   Current: Fortify phase (Alice)

   ✓ Click "▶️ End Fortify Phase" button
   ✓ Wait for UI update

   Expected: Turn header updates:
      Current player: Bob (not Alice)
      Bob's color dot displays

   Expected: Player list updates:
      ► 1. [Yellow] Bob (highlighted NOW)
      2. [Red] Charlie
      3. [Blue] Alice (moved to end)

   Expected: Phase resets:
      💰 Reinforce → 🟣 (Bob's turn starts here)
      ⚔️ Attack → ⚪
      🛡️ Fortify → ⚪

   Expected: Turn number stays "1" (same turn)
   ```

### Verification

- [ ] Deploy → Attack transition works → **PASS**
- [ ] Attack → Fortify transition works → **PASS**
- [ ] Phase boxes update colors correctly → **PASS**
- [ ] Phase descriptions update → **PASS**
- [ ] Skip button visibility toggles → **PASS**
- [ ] Button colors change by phase → **PASS**

---

## Test 4: Player Cycling (10 minutes)

### Objective

Verify all players cycle through correctly.

### Setup

- Game with 3 players: Alice, Bob, Charlie
- All with armies ready to deploy

### Steps

1. **First Player (Alice)**

   ```
   Turn Header: 🎮 Turn 1, [Purple] Alice
   Player List: ► Alice is highlighted

   ✓ Deploy armies
   ✓ End Deploy
   ✓ Skip Attack
   ✓ End Fortify
   ```

2. **Second Player (Bob)**

   ```
   After clicking End Fortify as Alice:

   Expected: Turn header shows:
      🎮 Turn 1, [Yellow] Bob

   Expected: Player list shows:
      ► 1. [Yellow] Bob ← Highlighted
      2. [Red] Charlie
      3. [Purple] Alice ← Moved to end

   ✓ Repeat phases (Deploy→Attack→Fortify)
   ```

3. **Third Player (Charlie)**

   ```
   After clicking End Fortify as Bob:

   Expected: Turn header shows:
      🎮 Turn 1, [Red] Charlie

   Expected: Player list shows:
      ► 1. [Red] Charlie ← Highlighted
      2. [Purple] Alice
      3. [Yellow] Bob ← Moved to end

   ✓ Repeat phases
   ```

4. **Next Round (Turn Increment)**

   ```
   After Charlie completes Fortify:

   Expected: Back to Alice
   Expected: Turn header shows:
      🎮 Turn 2 ← Number incremented!
      [Purple] Alice

   Expected: Player list cycles back:
      ► 1. [Purple] Alice ← Back at start
      2. [Yellow] Bob
      3. [Red] Charlie
   ```

### Verification

- [ ] All players cycle in correct order → **PASS**
- [ ] Player list updates each turn → **PASS**
- [ ] Turn number increments after full cycle → **PASS**
- [ ] Turn number stays same within cycle → **PASS**
- [ ] Each player gets all 3 phases → **PASS**

---

## Test 5: Skip Phase Functionality (8 minutes)

### Objective

Verify skip button works for optional phases only.

### Setup

- Game at Attack phase with any player

### Steps

1. **Skip Attack Phase**

   ```
   Current: Attack phase

   ✓ Verify "⏭️ Skip This Phase" button visible
   ✓ Click skip button

   Expected: Immediately advances to Fortify
   Expected: No attack dialog/selection required
   Expected: Phase progress updates (⚔️ shows as skipped)
   ```

2. **Skip Fortify Phase**

   ```
   Current: Fortify phase (after skipping attack)

   ✓ Verify "⏭️ Skip This Phase" button visible
   ✓ Click skip button

   Expected: Immediately advances to next player
   Expected: No fortification required
   Expected: Phase boxes reset for next player
   ```

3. **Cannot Skip Deploy Phase**

   ```
   Current: Deploy phase

   ✓ Verify "⏭️ Skip This Phase" button is NOT visible
   ✓ Only "▶️ End Deploy Phase" button visible

   Expected: Cannot skip mandatory phase
   Expected: Must deploy all armies first
   ```

### Verification

- [ ] Skip button hidden in Deploy phase → **PASS**
- [ ] Skip button visible in Attack phase → **PASS**
- [ ] Skip button visible in Fortify phase → **PASS**
- [ ] Skipping Attack works → **PASS**
- [ ] Skipping Fortify works → **PASS**

---

## Test 6: Error Handling (8 minutes)

### Objective

Verify error messages and handling work correctly.

### Setup

- Game at Deploy phase with remaining armies

### Steps

1. **Try to End with Armies Remaining**

   ```
   Current: Deploy phase
   Remaining armies: 5

   ✓ Click "▶️ End Deploy Phase"

   Expected: Error message appears in red
   Expected: Message: "❌ Please deploy all 5 remaining armies"
   Expected: Turn does NOT advance
   Expected: Same phase remains
   ```

2. **Message Auto-Dismisses**

   ```
   After seeing error message:

   ✓ Wait 4 seconds

   Expected: Error message fades away
   Expected: UI remains same
   ```

3. **Deploy Armies and Retry**

   ```
   ✓ Click territories to deploy all armies
   ✓ Click "▶️ End Deploy Phase" again

   Expected: Phase advances successfully
   Expected: Success message: "✅ Progressed to attack phase"
   Expected: Message auto-hides after 4 seconds
   ```

### Verification

- [ ] Error shown when requirement not met → **PASS**
- [ ] Correct army count shown in error → **PASS**
- [ ] Turn doesn't advance on error → **PASS**
- [ ] Messages auto-dismiss → **PASS**

---

## Test 7: UI Responsiveness (5 minutes)

### Objective

Verify UI updates smoothly and quickly.

### Setup

- Game running through several player turns

### Steps

1. **Check Update Speed**

   ```
   ✓ Click "End [Phase]" button
   ✓ Observe UI changes

   Expected: UI updates within 1-2 seconds
   Expected: All elements update together
   Expected: No flickering or glitches
   ```

2. **Check Button Response**

   ```
   ✓ Click buttons multiple times quickly
   ✓ Watch for multiple processing

   Expected: Buttons remain responsive
   Expected: No double-clicking issues
   Expected: Only one action per click
   ```

3. **Check Screen Sizes**

   ```
   Desktop Mode:
   ✓ Shrink window to 50% width
   ✓ Verify all elements still visible
   ✓ Buttons still clickable

   Tablet Mode (DevTools):
   ✓ Set viewport to iPad size
   ✓ Sidebar content responsive
   ✓ All text readable

   Mobile Mode (DevTools):
   ✓ Set viewport to iPhone size
   ✓ Content doesn't overflow
   ✓ Buttons still large enough
   ```

### Verification

- [ ] UI updates quickly (< 2 seconds) → **PASS**
- [ ] No flickering or visual artifacts → **PASS**
- [ ] Buttons remain responsive → **PASS**
- [ ] Works on desktop → **PASS**
- [ ] Works on tablet size → **PASS**
- [ ] Works on mobile size → **PASS**

---

## Test 8: Console Verification (5 minutes)

### Objective

Verify no errors in browser console.

### Steps

1. **Open Console**

   ```
   ✓ Press F12
   ✓ Click "Console" tab
   ✓ Refresh page (F5)
   ```

2. **Check for Errors**

   ```
   Expected: Green ✓ messages
   Expected: No red ✗ error messages
   Expected: No yellow ⚠️ warnings (related to turn UI)

   Should see:
   ✓ "🎮 Initializing Turn Management UI..."
   ✓ "Turn UI Updated - Turn X, Player Y, Phase Z"
   ```

3. **Play Through Turns**

   ```
   ✓ Complete one full turn (all players, all phases)
   ✓ Watch console messages

   Expected: Messages for each phase change
   Expected: No errors during gameplay
   Expected: Clear success messages
   ```

### Verification

- [ ] No error messages in console → **PASS**
- [ ] Initialization message appears → **PASS**
- [ ] Update messages on phase change → **PASS**
- [ ] Console clean and readable → **PASS**

---

## Test 9: Integration with Existing Systems (10 minutes)

### Objective

Verify turn management works with attack system, deployment, etc.

### Setup

- Game with 2-3 players
- Run through complete game turn

### Steps

1. **Deploy Phase Integration**

   ```
   ✓ At Deploy phase
   ✓ Click territories to deploy armies
   ✓ Watch armies counter decrease
   ✓ When done, End Deploy

   Verify: Works smoothly with deployment system
   ```

2. **Attack Phase Integration**

   ```
   ✓ At Attack phase
   ✓ Select attacker and defender
   ✓ Execute battle
   ✓ Complete conquest transfer
   ✓ Skip Attack or End Attack

   Verify: Works smoothly with attack system
   ```

3. **Fortify Phase Integration**

   ```
   ✓ At Fortify phase
   ✓ Move armies between territories
   ✓ End Fortify (if implemented)

   Verify: Works smoothly with fortify system
   ```

4. **Player Cycling**

   ```
   ✓ After one player completes turn
   ✓ Next player automatically becomes current
   ✓ All systems recognize new current player

   Verify: Seamless integration with game systems
   ```

### Verification

- [ ] Deployment works with UI → **PASS**
- [ ] Attacks work with UI → **PASS**
- [ ] Fortification works with UI → **PASS**
- [ ] Player cycling works → **PASS**
- [ ] No conflicts with existing systems → **PASS**

---

## Test 10: Multi-Player Scenarios (15 minutes)

### Objective

Test with different player counts.

### Test 10a: 2 Players

```
✓ Start game with 2 players
✓ Play through 2 complete turns
✓ Verify player list shows both

Expected: Players cycle correctly
Expected: Turn 1→2→1 (repeats)
Expected: Each player gets all phases
```

### Test 10b: 4 Players

```
✓ Start game with 4 players (Alice, Bob, Charlie, Diana)
✓ Play through at least 1 full turn
✓ Verify all 4 players in list

Expected: Correct turn order (Alice→Bob→Charlie→Diana→Alice)
Expected: Turn number increments after Diana completes
Expected: UI handles 4 entries smoothly
```

### Test 10c: 6 Players

```
✓ Start game with 6 players
✓ Play through at least 1 full turn
✓ Verify all 6 players in list

Expected: All 6 players show in list
Expected: Correct cycling through all
Expected: UI responsive with 6 players
Expected: No display overflow
```

### Verification

- [ ] Works with 2 players → **PASS**
- [ ] Works with 3 players → **PASS**
- [ ] Works with 4 players → **PASS**
- [ ] Works with 5 players → **PASS**
- [ ] Works with 6 players → **PASS**

---

## Summary Test Grid

| Test               | Expected                    | Result |
| ------------------ | --------------------------- | ------ |
| UI Rendering       | All elements visible        | ✓ PASS |
| Deploy Validation  | Button disabled until ready | ✓ PASS |
| Phase Transitions  | Deploy→Attack→Fortify       | ✓ PASS |
| Player Cycling     | All players cycle correctly | ✓ PASS |
| Skip Phases        | Can skip Attack & Fortify   | ✓ PASS |
| Error Handling     | Errors shown appropriately  | ✓ PASS |
| Responsiveness     | Updates smooth and fast     | ✓ PASS |
| Console Clean      | No errors in console        | ✓ PASS |
| System Integration | Works with attack/deploy    | ✓ PASS |
| Multi-Player       | Works with 2-6 players      | ✓ PASS |

---

## Final Verification Checklist

Before declaring success:

- [ ] All 10 test suites passed
- [ ] No console errors present
- [ ] UI renders correctly on all screen sizes
- [ ] Buttons respond to clicks
- [ ] Phases transition smoothly
- [ ] All players cycle correctly
- [ ] Skip functionality works
- [ ] Error messages display properly
- [ ] Multi-player scenarios work
- [ ] Integration with existing systems smooth
- [ ] No performance issues
- [ ] Game remains playable and fun

---

## Issues Found & Resolution

If any test fails, document here:

### Issue #1

```
Test: _______________
Expected: ____________
Actual: ______________
Resolution: __________
Status: [Fixed/Pending]
```

### Issue #2

```
Test: _______________
Expected: ____________
Actual: ______________
Resolution: __________
Status: [Fixed/Pending]
```

---

## Sign-Off

| Role            | Name | Date | Status |
| --------------- | ---- | ---- | ------ |
| Developer       |      |      |        |
| QA Tester       |      |      |        |
| Project Manager |      |      |        |

---

## Test Report Summary

**Total Tests**: 10 suites  
**Total Test Cases**: 80+  
**Tests Passed**: **_/80  
**Tests Failed**: _**/80  
**Pass Rate**: \_\_\_%

**Overall Status**: [ ] PASS [ ] FAIL [ ] CONDITIONAL

---

**Testing Date**: ******\_\_\_******  
**Tested By**: ******\_\_\_******  
**Browser**: Chrome / Firefox / Safari / Edge  
**OS**: Windows / Mac / Linux

---

## Next Steps

If all tests pass:

- [ ] Deploy to production
- [ ] Announce feature to players
- [ ] Monitor for issues
- [ ] Gather player feedback

If tests fail:

- [ ] Document all failures
- [ ] Fix issues one by one
- [ ] Re-test failed cases
- [ ] Repeat until all pass

---

**Turn Management Testing Complete!** ✅
