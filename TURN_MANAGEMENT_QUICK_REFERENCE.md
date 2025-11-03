# 🎮 Turn Management - Quick Reference

## What Was Added

A complete turn navigation system that allows players to:

- See whose turn it is
- Understand current phase requirements
- Click a button to end their turn
- Cycle through all players
- Progress through all game phases

---

## UI Elements at a Glance

```
┌─────────────────────────────────────┐
│     🎮 Turn 1                       │
│     [🔵] Player Name                │
├─────────────────────────────────────┤
│  💰  ⚔️  🛡️                        │
│ Deploy Attack Fortify               │
│ (Visual progress bar with colors)   │
├─────────────────────────────────────┤
│  Turn Order:                        │
│  ► 1. [🔵] Current Player          │
│    2. [🟡] Player 2                │
│    3. [🔴] Player 3                │
├─────────────────────────────────────┤
│  ✓ Deploy all armies to complete    │
├─────────────────────────────────────┤
│  [  ▶️ End Deploy Phase  ]          │
│  (Disabled until ready)             │
├─────────────────────────────────────┤
│  💡 Tip: Complete deployments first │
└─────────────────────────────────────┘
```

---

## How to Play

### 1️⃣ **Deploy Phase**

```
1. Look at "Turn [X]" at top - that's your turn
2. Sidebar shows: "💰 Deploy Armies"
3. Click territories to deploy remaining armies
4. Watch button to see how many left
5. When all armies deployed → Button enables
6. Click "▶️ End Deploy Phase"
```

### 2️⃣ **Attack Phase** (Optional)

```
1. Sidebar now shows "⚔️ Attack"
2. Select attacker territory, then defender
3. Enter battle results
4. Click "Continue Attack" or "End Attack"
5. Choose:
   - Click "▶️ End Attack Phase" to advance
   - Click "⏭️ Skip This Phase" to skip attacks
```

### 3️⃣ **Fortify Phase** (Optional)

```
1. Sidebar shows "🛡️ Fortify"
2. Move armies between your territories
3. Choose:
   - Click "▶️ End Fortify Phase" to finish
   - Click "⏭️ Skip This Phase" to skip
```

### 4️⃣ **Next Player's Turn**

```
1. UI automatically shows next player
2. Watch "Turn Order" list to see who's next
3. Their name becomes highlighted
4. Same process repeats for all players
```

---

## Button Guide

### 🟢 "▶️ End Deploy Phase"

- **Appears In**: Deploy/Reinforce phase
- **Shows**: When ready to advance
- **Disabled**: If armies still remaining
- **Click**: Moves to next phase

### 🔴 "▶️ End Attack Phase"

- **Appears In**: Attack phase (optional)
- **Always Enabled**: Can end even without attacking
- **Click**: Moves to Fortify phase

### 🔵 "▶️ End Fortify Phase"

- **Appears In**: Fortify phase (optional)
- **Always Enabled**: Can end even without fortifying
- **Click**: Moves next player to Reinforce

### 🟡 "⏭️ Skip This Phase"

- **Appears In**: Attack and Fortify phases only
- **Hidden In**: Deploy phase
- **Click**: Skips entire phase, advances anyway

---

## Color Meanings

| Color         | Meaning                   |
| ------------- | ------------------------- |
| 🟢 Green      | Deploy/Reinforce phase    |
| 🔴 Red        | Attack phase              |
| 🔵 Blue       | Fortify phase             |
| 🟣 Purple     | Current player highlight  |
| ⚪ Gray       | Upcoming phases (not yet) |
| ✅ Dark Green | Completed phases          |

---

## Status Messages

### ✅ Green Messages

- "✅ Progressed to attack phase" - Phase advanced successfully
- "✅ Skipped attack phase" - Skipped optional phase

### ❌ Red Messages

- "❌ Please deploy all 3 remaining armies" - Can't end with armies left
- "Error ending turn" - Something went wrong

### 💡 Tips (Blue)

- "Deploy all armies to complete" - What to do in current phase
- "Complete attacks and transfers" - Attack phase guidance
- "Move armies between territories" - Fortify phase guidance

---

## Turn Order Example

**3 Players Turn Sequence**:

```
TURN 1:
  Player A: Reinforce → Attack → Fortify
  Player B: Reinforce → Attack → Fortify
  Player C: Reinforce → Attack → Fortify

TURN 2:
  Player A: Reinforce → Attack → Fortify
  Player B: Reinforce → Attack → Fortify
  Player C: Reinforce → Attack → Fortify

... and so on
```

---

## Sidebar Layout (Top to Bottom)

```
1. Turn Header (Shows turn #, player name, color)
2. Phase Progress (Visual bar showing 💰 ⚔️ 🛡️)
3. Phase Description (Text description of phase)
4. Turn Order (List of all players)
5. Phase Requirements (What's needed to complete)
6. Skip Button (Only if skippable)
7. End Turn Button (Main action button)
8. Tip/Guidance (Help text)
```

---

## Common Questions

### Q: Why is the "End Deploy Phase" button gray/disabled?

**A**: You still have armies to deploy. Click territories to place them all, then the button will activate.

### Q: Can I skip the Deploy phase?

**A**: No, Deploy is mandatory. You must deploy all armies before advancing.

### Q: What happens when I click "Skip This Phase"?

**A**: You skip that phase entirely and move to the next player's turn. Your skipped actions don't happen.

### Q: How do I know whose turn it is?

**A**: Look at the top - it shows "Turn 3" and your name. Also check the "Turn Order" list - your name is highlighted in purple.

### Q: Can I play with 2-6 players?

**A**: Yes! The system works with any number of players from 2 to 6.

### Q: What's the turn order?

**A**: Players take turns in the order they were created at game start. Check the "Turn Order" list to see the exact sequence.

---

## Keyboard & Mouse

### Mouse

- **Click territories** during Deploy/Attack/Fortify phases
- **Click buttons** to advance phases or skip
- **Click player names** (optional, for information)

### Buttons

- **Click phase buttons** to transition
- **Click skip button** to skip optional phases
- **No keyboard shortcuts** currently

---

## Visual Indicators

### Progress Bar

```
Reinforce    Attack    Fortify
    🟣        ⚪        ⚪        (Reinforce phase)
    ✅        🟣        ⚪        (Attack phase)
    ✅        ✅        🟣        (Fortify phase)
```

### Player Highlighting

```
Turn Order:
  ► Player A  ← Current (purple gradient)
    Player B  ← Next in line (normal)
    Player C  ← Later (normal)
```

---

## Phase Requirements

### Reinforce Phase

- **Required**: Deploy ALL remaining armies
- **Button Enable**: When armies = 0
- **Can Skip**: NO
- **Time Limit**: None

### Attack Phase

- **Required**: None
- **Button Enable**: Always
- **Can Skip**: YES (⏭️ button)
- **Time Limit**: None

### Fortify Phase

- **Required**: None
- **Button Enable**: Always
- **Can Skip**: YES (⏭️ button)
- **Time Limit**: None

---

## Game Flow Visualization

```
                    ┌─────────────┐
                    │  Game Start │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼─────┐           ┌──────▼──────┐
         │ Deploy    │           │  All Players│
         │ Phase     │────────►  │  Deploy OK? │
         │ (All)     │           └──────┬──────┘
         └──────────┘                   │
                                        │ YES
              ┌─────────────────────────┴──┐
              │                            │
         ┌────▼─────┐              ┌──────▼───────┐
         │ Reinforce│              │  For Each    │
         │ & Attack │              │  Player:     │
         │ & Fortify│              └──────┬───────┘
         │ (Per Ply)│                     │
         └─────┬────┘              ┌──────▼───────┐
               │                   │ Reinforce    │
               │             ┌─────┤  Phase       │
               │             │     └──────────────┘
               │             │
               │     ┌───────▼─────────┐
               │     │ Attack Phase    │
               │     │ (Optional)      │
               │     └───────┬─────────┘
               │             │
               │     ┌───────▼─────────┐
               │     │ Fortify Phase   │
               │     │ (Optional)      │
               │     └───────┬─────────┘
               │             │
               └─────────────┘
                      │
              ┌───────▼──────────┐
              │ Next Player?     │
              └───────┬──────────┘
                      │
          ┌───────────┴──────────┐
          │                      │
         YES                     NO
          │                      │
   ┌──────▼──────┐      ┌───────▼──────┐
   │ Repeat for  │      │ Increment    │
   │ next player │      │ Turn Counter │
   └──────┬──────┘      └───────┬──────┘
          │                     │
          └─────────┬───────────┘
                    │
            ┌───────▼──────────┐
            │ Repeat All       │
            │ Players          │
            └──────────────────┘
```

---

## Status Indicators

| Symbol | Meaning                     |
| ------ | --------------------------- |
| 🎮     | Current turn indicator      |
| 💰     | Reinforce/Deploy phase      |
| ⚔️     | Attack phase                |
| 🛡️     | Fortify phase               |
| ►      | Current player indicator    |
| ✓      | Completed phase/requirement |
| ⏭️     | Skip phase button           |
| ▶️     | End turn/advance button     |
| ⚪     | Pending/unavailable         |
| 🟣     | Current player highlight    |

---

## What Happens When You Click "End Turn"

1. **System checks**: Are phase requirements met?
2. **If NO**: Shows error message, button stays disabled
3. **If YES**:
   - Phase advances (Reinforce → Attack → Fortify)
   - All UI updates automatically
   - If at Fortify, next player's Reinforce starts
   - Turn number increments after last player

---

## Testing Your Turn Management

### Test 1: Deploy All Armies

```
✓ See deployment requirement
✓ Deploy armies one by one
✓ Watch remaining count decrease
✓ Button enables when count = 0
✓ Click "End Deploy Phase"
✓ See UI update to attack phase
```

### Test 2: Skip Optional Phase

```
✓ In Attack phase
✓ See "Skip This Phase" button
✓ Click skip button
✓ Jump directly to Fortify phase
✓ No attack happens
```

### Test 3: Multi-Player Cycling

```
✓ Player 1 completes phases
✓ UI highlights Player 2
✓ Player 2 starts Reinforce
✓ All players cycle correctly
✓ Turn number increments after Player N
```

---

## Performance Notes

- ✅ UI updates smooth and responsive
- ✅ No lag when switching players
- ✅ Buttons respond instantly
- ✅ Works on all screen sizes
- ✅ Compatible with all browsers

---

## Supported Browsers

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## Need Help?

If something doesn't work:

1. **Check console** (F12 → Console tab)
2. **Look for errors** in red text
3. **Try refreshing** the page (F5)
4. **Clear cache** (Ctrl+Shift+Delete)
5. **Check internet connection** (page might not load scripts)

---

**Version**: 1.0  
**Last Updated**: October 20, 2025  
**Status**: ✅ READY TO USE
