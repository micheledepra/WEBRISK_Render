# Neighbor Desaturation Diagnostic Checklist

## Quick Test Steps

### 1. Open the Test Page
Open `test-neighbor-desaturation.html` in your browser:
- Hover over the "MAIN" box
- Neighbors should immediately desaturate (lose color)
- Check the console output for logs

**If this works:** Your CSS is fine, issue is in the game integration.
**If this fails:** CSS or browser issue.

---

### 2. Browser Console Test (Open game.html)

Press **F12** to open Developer Console, paste this:

```javascript
// Test 1: Check if mapData exists
console.log('mapData exists:', typeof mapData !== 'undefined');
console.log('First 5 territories:', Object.keys(mapData.territories).slice(0, 5));

// Test 2: Manually test on Alaska
const testTerritory = 'alaska';
const territoryData = mapData.territories[testTerritory];
console.log('Testing:', testTerritory);
console.log('Neighbors:', territoryData?.neighbors);

// Test 3: Apply desaturation manually
territoryData?.neighbors.forEach(neighborId => {
    const el = document.getElementById(neighborId);
    if (el) {
        el.classList.add('neighbor-desaturated');
        console.log('✅ Desaturated:', neighborId);
    } else {
        console.log('❌ Not found:', neighborId);
    }
});

// Test 4: Check CSS application
const testEl = document.getElementById(territoryData?.neighbors[0]);
if (testEl) {
    const styles = window.getComputedStyle(testEl);
    console.log('Filter applied:', styles.getPropertyValue('filter'));
}
```

---

### 3. Check Console Logs While Playing

With debugging enabled in RiskMap.js, hover over territories and watch for:

```
🎯 Hovering over: alaska
🔍 Desaturating neighbors for: alaska
✓ Found neighbors: ["northwest territory", "alberta", "kamchatka"]
  Neighbor "northwest territory": ✓ found
  ✅ Added 'neighbor-desaturated' class to northwest territory
```

**Expected behavior:**
- Should see territory ID logged
- Should see neighbors array
- Should see "✓ found" for each neighbor
- Should see class added confirmation

---

## Common Issues & Solutions

### Issue 1: No console logs appear
**Problem:** Event listeners not attached
**Solution:** Check if `setupEventListeners()` is called in RiskMap init

### Issue 2: "❌ No territory data found"
**Problem:** Territory ID mismatch between SVG and mapData
**Solution:** 
```javascript
// In console, compare:
console.log('SVG ID:', document.querySelector('.territory').id);
console.log('mapData keys:', Object.keys(mapData.territories)[0]);
```

### Issue 3: "❌ not found" for neighbors
**Problem:** Neighbor element IDs don't match
**Solution:**
```javascript
// Check if neighbor elements exist
const allTerritories = document.querySelectorAll('.territory');
console.log('Total territories in DOM:', allTerritories.length);
console.log('Total in mapData:', Object.keys(mapData.territories).length);
```

### Issue 4: Class added but no visual effect
**Problem:** CSS specificity conflict or !important missing
**Solution:** 
- Check if `!important` is in the CSS rule
- Verify in DevTools → Elements → select a neighbor → check Computed styles
- Look for "filter" property - should show `saturate(0.1) brightness(0.95)`

### Issue 5: Effect works but is too subtle
**Problem:** Saturation reduction too small
**Solution:** Try more extreme values:
```css
.territory.neighbor-desaturated {
    filter: saturate(0.05) brightness(0.8) !important;
    transition: filter 0.2s ease-out !important;
}
```

---

## Visual Verification

### What you SHOULD see:
1. Hover over Alaska
2. Northwest Territory, Alberta, and Kamchatka should turn grayish (desaturated)
3. Effect should be smooth (200ms transition)
4. When you move mouse away, colors should restore

### What you SHOULD NOT see:
- No visual change at all
- Neighboring territories getting brighter instead of grayer
- Effect only working on some neighbors
- Flickering or stuttering

---

## Emergency Fix: Alternative Implementation

If the filter approach doesn't work, try opacity-based approach:

```css
.territory.neighbor-desaturated {
    opacity: 0.4 !important;
    transition: opacity 0.2s ease-out !important;
}
```

Or use a grayscale filter:

```css
.territory.neighbor-desaturated {
    filter: grayscale(0.9) brightness(0.9) !important;
    transition: filter 0.2s ease-out !important;
}
```

---

## Debugging Code Added

The following debug logs were added to RiskMap.js:

### In `handleTerritoryHover()`:
- Logs the hovered territory ID
- Warns if no ID found

### In `desaturateNeighbors()`:
- Checks if mapData exists
- Shows available territories
- Logs neighbor lookup success/failure
- Confirms class addition
- Shows current classes on element

### In `restoreNeighborSaturation()`:
- Counts how many territories are being restored
- Logs each territory being restored

---

## Next Steps

1. ✅ Open `test-neighbor-desaturation.html` - does it work?
2. ✅ Open `game.html` and check browser console while hovering
3. ✅ Look for error messages or missing logs
4. ✅ Verify CSS rule has `!important` flag
5. ✅ Test manual class addition via console

Report which step fails and we can narrow down the issue!
