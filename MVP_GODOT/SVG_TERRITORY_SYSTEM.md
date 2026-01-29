# SVG Territory System

## Overview

The Godot MVP now uses individual SVG files for each territory, providing accurate geographic shapes for the Risk game map. Each territory is rendered as a `Polygon2D` with its own unique shape from the SVG files.

## How It Works

### 1. SVG Files
- Location: `territories_svg/` folder in project root
- Each territory has its own `.svg` file (e.g., `alaska.svg`, `brazil.svg`)
- Files are named using snake_case matching the territory IDs in game data

### 2. Conversion Process
- Python script: `MVP_GODOT/tools/svg_to_godot_polygons.py`
- Converts SVG paths to Godot-compatible polygon coordinates
- Outputs: `MVP_GODOT/data/territory_polygons.json`
- Includes:
  - Polygon vertices (Vector2 arrays)
  - Territory centroids (for label positioning)
  - Display names (formatted from filenames)

### 3. Territory Rendering
- Each territory is a scene instance of `Territory.tscn`
- Contains:
  - `Polygon2D` for shape rendering
  - `Area2D` with `CollisionPolygon2D` for click detection
  - Labels for name, army count, and owner
- Color changes dynamically based on owner
- Supports hover effects and highlighting

### 4. Map Assembly
- `Main.gd` loads the polygon data from JSON
- Creates territory instances dynamically
- Positions each territory at its geographic centroid
- Connects all territory signals for interaction

## Directory Structure

```
mvp-stars2/
├── territories_svg/          # Individual SVG files
│   ├── alaska.svg
│   ├── brazil.svg
│   ├── china.svg
│   └── ...
│
└── MVP_GODOT/
    ├── data/
    │   └── territory_polygons.json    # Generated polygon data
    ├── resources/
    │   ├── map_data.json              # Territory connections
    │   └── continents.json            # Continent definitions
    ├── scenes/
    │   ├── Territory.tscn             # Territory scene template
    │   └── Main.tscn                  # Main game scene
    ├── scripts/
    │   ├── Territory.gd               # Territory behavior
    │   └── Main.gd                    # Game initialization
    └── tools/
        └── svg_to_godot_polygons.py   # Conversion script
```

## Adding/Updating Territories

### To Add a New Territory:

1. Create SVG file in `territories_svg/` folder
   - Name it using snake_case (e.g., `new_territory.svg`)
   - Ensure it contains path data

2. Update game data files:
   - Add to `resources/map_data.json` with neighbors
   - Add to appropriate continent in `resources/continents.json`

3. Run converter:
   ```bash
   python MVP_GODOT/tools/svg_to_godot_polygons.py
   ```

4. Run the game - territory will automatically appear!

### To Update an Existing Territory Shape:

1. Edit the SVG file in `territories_svg/`
2. Run converter:
   ```bash
   python MVP_GODOT/tools/svg_to_godot_polygons.py
   ```
3. Restart the game

## Features

### Visual Features
- ✅ Accurate geographic shapes from SVG
- ✅ Dynamic color based on owner
- ✅ Hover effects (lighter color)
- ✅ Highlighting system for valid moves
- ✅ Army count display on each territory
- ✅ Owner name display

### Technical Features
- ✅ Polygon simplification (reduces vertices for performance)
- ✅ Automatic centroid calculation for label positioning
- ✅ Click detection matching exact territory shape
- ✅ Scalable coordinate system (supports different viewport sizes)
- ✅ Named territory display (formatted from filenames)

## Converter Options

The `svg_to_godot_polygons.py` script supports customization:

```bash
# Basic usage (uses defaults)
python MVP_GODOT/tools/svg_to_godot_polygons.py

# Custom input folder
python MVP_GODOT/tools/svg_to_godot_polygons.py path/to/svgs

# Custom output file
python MVP_GODOT/tools/svg_to_godot_polygons.py input_folder output.json

# Custom viewport size
python MVP_GODOT/tools/svg_to_godot_polygons.py input output.json 1920 1080
```

### Simplification Settings

In the script, you can adjust polygon simplification:
- `tolerance=1.0` (default) - Removes vertices closer than 1 pixel
- Higher tolerance = more simplification = fewer vertices
- Lower tolerance = more detail = more vertices

## Performance

Current stats with 42 territories:
- **Total vertices:** ~13,843
- **File size:** ~701 KB JSON
- **Average per territory:** ~330 vertices
- **Simplification:** ~3-8% reduction from original SVG

The system is optimized for smooth rendering in Godot with:
- Antialiased polygons
- Efficient collision detection
- Minimal draw calls per territory

## Troubleshooting

### Territory Not Appearing
1. Check if SVG file exists in `territories_svg/`
2. Verify territory ID matches in:
   - SVG filename (snake_case)
   - `map_data.json`
   - `continents.json`
3. Run converter script
4. Check Godot console for warnings

### Wrong Territory Shape
1. Open SVG file and verify it contains path data
2. Ensure SVG uses standard path commands (M, L, Z)
3. Re-run converter script
4. Clear Godot cache and restart

### Labels Positioned Incorrectly
- Labels are positioned at territory centroids
- If off-center, may need to manually adjust in `Territory.tscn`
- Or use weighted centroid calculation in converter

## Future Enhancements

Potential improvements:
- [ ] SVG color extraction for default territory colors
- [ ] Support for SVG groups (multi-part territories)
- [ ] Curved path support (C, Q, etc.)
- [ ] Visual territory editor in Godot
- [ ] Hot-reload SVG changes during development
- [ ] Texture/pattern fills for territories
- [ ] Border stroke customization
