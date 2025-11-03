# Risk Game Dashboard

## Overview
Real-time strategic dashboard for monitoring Risk game statistics and player metrics with historical trajectory tracking.

## Setup & Usage

### Starting the Dashboard

1. **Start the game** - Open `game.html` in your browser
2. **Open the dashboard** - In a new tab/window, open `Stats/dashboard.html`
3. **Both must be open** - The dashboard will automatically connect to the game via localStorage

### Connection Status

- **✅ Connected** (green badge) - Dashboard is receiving game data
- **⚠️ Disconnected** (red badge) - No game data detected

## Features

### View Modes
- **Game Overview** - Compare all players side-by-side
- **Single Player** - Detailed stats for one player

### Categories
- **📊 All Stats** - Complete overview
- **🗺️ Territory Control** - Land ownership and percentages
- **⚔️ Military Power** - Army strength and distribution
- **💰 Economy** - Next turn reinforcement projections with continent bonuses
- **🎯 Combat** - Battle statistics (future feature)

### 📈 Historical Trajectory (NEW!)

Track player progress over time with visual charts:

1. **Enable Historical View** - Check "Show Historical Trajectory"
2. **Select Metric** - Choose between:
   - **Territory Control** - See how land ownership changes over turns
   - **Military Power** - Track total army strength evolution
3. **Automatic Tracking** - Data is saved at the end of each turn
4. **Visual Timeline** - Line chart with color-coded player progress
5. **Up to 50 Turns** - Historical data is kept for the last 50 turns

**Historical Features:**
- Line charts with data points for each turn
- Color-coded by player
- Legend showing all players
- Turn range display (start to current)
- Automatic updates as game progresses

### Real-time Metrics

#### Game Status
- Current turn number and phase
- Active player
- Connection status with timestamp

#### Per-Player Statistics
- **Territory Control:**
  - Territories owned
  - Map control percentage
  - Player ranking

- **Military Power:**
  - Total armies deployed
  - Remaining armies to deploy
  - Average army strength per territory
  - Power ranking

- **Economy (Enhanced):**
  - Current armies to deploy
  - **Next turn territory income** (territories ÷ 3, minimum 3)
  - **Next turn continent bonuses** (automatically calculated)
  - **Total next turn reinforcements** (income + bonuses)

- **Combat:**
  - Attacks launched
  - Territories conquered
  - Battles won/lost

### Dashboard Controls

- **View Mode** - Switch between total game view and individual player view
- **Select Player** - Choose which player to analyze (in Single Player mode)
- **Show Historical Trajectory** - Toggle historical charts on/off
- **Historical Metric** - Choose which metric to display over time
- **🔄 Refresh** - Manually refresh the dashboard
- **Auto-refresh** - Updates every second automatically

### Continent Bonuses Calculation

The dashboard automatically calculates continent bonuses:
- **North America:** 5 armies (9 territories)
- **South America:** 2 armies (4 territories)
- **Europe:** 5 armies (7 territories)
- **Africa:** 3 armies (6 territories)
- **Asia:** 7 armies (12 territories)
- **Australia:** 2 armies (4 territories)

Players receive bonuses only when controlling ALL territories in a continent.

## Debugging Commands (in game.html console)

```javascript
// Check current dashboard data
window.getDashboardData()

// View historical data
JSON.parse(localStorage.getItem('riskGameHistory'))

// Manually trigger update
window.updateDashboardData()

// Clear historical data (start fresh)
window.clearGameHistory()

// Stop broadcasting (for debugging)
window.stopDashboardBroadcast()

// Restart broadcasting
window.startDashboardBroadcast()

// Check continent bonuses for a player
window.calculateContinentBonuses('PlayerName')
```

### Technical Details

**Communication Method:** localStorage
- Game broadcasts data to `localStorage['riskGameData']`
- Historical snapshots saved to `localStorage['riskGameHistory']`
- Dashboard polls every 1 second
- Data includes timestamp for staleness detection

**Historical Data Storage:**
- Snapshots saved at the start of each turn
- Stores: turn number, timestamp, all player stats
- Maximum 50 turns retained (oldest removed automatically)
- Survives page refresh (until localStorage is cleared)

**Update Triggers:**
- Every 1 second (automatic polling)
- When armies are deployed
- When phase/turn changes
- On any major game state change
- Historical snapshot at turn start

### Troubleshooting

**Dashboard shows "Disconnected":**
1. Ensure `game.html` is open and running
2. Check browser console for errors
3. Try refreshing both pages
4. Verify localStorage is enabled in your browser

**Data seems stale:**
- Check the timestamp in connection status
- Data older than 5 seconds triggers disconnection warning
- Make sure the game window/tab is not suspended

**No player data:**
- Wait for game initialization (takes 2-3 seconds)
- Ensure player setup is complete
- Check console for "📡 Dashboard broadcasting started" message

**No historical data:**
- Historical tracking starts after Turn 1 completes
- Data is saved at the beginning of each turn
- Complete at least one full turn cycle to see trajectory
- Check console for "📈 Historical snapshot saved" message

**Continent bonuses showing 0:**
- Player must control ALL territories in a continent
- Check territory ownership on the map
- Bonuses are calculated automatically from current state

### Browser Compatibility

Works in all modern browsers that support:
- localStorage API
- ES6 JavaScript
- CSS Grid and Flexbox
- SVG graphics (for charts)

### Data Persistence

- **Real-time data:** Updates continuously while game is running
- **Historical data:** Persists in localStorage between sessions
- **Clear data:** Clear browser localStorage or use `window.clearGameHistory()`
- **New game:** Historical data carries over unless manually cleared

## Future Enhancements

Planned features:
- Combat history tracking with battle log
- Turn-by-turn replay system
- Territory ownership heatmap
- Victory probability calculator
- Export statistics to CSV/JSON
- Player performance trends
- Critical battle analysis
- Strategic recommendations
