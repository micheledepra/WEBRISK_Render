# Territory System Migration Guide

## What Changed

### Before: Generic Polygon System
The previous system used a single `territory_polygons.json` file that contained generic polygon data. Territories were represented with simple shapes.

### After: SVG-Based Territory System  
Each territory now has its own SVG file with accurate geographic shapes. The system:
- Loads individual SVG files from `territories_svg/` folder
- Converts them to Godot Polygon2D format
- Renders each territory with its unique shape
- Supports dynamic coloring and interaction

## Visual Comparison

### Old System
```
territory_polygons.json (single file)
└── Generic polygon data for all territories
    ├── No separate SVG files
    ├── Simpler shapes
    └── Less geographic accuracy
```

### New System
```
territories_svg/ (folder with 42 SVG files)
├── afghanistan.svg
├── alaska.svg
├── alberta.svg
└── ... (42 total)
    ↓
[Python Converter]
    ↓
MVP_GODOT/data/territory_polygons.json
    ↓
[Godot Loads & Renders]
    ↓
42 Territory Scenes with accurate shapes
```

## Code Changes

### Territory.gd
**Added:**
- `territory_display_name` variable for formatted names
- Uses display name from polygon data if available
- Falls back to formatted ID if no display name

### Main.gd
**Changed:**
- `create_territory_nodes()` now sets display name from polygon data
- Loads territory name from JSON: `poly_data["name"]`

### Resources Updated
**map_data.json:**
- `western_us` → `western_united_states`
- `eastern_us` → `eastern_united_states`

**continents.json:**
- Updated territory IDs to match SVG filenames

### Converter Script
**Completely Rewritten:**
- Now parses individual SVG files instead of JavaScript
- Extracts path data from SVG XML
- Generates display names from filenames
- Outputs enhanced JSON with name, polygon, and centroid

## Migration Steps (Already Completed)

✅ 1. Created `svg_to_godot_polygons.py` with SVG parsing
✅ 2. Converted all 42 SVG files to polygon data
✅ 3. Updated Territory.gd to support display names
✅ 4. Updated Main.gd to set display names
✅ 5. Updated map_data.json with correct IDs
✅ 6. Updated continents.json with correct IDs
✅ 7. Generated new territory_polygons.json

## JSON Format Changes

### Old Format
```json
{
  "territory_id": {
    "polygon": [[x1, y1], [x2, y2], ...],
    "centroid": [cx, cy],
    "vertex_count": 123
  }
}
```

### New Format
```json
{
  "territory_id": {
    "name": "Territory Name",        // NEW: Display name
    "polygon": [[x1, y1], [x2, y2], ...],
    "centroid": [cx, cy],
    "vertex_count": 123
  }
}
```

## Benefits of New System

### 1. Modularity
- Each territory is a separate SVG file
- Easy to update individual territories
- Version control friendly (can see diffs per territory)

### 2. Accuracy
- Real geographic shapes from SVG files
- Professional map appearance
- Better visual representation

### 3. Maintainability
- Clear file structure in `territories_svg/`
- Self-documenting (filename = territory ID)
- Easy to add new territories

### 4. Designer Friendly
- SVG files can be edited in any vector graphics editor
- No need to manually write polygon coordinates
- Visual editing workflow

### 5. Flexibility
- Can easily swap out territory shapes
- Support for different map styles
- Future: Multiple map themes

## Testing Checklist

After migration, verify:
- ✅ All 42 territories load correctly
- ✅ Territory shapes are visible
- ✅ Click detection works (matches shape)
- ✅ Colors change when conquered
- ✅ Hover effects work
- ✅ Army counts display correctly
- ✅ Territory names are readable
- ✅ No console errors

## Troubleshooting

### If territories don't appear:
1. Check that `territory_polygons.json` exists in `MVP_GODOT/data/`
2. Run converter: `python MVP_GODOT/tools/svg_to_godot_polygons.py`
3. Verify SVG files exist in `territories_svg/`

### If territory IDs mismatch:
1. Check that SVG filenames match IDs in `map_data.json`
2. Use snake_case for filenames (e.g., `western_united_states.svg`)
3. Update both `map_data.json` and `continents.json`

### If shapes look wrong:
1. Open SVG file in a vector editor
2. Verify it contains path data
3. Check for unsupported SVG features (curves, transforms)
4. Re-run converter with different simplification tolerance

## Performance Impact

### Before
- Single JSON load
- Generic polygon rendering

### After
- Single JSON load (same)
- 42 Polygon2D nodes (minimal overhead)
- ~13,843 total vertices (optimized with simplification)
- **Performance:** Negligible difference, still smooth

## Future Enhancements

Now that we have SVG-based territories, we can:
- [ ] Add territory borders/outlines
- [ ] Support territory textures/patterns  
- [ ] Implement territory animations
- [ ] Create multiple map themes
- [ ] Add territory labels at optimal positions
- [ ] Support curved territory borders
- [ ] Hot-reload SVG changes during development
