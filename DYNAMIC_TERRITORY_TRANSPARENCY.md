# Dynamic Territory Transparency Implementation

## Overview
Implemented dynamic territory color transparency based on army count, providing visual feedback about territory strength across the map.

## Specification
- **Minimum Opacity**: 25% (1 army unit)
- **Maximum Opacity**: 100% (territory with most armies)
- **Gradient**: Linear interpolation between 25-100% based on army count relative to maximum

## Implementation Details

### Formula
```javascript
opacity = 0.25 + (0.75 * (armies - 1) / (maxArmies - 1))
```

Where:
- `armies` = current territory army count
- `maxArmies` = highest army count across all territories
- Special case: If all territories have 1 army, opacity = 1.0 (100%)

### Files Modified

#### 1. `js/ColorManager.js`
Added three key methods:

**`calculateDynamicOpacity(armies, allTerritories)`**
- Calculates opacity value (0.25 to 1.0) based on army count
- Compares against maximum armies across all territories
- Returns normalized opacity value

**`hexToRGBA(hex, opacity)`**
- Converts hex color codes to RGBA format
- Applies dynamic opacity to color
- Example: `#ff4444` + 0.5 → `rgba(255, 68, 68, 0.5)`

**`updateTerritoryColorWithOpacity(territoryId, owner, gameState)`**
- Main rendering method for territory colors
- Retrieves path element by territory ID
- Calculates opacity based on army count
- Applies RGBA color with dynamic opacity
- Maintains solid borders for visibility

**Updated: `TerritoryVisualManager.updateTerritoryColor()`**
- Now uses RGBA colors instead of fillOpacity
- Applies dynamic opacity when gameState provided
- Falls back to solid colors when no gameState

**`refreshAllTerritories(gameState)`**
- Updates all territories with current army-based opacity
- Called after army count changes (attacks, reinforcements, fortifications)

#### 2. `js/RiskGame.js`
Updated `updateTerritoryColors()`:
- Now calls `ColorManager.refreshAllTerritories()` if available
- Falls back to basic coloring if ColorManager unavailable
- Ensures dynamic opacity applies during game initialization

#### 3. `js/AttackLogic.js`
Updated `updateTerritoryColor()` fallback method:
- Fixed SVG path element selector (territory IS the path element)
- Now uses RGBA colors instead of fillOpacity
- Maintains consistency with ColorManager implementation

#### 4. `js/CombatUI.js`
Updated territory color application:
- Changed from fillOpacity to RGBA color format
- Uses ColorManager.hexToRGBA() for consistency
- Maintains solid borders with separate stroke styling

### Integration Points
Dynamic opacity updates are triggered at:

1. **Reinforcement Phase** (`ReinforcementManager.js`)
   - After placing reinforcements on territories

2. **Attack Phase** (`CombatUI.js`, `AttackLogic.js`)
   - After each battle round
   - After territory conquest
   - After army transfers

3. **Fortification Phase** (`FortificationManager.js`)
   - After moving armies between territories

4. **Game Initialization** (`RiskGame.js`)
   - When territories are initially colored

### SVG Structure
Territories are dynamically created in `RiskMap.js`:
```javascript
path.setAttribute('id', territory);           // e.g., "alaska"
path.setAttribute('class', 'territory');
path.setAttribute('data-name', territory.toUpperCase());
```

Territory elements are SVG `<path>` elements directly accessible via `document.getElementById(territoryId)`.

## Visual Effect

### Opacity Scale Examples
- **1 army**: 25% opacity (very transparent)
- **5 armies** (max 10): 53% opacity (semi-transparent)
- **10 armies** (max 10): 100% opacity (solid color)

### Benefits
1. **Strategic Visualization**: Players can instantly identify strong vs. weak territories
2. **Tactical Awareness**: Easy to spot vulnerable targets and reinforcement priorities
3. **Dynamic Feedback**: Opacity updates in real-time as armies change
4. **Non-Intrusive**: Maintains solid borders for territory identification

## Technical Notes

### Color Format
- **Player Colors**: Stored as hex codes (e.g., `#ff4444`)
- **Rendered Colors**: RGBA format with dynamic opacity (e.g., `rgba(255, 68, 68, 0.35)`)
- **Borders**: Always solid (100% opacity) for visibility

### Performance
- Opacity calculated on-demand when territories update
- Max army count recalculated each update (ensures accurate scaling)
- Minimal performance impact (simple arithmetic operations)

### Debugging
Console logs are included for opacity updates:
```
🎨 alaska: 3 armies → 35% opacity
🎨 quebec: 8 armies → 82% opacity
```

## Testing Recommendations

1. **Initial Setup**: Verify all territories start at correct opacity
2. **Reinforcement**: Place armies and check opacity increases
3. **Combat**: Attack territories and verify opacity updates for both attacker/defender
4. **Fortification**: Move armies and check opacity adjusts dynamically
5. **Multiple Players**: Ensure each player's territories have independent opacity calculations

## Future Enhancements (Optional)

- **Configurable Opacity Range**: Allow users to set min/max opacity values
- **Non-Linear Scaling**: Exponential or logarithmic opacity curves for different visual effects
- **Continent Highlighting**: Different opacity rules for complete continent bonuses
- **Accessibility Mode**: Option to disable transparency for visibility-impaired users
