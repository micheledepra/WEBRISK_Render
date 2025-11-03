# Dashboard Features Guide

## 📈 Historical Trajectory Tracking

### What It Does
Visualizes player performance over time with interactive line charts showing how territory control and military power change throughout the game.

### How to Use
1. **Enable the feature** - Check the "Show Historical Trajectory" box
2. **Choose your metric:**
   - Territory Control - Track land ownership over time
   - Military Power - Monitor army strength evolution
3. **Watch it update** - Chart automatically refreshes with each turn

### What You'll See
```
Turn 1 ----[•]----[•]----[•]---- Turn 10
            ↓      ↓      ↓
        Player trajectories shown as colored lines
        • Data points at each turn
        • Color-coded legend
        • Turn range labels
```

### Strategic Insights
- **Rising lines** = Player gaining power
- **Falling lines** = Player losing ground
- **Crossing lines** = Power shifts between players
- **Steep changes** = Major battles or conquests
- **Flat lines** = Stalemate or defensive play

### Data Collection
- Snapshots saved automatically at turn start
- Stores up to 50 turns of history
- Persists in browser storage
- Available immediately after Turn 1

---

## 💰 Enhanced Economy Tracking

### Next Turn Reinforcement Projection

The dashboard now calculates and displays exact reinforcements each player will receive next turn:

**Calculation Breakdown:**
```
Territory Income = max(3, territories owned ÷ 3)
Continent Bonuses = sum of controlled continents
Total Next Turn = Territory Income + Continent Bonuses
```

### What You'll See

#### Game Overview Mode
```
💰 Next Turn Income Projection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Player A: 8 armies (6 + 2 bonus)
Player B: 12 armies (10 + 2 bonus)
Player C: 5 armies (5 + 0 bonus)
```

#### Single Player Mode
```
💰 Player A - Economy
━━━━━━━━━━━━━━━━━━━━━━━━
Armies to Deploy Now: 3
Next Turn Territory Income: 6
Next Turn Continent Bonuses: 2
Next Turn Total Income: 8 armies
```

### Strategic Value
- **Plan attacks** - Know reinforcement capacity
- **Assess threats** - See which players will get stronger
- **Prioritize continents** - Understand bonus value
- **Calculate risk** - Evaluate if battles are worth it

### Continent Bonus Reference
| Continent | Territories | Bonus |
|-----------|------------|-------|
| North America | 9 | 5 |
| South America | 4 | 2 |
| Europe | 7 | 5 |
| Africa | 6 | 3 |
| Asia | 12 | 7 |
| Australia | 4 | 2 |

**Note:** Player must control ALL territories in a continent to receive the bonus.

---

## 🎯 Quick Reference: All Metrics

### Territory Control
- Territories owned
- Map control percentage (0-100%)
- Player ranking by territory count

### Military Power
- Total armies deployed on map
- Armies remaining to deploy this turn
- Average armies per territory
- Power ranking by total armies

### Economy
- Current deployment status
- Territory income calculation
- Continent bonuses (auto-detected)
- Next turn total reinforcements

### Combat (Coming Soon)
- Attacks launched
- Territories conquered
- Win/loss ratios
- Battle history

---

## 📊 Chart Interpretation Guide

### Territory Control Chart
Shows the number of territories each player controls over time.

**What to look for:**
- **42 territories total** - Maximum possible
- **Upward trend** - Successful expansion
- **Downward trend** - Losing territories
- **Plateaus** - Stable control periods
- **Sharp drops** - Major defeats

### Military Power Chart
Shows the total armies each player has deployed.

**What to look for:**
- **High values** - Strong military presence
- **Growing lines** - Effective reinforcement
- **Declining lines** - Heavy losses in combat
- **Gaps widening** - Power imbalance increasing
- **Convergence** - Players becoming equal in strength

---

## 🎮 Gameplay Tips Using Dashboard

### Early Game (Turns 1-5)
- Monitor initial territory distribution
- Track which players secured continents early
- Identify reinforcement leaders

### Mid Game (Turns 6-15)
- Watch for power shifts in historical chart
- Calculate break-even points for attacks
- Identify weakening players

### Late Game (Turns 16+)
- Analyze victory trajectory
- Evaluate if leader is unstoppable
- Find opportunities for comebacks

### Alliance Play
- Compare relative strengths
- Identify common threats (high reinforcement players)
- Time attacks when opponents are weak

---

## 🔧 Power User Tips

### Browser Console Commands
```javascript
// View complete historical data
JSON.parse(localStorage.getItem('riskGameHistory'))

// Check specific player's continent bonuses
window.calculateContinentBonuses('PlayerName')

// Force historical snapshot save
window.saveHistoricalSnapshot(turnNumber, playerStats)

// Clear all history (fresh start)
window.clearGameHistory()

// Export current game state
console.table(window.getDashboardData())
```

### Multi-Monitor Setup
- Game on main monitor
- Dashboard on secondary monitor
- Real-time strategy analysis while playing

### Recording Gameplay
- Dashboard provides clean overlay stats
- Historical charts show game narrative
- Perfect for post-game analysis

---

## 📐 Technical Implementation

### Historical Data Structure
```javascript
{
  turn: 5,
  timestamp: 1234567890,
  players: [
    {
      name: "Player A",
      territories: 15,
      armies: 42,
      continentBonus: 2,
      nextTurnReinforcements: 7
    },
    // ... more players
  ]
}
```

### Reinforcement Calculation
```javascript
const territoryIncome = Math.max(3, Math.floor(territories / 3));
const continentBonus = calculateContinentBonuses(playerName);
const nextTurnReinforcements = territoryIncome + continentBonus;
```

### Chart Rendering
- SVG-based line charts
- Responsive scaling
- Auto-calculated axes
- Color-coded players
- Real-time updates

---

## 🎨 Visual Design

### Color Scheme
- **Player 1:** Green (#4CAF50)
- **Player 2:** Blue (#2196F3)
- **Player 3:** Orange (#FF9800)
- **Player 4:** Pink (#E91E63)
- **Player 5:** Purple (#9C27B0)
- **Player 6:** Cyan (#00BCD4)
- **Player 7:** Yellow (#FFEB3B)
- **Player 8:** Brown (#795548)

### Chart Elements
- Line thickness: 3px
- Data point size: 4px radius
- Background: Semi-transparent dark
- Border: Gold accent (#FFD700)
- Text: Light gray (#E0E0E0)

---

## ❓ FAQ

**Q: When does historical tracking start?**
A: After Turn 1 completes. The first snapshot is saved when Turn 2 begins.

**Q: How much data is stored?**
A: Up to 50 turns. Older data is automatically removed.

**Q: Does history survive browser refresh?**
A: Yes! Data is stored in localStorage and persists between sessions.

**Q: Can I export the data?**
A: Currently via console commands. CSV/JSON export coming in future update.

**Q: Why are continent bonuses showing 0?**
A: Player must control ALL territories in that continent. Partial control = no bonus.

**Q: Does the chart lag the game?**
A: No. Charts render independently and don't affect game performance.

**Q: Can I compare different metrics side-by-side?**
A: Not yet, but multi-chart view is planned for future release.

**Q: What happens if a player is eliminated?**
A: Their line stops at elimination turn, showing final state.
