# Statistics Manager Integration Guide

## Overview
The StatisticsManager has been fully integrated into your Risk game, providing comprehensive battle tracking, player performance metrics, and detailed analytics displayed in the existing dashboard.

## What's Been Added

### 1. StatisticsManager.js (NEW)
**Location:** `js/StatisticsManager.js`

**Features:**
- ✅ Real-time battle tracking with detailed outcomes
- ✅ Player performance metrics (win/loss ratios, casualties, etc.)
- ✅ Territory conquest history
- ✅ Phase change logging
- ✅ Deployment and fortification tracking
- ✅ Continent control monitoring
- ✅ LocalStorage persistence for cross-session tracking

**Key Capabilities:**
- Automatically hooks into existing game systems (AttackManager, PhaseManager, FortificationManager)
- Non-intrusive - doesn't modify core game logic
- Tracks every battle with attacker/defender losses and conquest results
- Calculates advanced metrics like Kill/Death ratios and win rates

### 2. Enhanced Dashboard
**Location:** `Stats/dashboard.html`

**New Sections Added:**

#### Game Overview Mode:
- **⚔️ Battle Performance Card**: Win/loss records with percentages for all players
- **💀 Casualties Report Card**: Armies killed vs lost with K/D ratios
- **📜 Recent Battle History Table**: Last 15 battles with full details

#### Player-Specific Mode:
- **⚔️ Detailed Combat Stats**: Battles initiated, win rate, deployments, fortifications
- **💀 Casualties Analysis**: Enemy eliminations, own losses, K/D ratio, net advantage
- **📜 Player Battle History**: Last 10 battles from that player's perspective

### 3. Game Integration
**Location:** `game.html`

**Changes Made:**
1. Added StatisticsManager script loading in the initialization chain
2. Initialized `window.statsManager` after RiskUI creation
3. Added automatic stats saving to `updateDashboardData()` function
4. Stats persist to `localStorage` key: `riskGameStats`

## How It Works

### Automatic Battle Tracking
```javascript
// When a battle occurs, StatisticsManager automatically captures:
{
    turn: 5,
    timestamp: Date,
    attacker: "Player 1",
    defender: "Player 2",
    attackingTerritory: "alaska",
    defendingTerritory: "kamchatka",
    attackerLosses: 2,
    defenderLosses: 1,
    conquered: true
}
```

### Data Flow
1. **Game Events** → StatisticsManager hooks capture data
2. **StatisticsManager** → Processes and aggregates statistics
3. **localStorage** → Data saved automatically on game state changes
4. **Dashboard** → Reads and displays stats in real-time (1-second refresh)

### LocalStorage Keys
- `riskGameData` - Current game state (existing)
- `riskGameHistory` - Turn-by-turn snapshots (existing)
- `riskGameStats` - StatisticsManager advanced analytics (NEW)

## Using the Statistics

### In the Game
The StatisticsManager runs invisibly in the background. You'll see:
```
📊 StatisticsManager initialized
```
in the console when the game loads.

### In the Dashboard
1. Open `Stats/dashboard.html` in a separate window/tab
2. The dashboard auto-refreshes every second
3. Navigate between views:
   - **Game Overview** - Compare all players
   - **Single Player** - Deep dive into one player's performance

### Filter by Category
Use the category buttons to focus on specific stats:
- **All** - Everything
- **Territory** - Land control and continent dominance
- **Military** - Army counts and positioning
- **Economy** - Income projections and reinforcements
- **Combat** - NEW: Battle history, win rates, casualties (requires StatisticsManager)

## Advanced Features

### Battle Performance Metrics
- **Battles Initiated**: Total attacks launched
- **Win Rate**: Percentage of successful conquests
- **K/D Ratio**: Armies eliminated vs armies lost
- **Net Advantage**: Overall casualty differential

### Battle History Table
Displays for each battle:
- Turn number
- Attacker and defender
- Territory involved
- Casualties (attacker losses / defender losses)
- Outcome (Conquered or Defended)

### Player-Specific Battle View
Shows battles from the player's perspective:
- Role (⚔️ Attacker or 🛡️ Defender)
- Opponent name
- Territory name
- Personal losses
- Outcome (✓ Victory or ✗ Defeat)

## Data Export

### Manual Export
Access the stats programmatically:
```javascript
// In browser console on game.html
window.statsManager.exportStats()  // Returns JSON string
window.statsManager.getStatsSummary()  // Returns object
```

### Automatic Persistence
Stats are saved automatically:
- On every dashboard update
- On every battle resolution
- On phase changes

### Retrieving Saved Stats
```javascript
// In browser console
const statsStr = localStorage.getItem('riskGameStats');
const stats = JSON.parse(statsStr);
console.log(stats);
```

## Advanced Stats Structure

### Player Stats Object
```javascript
{
    name: "Player 1",
    territoriesOwned: 12,
    armiesDeployed: 45,
    battlesInitiated: 8,
    battlesWon: 6,
    battlesLost: 2,
    territoriesConquered: 6,
    territoriesLost: 1,
    continentsControlled: ["North America"],
    armiesLost: 15,
    armiesKilled: 22,
    fortificationsMade: 4,
    averageArmiesPerTerritory: 3.5,
    totalArmies: 42
}
```

### Game Info Object
```javascript
{
    startTime: Date,
    duration: 1800000,  // milliseconds
    currentTurn: 10,
    totalBattles: 35,
    totalDeployments: 120,
    totalFortifications: 40
}
```

## Troubleshooting

### Stats Not Showing in Dashboard
1. **Check localStorage**: Open DevTools → Application → Local Storage → check for `riskGameStats`
2. **Check console**: Look for "📊 StatisticsManager initialized"
3. **Trigger a battle**: Stats appear after first battle
4. **Refresh dashboard**: Click the "🔄 Refresh" button

### Stats Not Updating
1. **Check game state**: Ensure `window.statsManager` exists in game.html console
2. **Check auto-save**: Verify `updateDashboardData()` is being called
3. **Manual save**: Run `window.statsManager.saveStats()` in console

### Console Commands for Debugging
```javascript
// Check if StatisticsManager is loaded
typeof StatisticsManager

// Check if statsManager instance exists
window.statsManager

// Get current statistics
window.statsManager.getStatsSummary()

// Check battle count
window.statsManager.stats.battles.length

// Force save stats
window.statsManager.saveStats()
```

## Performance Considerations

- **Memory Usage**: Battle history limited to last 20 battles in summaries
- **Storage Usage**: LocalStorage has 5-10MB limit (sufficient for thousands of battles)
- **CPU Impact**: Minimal - hooks run only on actual game events
- **Dashboard Refresh**: 1-second polling (configurable in `REFRESH_INTERVAL`)

## Future Enhancements

Possible additions (not yet implemented):
- Export stats as downloadable JSON/CSV file
- Graph visualizations for battle outcomes over time
- Heat map of most contested territories
- Player aggression scores
- Defensive strength ratings
- Turn duration analysis
- Card set trading statistics

## Integration Checklist

✅ StatisticsManager.js created
✅ Script loading added to game.html
✅ StatisticsManager initialized after RiskUI
✅ Auto-save integrated into updateDashboardData()
✅ Dashboard enhanced with battle statistics
✅ Player-specific battle history added
✅ Casualties and K/D ratio displays added
✅ fetchAdvancedStats() function added to dashboard
✅ Battle history tables with proper styling
✅ Non-intrusive integration (no breaking changes)

## Files Modified

1. **js/StatisticsManager.js** (NEW)
   - Complete statistics tracking system

2. **game.html**
   - Line ~5067: Added StatisticsManager.js to script loading chain
   - Line ~5242: Initialize statsManager after RiskUI
   - Line ~5838: Add stats saving to updateDashboardData()

3. **Stats/dashboard.html**
   - Line ~656: Added fetchAdvancedStats() function
   - Line ~1082: Added battle performance cards to game overview
   - Line ~1237: Added detailed combat stats to player view

## Testing

### Verify Installation
1. Open `game.html`
2. Check console for: `📊 StatisticsManager initialized`
3. Start a game and complete a battle
4. Open `Stats/dashboard.html`
5. Look for "⚔️ Battle Performance" and "💀 Casualties Report" cards
6. Verify battle history table appears with data

### Test Battle Tracking
1. Launch several attacks in game
2. Check dashboard updates in real-time
3. Verify win/loss counts are accurate
4. Check battle history table shows recent battles
5. Switch to player view and verify individual battle history

## Support

All statistics features work seamlessly with your existing:
- Combat system (CombatManager, AttackManager)
- Phase management (PhaseManager)
- Fortification system (FortificationManager)
- Dashboard real-time updates
- LocalStorage persistence

The integration is **backward compatible** - if StatisticsManager isn't loaded or fails, the game and dashboard continue working normally with existing functionality.
