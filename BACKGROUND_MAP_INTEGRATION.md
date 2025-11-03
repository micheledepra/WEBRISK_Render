# Realistic World Map Background Integration

## Overview
Added a realistic world map background image to the Risk game SVG, with calibration tools for precise alignment of territory paths.

## Implementation Summary

### 1. SVG Structure Changes (`game.html`)

**ViewBox Update:**
- Changed from `viewBox="0 0 320 180"` to `viewBox="0 0 1920 1080"`
- Matches the background image dimensions (1920x1080, 16:9 aspect ratio)
- Map container also set to `aspect-ratio: 16 / 9` for consistent display

**Background Pattern:**
```xml
<pattern id="world-map-bg" patternUnits="userSpaceOnUse" width="1920" height="1080">
  <image href="res/maps/classic/preview.png" width="1920" height="1080" 
         preserveAspectRatio="xMidYMid slice" />
</pattern>
```

**Visual Layers (bottom to top):**
1. Realistic world map (75% opacity)
2. Gradient overlay (30% opacity for better territory contrast)
3. SVG territory paths (interactive elements)

### 2. MapCalibration System (`js/MapCalibration.js`)

**Purpose:** Provides development tools to fine-tune background alignment with territory paths.

**Features:**
- Real-time adjustment of X/Y offsets
- Opacity control for blending background with territories
- Scale adjustment for image size
- Persistent settings via localStorage
- Keyboard shortcut (Press 'C') to toggle calibration mode

**Calibration Parameters:**
```javascript
{
    offsetX: 0,      // Horizontal position adjustment
    offsetY: 0,      // Vertical position adjustment
    opacity: 0.75,   // Background visibility (0-1)
    scale: 1.0       // Image size multiplier (0.5-2.0)
}
```

### 3. File Structure

```
mvp-sad/
├── game.html                          # Updated SVG structure
├── js/
│   └── MapCalibration.js             # Calibration system
└── res/
    └── maps/
        └── classic/
            └── preview.png           # Background world map image
```

## Usage Guide

### For Development (Alignment Calibration):

1. **Enable Calibration Mode:**
   - Press 'C' key to show calibration controls
   - Control panel appears in top-right corner

2. **Adjust Position:**
   - Use X Offset slider to move map horizontally
   - Use Y Offset slider to move map vertically
   - Use Scale slider to resize background image
   - Use Opacity slider to see through background

3. **Save Settings:**
   - Click "Save" button to persist calibration
   - Settings stored in localStorage
   - Click "Reset" to return to defaults

4. **Disable Calibration Mode:**
   - Press 'C' key again to hide controls
   - Calibration still applied, UI just hidden

### For Production:

The saved calibration settings are automatically applied on game load. No user interaction needed.

## Technical Details

### SVG Pattern System
- `patternUnits="userSpaceOnUse"` ensures 1:1 pixel mapping
- `preserveAspectRatio="xMidYMid slice"` maintains image proportions
- Pattern fills a background rectangle at specified opacity

### Gradient Overlay
Subtle white-to-black gradient (30% opacity) improves territory visibility:
```xml
<linearGradient id="overlay-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
  <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
</linearGradient>
```

### Calibration Point System
Optional development feature to mark reference points:
```javascript
// Add calibration point at coordinates
window.mapCalibration.addCalibrationPoint(800, 450, 'Center');

// Clear all points
window.mapCalibration.clearCalibrationPoints();
```

## Integration with Existing Systems

### RiskMap.js
- No changes required
- Territory paths render on top of background
- Zoom/pan functionality unchanged
- Transform system works as before

### Territory Paths
- All territory SVG paths remain interactive
- Click detection unaffected by background layers
- Army count displays render above background

### Default Transform Values
The previous default transform settings still apply:
```javascript
{
    translateX: -573.104,
    translateY: -345.59,
    scale: 0.321286
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Toggle calibration mode on/off |

## Console Commands

```javascript
// Enable calibration mode
window.mapCalibration.enableDevelopmentMode();

// Disable calibration mode
window.mapCalibration.disableDevelopmentMode();

// Manually adjust settings
window.mapCalibration.calibrationData.offsetX = 50;
window.mapCalibration.calibrationData.offsetY = -30;
window.mapCalibration.applyCalibration();

// Save current calibration
window.mapCalibration.saveCalibration();

// Add reference points
window.mapCalibration.addCalibrationPoint(400, 300, 'North America');
window.mapCalibration.addCalibrationPoint(1200, 600, 'Asia');
```

## Troubleshooting

### Background Not Showing
1. Check image path: `res/maps/classic/preview.png`
2. Verify image file exists and is accessible
3. Check browser console for 404 errors
4. Ensure SVG pattern ID matches: `world-map-bg`

### Misalignment Issues
1. Press 'C' to open calibration controls
2. Adjust X/Y offsets to align territories with map
3. Fine-tune scale if continents are wrong size
4. Save settings when satisfied

### Territory Paths Not Visible
1. Reduce background opacity (increase contrast)
2. Check that gradient overlay is present
3. Verify territory paths have proper stroke/fill
4. Ensure SVG z-ordering is correct (background first)

### Calibration Not Persisting
1. Check localStorage is enabled in browser
2. Verify no browser errors in console
3. Try manual save: `window.mapCalibration.saveCalibration()`
4. Clear localStorage and recalibrate if corrupted

## Performance Considerations

- Background image is loaded once as SVG pattern
- No performance impact on territory interactions
- Calibration UI only active in development mode
- localStorage writes minimal data (<1KB)

## Future Enhancements

Potential improvements:
- Multiple background styles (classic, modern, satellite)
- Automatic alignment using territory coordinate matching
- Export/import calibration presets
- Visual diff tool to compare before/after alignment
- Animated background transitions

## File Modifications Summary

| File | Changes | Purpose |
|------|---------|---------|
| `game.html` | SVG viewBox, pattern definition, background layers | Add realistic map background |
| `js/MapCalibration.js` | New file | Calibration system for alignment |
| `res/maps/classic/preview.png` | New file | Background world map image |

## Testing Checklist

- [x] Background image loads correctly
- [x] SVG pattern displays at proper scale
- [x] Territory paths render above background
- [x] Calibration mode toggles with 'C' key
- [x] Offset adjustments update in real-time
- [x] Opacity control affects only background
- [x] Scale adjustment resizes background image
- [x] Save/Reset buttons function correctly
- [x] LocalStorage persistence works
- [x] Territory click detection still works
- [x] Zoom/pan functionality unchanged
- [x] Army count displays visible

## Related Documentation

- `ARMY_DISPLAY_FIX.md` - Army count display corrections
- `DYNAMIC_TERRITORY_TRANSPARENCY.md` - Territory visual system
- `RULES.md` - Game rules and mechanics

---

**Integration Complete:** Realistic world map background with calibration system ready for use.
