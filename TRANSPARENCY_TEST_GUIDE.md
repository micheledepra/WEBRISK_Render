# Dynamic Territory Transparency - Quick Test Guide

## Quick Test in Browser Console

### 1. Check Current Implementation
```javascript
// Verify ColorManager is loaded
console.log(window.riskUI.colorManager);

// Check if dynamic opacity methods exist
console.log(typeof window.riskUI.colorManager.calculateDynamicOpacity); // should be "function"
console.log(typeof window.riskUI.colorManager.hexToRGBA); // should be "function"
console.log(typeof window.riskUI.colorManager.updateTerritoryColorWithOpacity); // should be "function"
console.log(typeof window.riskUI.colorManager.refreshAllTerritories); // should be "function"
```

### 2. Test Opacity Calculation
```javascript
// Get current game state
const gameState = window.gameState;

// Find territory with minimum armies
const minTerritory = Object.entries(gameState.territories)
  .sort((a, b) => a[1].armies - b[1].armies)[0];
console.log(`Minimum: ${minTerritory[0]} with ${minTerritory[1].armies} armies`);

// Find territory with maximum armies
const maxTerritory = Object.entries(gameState.territories)
  .sort((a, b) => b[1].armies - a[1].armies)[0];
console.log(`Maximum: ${maxTerritory[0]} with ${maxTerritory[1].armies} armies`);

// Calculate their opacities
const minOpacity = window.riskUI.colorManager.calculateDynamicOpacity(
  minTerritory[1].armies, 
  gameState.territories
);
const maxOpacity = window.riskUI.colorManager.calculateDynamicOpacity(
  maxTerritory[1].armies, 
  gameState.territories
);

console.log(`Min opacity: ${(minOpacity * 100).toFixed(0)}% (should be ~25%)`);
console.log(`Max opacity: ${(maxOpacity * 100).toFixed(0)}% (should be 85%)`);
```

### 3. Test Visual Updates
```javascript
// Refresh all territories to apply dynamic opacity
window.riskUI.colorManager.refreshAllTerritories(window.gameState);

// Check console for 🎨 emoji logs showing opacity updates
// Example: "🎨 alaska: 3 armies → 35% opacity"
```

### 4. Test Color Conversion
```javascript
// Test hex to RGBA conversion
const testColor = '#ff4444';
const rgba25 = window.riskUI.colorManager.hexToRGBA(testColor, 0.25);
const rgba100 = window.riskUI.colorManager.hexToRGBA(testColor, 1.0);

console.log(`25% opacity: ${rgba25}`); // should be "rgba(255, 68, 68, 0.25)"
console.log(`100% opacity: ${rgba100}`); // should be "rgba(255, 68, 68, 1)"
```

### 5. Test SVG Element Access
```javascript
// Pick a territory ID (check mapData.continents for valid IDs)
const testTerritory = 'alaska';

// Check if element exists and is a path
const element = document.getElementById(testTerritory);
console.log(`Element found:`, element); // should be SVG path element
console.log(`Element type:`, element.tagName); // should be "path"
console.log(`Current fill:`, element.style.fill); // should be RGBA format
```

### 6. Visual Inspection Checklist
Open the game and visually verify:

- [ ] Territories with 1 army are very transparent (light, washed out)
- [ ] Territories with many armies are solid and vibrant
- [ ] Territories with medium armies have intermediate transparency
- [ ] All territories maintain visible borders (even very transparent ones)
- [ ] Opacity updates when armies change (after attacks, reinforcements, fortifications)

### 7. Test Dynamic Updates

#### During Reinforcement Phase:
```javascript
// Before placing armies
const territoryId = 'alaska';
const before = gameState.territories[territoryId].armies;
console.log(`Before: ${territoryId} has ${before} armies`);

// Place armies on the territory through the UI

// After placing (check in console for opacity update)
const after = gameState.territories[territoryId].armies;
console.log(`After: ${territoryId} has ${after} armies`);
```

#### During Attack Phase:
```javascript
// Watch console for 🎨 logs during attacks
// Both attacker and defender territories should update opacity
```

#### During Fortification Phase:
```javascript
// Watch console for opacity updates when moving armies
// Source territory should become more transparent
// Destination territory should become less transparent
```

## Expected Opacity Values

For a game with max 10 armies:
- **1 army**: 25% opacity (0.25)
- **2 armies**: 33% opacity (0.33)
- **3 armies**: 42% opacity (0.42)
- **5 armies**: 58% opacity (0.58)
- **7 armies**: 75% opacity (0.75)
- **10 armies**: 100% opacity (1.0)

Formula: `opacity = 0.25 + (0.75 * (armies - 1) / (maxArmies - 1))`

## Common Issues & Troubleshooting

### Issue: No opacity changes visible
**Check:**
```javascript
// Verify ColorManager is initialized
console.log(window.riskUI && window.riskUI.colorManager);

// Manually refresh
window.riskUI.colorManager.refreshAllTerritories(window.gameState);
```

### Issue: Territories are all solid
**Possible causes:**
- All territories have 1 army (special case returns 100% opacity)
- ColorManager not integrated into update flow

**Check:**
```javascript
// Verify army distribution
Object.entries(gameState.territories).forEach(([id, t]) => {
  console.log(`${id}: ${t.armies} armies`);
});
```

### Issue: Opacity not updating after actions
**Check integration points:**
```javascript
// After reinforcement
window.riskUI.colorManager.refreshAllTerritories(window.gameState);

// After attack
// Should auto-refresh via AttackLogic.updateTerritoryVisuals()

// After fortification  
// Should auto-refresh via FortificationManager
```

### Issue: Console errors
**Common errors and fixes:**

1. **"Territory element not found"**
   - Territory ID mismatch between gameState and SVG
   - Check: `console.log(Object.keys(gameState.territories))`
   
2. **"No color found for player"**
   - Player colors not initialized
   - Check: `console.log(gameState.playerColors)`

3. **"calculateDynamicOpacity is not a function"**
   - ColorManager not loaded or initialized
   - Check script loading order in game.html

## Manual Force Refresh Command

If you need to manually force a refresh of all territory opacities:

```javascript
// Force complete refresh
if (window.riskUI && window.riskUI.colorManager && window.gameState) {
  console.log('🔄 Forcing territory opacity refresh...');
  window.riskUI.colorManager.refreshAllTerritories(window.gameState);
  console.log('✅ Refresh complete');
}
```

## Debug Mode

Enable detailed logging for opacity calculations:

```javascript
// Patch calculateDynamicOpacity to add detailed logging
const originalCalc = window.riskUI.colorManager.calculateDynamicOpacity;
window.riskUI.colorManager.calculateDynamicOpacity = function(armies, allTerritories) {
  const result = originalCalc.call(this, armies, allTerritories);
  const maxArmies = Math.max(...Object.values(allTerritories).map(t => t.armies || 1));
  console.log(`📊 Opacity calc: ${armies} armies / ${maxArmies} max = ${(result * 100).toFixed(0)}%`);
  return result;
};
```
