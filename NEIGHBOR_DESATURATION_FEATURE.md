# Neighbor Desaturation Feature

## Overview
When hovering over a territory, all neighboring (bordering) territories are automatically desaturated to 10% of their original saturation, making it visually intuitive to see which territories border the hovered territory.

## Implementation Details

### JavaScript Changes (RiskMap.js)

#### 1. Modified `handleTerritoryHover()` method
- Added call to `desaturateNeighbors(territoryId)` when a territory is hovered
- This triggers the visual effect immediately on hover

#### 2. Modified `hideTooltip()` method
- Added call to `restoreNeighborSaturation()` when hover ends
- Cleans up the desaturation effect when mouse leaves

#### 3. New `desaturateNeighbors()` method
```javascript
desaturateNeighbors(territoryId) {
    const territoryData = mapData.territories[territoryId];
    if (!territoryData || !territoryData.neighbors) return;
    
    territoryData.neighbors.forEach(neighborId => {
        const neighborElement = document.getElementById(neighborId);
        if (neighborElement) {
            neighborElement.classList.add('neighbor-desaturated');
        }
    });
}
```
- Retrieves neighbor data from `mapData.territories`
- Adds `neighbor-desaturated` class to all neighboring territories

#### 4. New `restoreNeighborSaturation()` method
```javascript
restoreNeighborSaturation() {
    document.querySelectorAll('.neighbor-desaturated').forEach(territory => {
        territory.classList.remove('neighbor-desaturated');
    });
}
```
- Removes the desaturation class from all territories
- Restores original appearance

### CSS Changes (game.html)

Added new CSS rule for desaturated neighbors:

```css
/* Neighbor desaturation effect */
.territory.neighbor-desaturated {
    filter: saturate(0.1) brightness(0.95);
    transition: filter 0.2s ease-out;
}
```

**Key properties:**
- `saturate(0.1)`: Reduces saturation to 10% of original value
- `brightness(0.95)`: Slightly reduces brightness for additional visual distinction
- `transition: filter 0.2s ease-out`: Smooth, responsive animation (200ms)

## User Experience

### Visual Behavior
1. **On hover**: Neighboring territories immediately desaturate smoothly
2. **During hover**: Hovered territory remains fully saturated and highlighted
3. **On mouse leave**: Neighbors smoothly return to full saturation

### Performance
- Lightweight CSS filter-based approach
- Smooth 200ms transition for responsive feel
- No performance impact on gameplay

## Benefits
- **Intuitive border visualization**: Players can instantly see which territories connect
- **Strategic planning**: Helps players understand attack and fortification routes
- **Visual clarity**: Reduces cognitive load when planning moves
- **Smooth UX**: Responsive animations feel natural and polished
