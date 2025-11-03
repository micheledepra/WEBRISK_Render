# Quick Reference: Advanced Statistics System

## 🎮 Using the Statistics Dashboard

### Opening the Dashboard
1. Start your game in `game.html`
2. Open `Stats/dashboard.html` in a new tab/window
3. Keep both windows open - dashboard updates automatically every second

### View Modes

#### 📊 Game Overview Mode
Shows all players compared side-by-side:
- Player power comparison bars
- Territory control
- Continent leaders  
- Military power
- Next turn income
- **⚔️ Battle Performance** (win/loss records)
- **💀 Casualties Report** (K/D ratios)
- **📜 Recent Battle History** (last 15 battles)

#### 👤 Single Player Mode
Deep dive into one player's stats:
- Territory control & ranking
- Continent presence with leader badges 🏆
- Military power & averages
- Economy & income projections
- Combat record
- **⚔️ Detailed Combat Stats** (battles, win rate, deployments)
- **💀 Casualties Analysis** (kills, deaths, K/D ratio, net advantage)
- **📜 Player Battle History** (last 10 battles from player's perspective)

### Category Filters
Click to focus on specific stat types:
- **All** - Everything
- **Territory** - Land control
- **Military** - Army strength
- **Economy** - Income & reinforcements
- **Combat** - Battles & casualties

### Historical View
- Toggle "Show Historical Trajectory" checkbox
- Select metric: Territory Control or Military Power
- See line graph of player progression over time
- Hover over points for exact values

## 📈 Key Metrics Explained

### Battle Statistics
- **Battles Initiated**: Total attacks you launched
- **Win Rate**: Percentage of successful conquests
- **Battles Won/Lost**: Conquest successes vs failures

### Casualties
- **Armies Killed**: Enemy armies you eliminated
- **Armies Lost**: Your armies eliminated by enemies
- **K/D Ratio**: Kill/Death ratio (higher is better)
- **Net Advantage**: Overall casualty differential (positive means you're ahead)

### Battle History Table Columns
- **Turn**: When the battle occurred
- **Role**: ⚔️ Attacker or 🛡️ Defender
- **Opponent**: Who you fought
- **Territory**: Where the battle took place
- **Losses**: Armies lost in this battle
- **Outcome**: ✓ Victory or ✗ Defeat / ✓ CONQUERED or Defended

## 🔧 Console Commands

### Check Stats Status
```javascript
// Verify StatisticsManager is loaded
window.statsManager

// Get full statistics summary
window.statsManager.getStatsSummary()

// Export as JSON string
window.statsManager.exportStats()
```

### View Specific Stats
```javascript
// Get player statistics
window.statsManager.stats.players

// Get battle history
window.statsManager.stats.battles

// Get game info
window.statsManager.stats.gameInfo
```

### Manual Operations
```javascript
// Force save stats to localStorage
window.statsManager.saveStats()

// Force dashboard update
window.updateDashboardData()

// View saved stats
JSON.parse(localStorage.getItem('riskGameStats'))
```

## 📊 What Gets Tracked

### Every Battle Records:
- Turn number and timestamp
- Attacker and defender names
- Territories involved
- Attacker casualties
- Defender casualties
- Whether territory was conquered

### Player Performance:
- Territories owned (current)
- Total armies (current)
- Armies deployed (cumulative)
- Battles initiated/won/lost
- Territories conquered/lost
- Continents controlled
- Armies killed/lost
- Fortifications made
- Average armies per territory

### Game-Wide Stats:
- Game start time and duration
- Current turn number
- Total battles fought
- Total deployments made
- Total fortifications
- Phase change history
- Territory ownership changes

## 🎯 Strategy Insights

### Using Win Rate
- **>70%**: Aggressive and effective
- **50-70%**: Balanced approach
- **<50%**: Consider more selective attacks

### Understanding K/D Ratio
- **>1.5**: Excellent - winning battles efficiently
- **1.0-1.5**: Good - trading evenly
- **<1.0**: Losing more armies than eliminating - consider defensive play

### Net Advantage
- **Positive**: You're ahead in the war of attrition
- **Zero**: Even exchange
- **Negative**: You're losing the resource game

### Battle History Patterns
- Many "Defended" results → Consider stronger attacking forces
- High losses as attacker → You might be attacking too aggressively
- High losses as defender → Reinforce border territories

## 💡 Tips

1. **Real-time Tracking**: Keep dashboard open while playing to monitor performance
2. **Turn-by-Turn**: Historical view shows how each player's power changes
3. **Comparison**: Switch between overview and player modes to compare strategies
4. **Persistence**: Stats save automatically - survives page refreshes
5. **Performance**: No impact on game speed - runs in background

## 🐛 Troubleshooting

### No Advanced Stats Showing
- **Check**: Console shows "📊 StatisticsManager initialized"
- **Fix**: Refresh game.html

### Stats Not Updating
- **Check**: `window.statsManager` exists in console
- **Fix**: Complete a battle to trigger tracking

### Dashboard Shows "No Data"
- **Check**: Game is running in another tab
- **Fix**: Start a game, make a move

### Old Stats Persisting
- **Clear**: Run `localStorage.clear()` in console
- **Restart**: Reload both game and dashboard

## 🎨 Visual Guide

### Game Overview Cards
```
🏆 Player Power Comparison (bars)
🗺️ Territory Control (numbers & %)
🌍 Continent Leaders (who controls what)
⚔️ Military Power (army counts)
💰 Next Turn Income (projections)
⚔️ Battle Performance (W/L records)      ← NEW
💀 Casualties Report (K/D ratios)         ← NEW
📜 Recent Battle History (table)          ← NEW
```

### Player View Cards
```
🗺️ Territory Control (count, %, ranking)
🌍 Continent Presence (territories per continent)
⚔️ Military Power (armies, averages)
💰 Economy (income breakdown)
🎯 Combat Record (basic stats)
⚔️ Detailed Combat Stats (advanced)      ← NEW
💀 Casualties (detailed breakdown)        ← NEW
📜 Player Battle History (personal view) ← NEW
```

## 📱 Works With

✅ All existing dashboard features
✅ Historical trajectory graphs
✅ Player comparison bars
✅ Continent dominance tracking
✅ Real-time updates (1-second refresh)
✅ LocalStorage persistence
✅ Cross-window communication

## 🚀 Quick Start Checklist

1. ✅ Load game.html
2. ✅ Check console: "📊 StatisticsManager initialized"
3. ✅ Open Stats/dashboard.html in new window
4. ✅ Start game and play a few turns
5. ✅ Complete some battles
6. ✅ Watch dashboard auto-update with battle stats
7. ✅ Switch between overview/player modes
8. ✅ Filter by combat category to see detailed stats

---

**That's it!** Your Risk game now tracks comprehensive statistics automatically. The more you play, the more detailed your analytics become!
