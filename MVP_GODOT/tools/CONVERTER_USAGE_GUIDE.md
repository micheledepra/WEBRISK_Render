# SVG to Godot Polygon Converter - Complete Usage Guide

## 📋 Overview

This Python script converts individual SVG files from the `territories_svg` folder into Godot-compatible Polygon2D coordinate arrays. It handles all 42 territories, scaling coordinates, calculating centroids, and generating JSON output ready for import into your Godot project.

---

## ⚙️ Prerequisites

### Required Software
- **Python 3.7 or higher** - [Download Python](https://www.python.org/downloads/)
  - To check if Python is installed: Open PowerShell and run `python --version`
  - If not installed, download from python.org and ensure "Add Python to PATH" is checked during installation

### Required Files
- `territories_svg/` folder with 42 SVG files (already in your project)
- The converter script - `MVP_GODOT/tools/svg_to_godot_polygons.py`

### No Additional Dependencies
The script uses only Python standard library modules (json, re, sys, pathlib, xml.etree.ElementTree), so **no pip install required**!

---

## 🚀 Quick Start Guide

### Step 1: Open PowerShell or Command Prompt

**Windows Users:**
1. Press `Win + X` and select "Windows PowerShell" or "Command Prompt"
2. Alternatively, press `Win + R`, type `powershell`, and press Enter

### Step 2: Navigate to Your Project

```powershell
cd "C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2"
```

### Step 3: Run the Converter

**Basic Usage (Recommended):**
```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py
```

This will:
- Read from: `territories_svg/` folder (42 SVG files)
- Write to: `MVP_GODOT/data/territory_polygons.json`
- Use default viewport: 1920x1080 (no scaling)
- Apply polygon simplification (1.0px tolerance)

### Step 4: Check the Output

You should see output like this:

```
======================================================================
SVG Territory to Godot Polygon Converter
======================================================================

📋 Configuration:
   Input folder: C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\territories_svg
   Output file:  C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\MVP_GODOT\data\territory_polygons.json

🔄 Converting 42 SVG files...
   Source folder: C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\territories_svg
   Target viewport: 1920x1080
   Scale factors: x=1.000, y=1.000
   Simplification: ON (tolerance=1.0px)

  [1/42] Processing 'afghanistan'... ✅ 269 → 266 vertices (-1.1%)
  [2/42] Processing 'alaska'... ✅ 505 → 477 vertices (-5.5%)
  [3/42] Processing 'alberta'... ✅ 203 → 194 vertices (-4.4%)
  ...
  [42/42] Processing 'yakutsk'... ✅ 200 → 197 vertices (-1.5%)

✅ Conversion complete! 42 territories converted.

💾 Saving to: [path]
✅ Successfully saved! File size: 701.39 KB
   Total territories: 42
   Total vertices: 13843

======================================================================
🎉 Conversion complete!
======================================================================

Next steps:
1. Open Godot project
2. The JSON file has been saved to: [path]
3. Run the game - territories will automatically use the new shapes
```

---

## 🎛️ Advanced Usage

### Custom Input Folder

```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py <input_folder>
```

Example with custom SVG folder:
```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py my_custom_svgs\
```

### Custom Output File

```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py <input_folder> <output_file>
```

Example:
```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py territories_svg custom_output\territories.json
```

### Custom Viewport Scaling

If your Godot viewport is different from 1920x1080:

```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py <input_folder> <output_file> <target_width> <target_height>
```

Example for 1280x720:
```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py territories_svg MVP_GODOT\data\territories.json 1280 720
```

This will automatically scale all coordinates proportionally.

---

## 📊 Understanding the Output

### JSON Structure

The generated JSON file contains:

```json
{
  "afghanistan": {
    "name": "Afghanistan",
    "polygon": [
      [2970.0, 920.0],
      [2967.5, 915.0],
      [2962.5, 910.0],
      ...
    ],
    "centroid": [2950.25, 915.80],
    "vertex_count": 266
  },
  "alaska": {
    "name": "Alaska",
    ...
  },
  ...
}
```

**Fields Explained:**
- `name`: Formatted display name for the territory (NEW!)
- `polygon`: Array of [x, y] coordinate pairs for the Polygon2D shape
- `centroid`: Center point of the territory (used for label positioning)
- `vertex_count`: Number of vertices in the polygon

### Simplification

The script automatically simplifies polygons by removing vertices that are very close together (within 1 pixel). This:
- Reduces file size by ~3-8%
- Improves Godot rendering performance
- Maintains visual accuracy (differences are imperceptible)

---

## 🔧 Troubleshooting

### Error: "python is not recognized"

**Problem:** Python is not installed or not in PATH

**Solution:**
1. Download Python from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart PowerShell after installation
4. Verify with: `python --version`

### Error: "Folder not found"

**Problem:** territories_svg folder doesn't exist or wrong path

**Solution:**
1. Verify you're in the correct directory: `pwd`
2. Check that the folder exists: `ls territories_svg`
3. Verify SVG files are in the folder: `ls territories_svg\*.svg`
4. Use full paths if relative paths don't work

### Error: "No SVG files found"

**Problem:** The territories_svg folder is empty or has wrong file extension

**Solution:**
1. Check that files have .svg extension (not .SVG or .svg.txt)
2. Verify files are in the correct folder
3. Try: `Get-ChildItem territories_svg\*.svg | Measure-Object`

### Error: "No path elements found in SVG"

**Problem:** SVG file doesn't contain path data or has unsupported format

**Solution:**
1. Open the SVG file in a text editor or browser
2. Verify it contains `<path d="...">` elements
3. Check for XML namespace issues
4. Try opening in Inkscape or another SVG editor to validate

### Script runs but no output

**Problem:** Output directory doesn't exist or permission denied

**Solution:**
1. Create the output directory manually: `mkdir MVP_GODOT\data -Force`
2. Run script again
3. Check file permissions on the output directory

---

## 🎯 Integration with Godot

### Next Steps After Conversion

1. **Load the JSON in Godot:**

```gdscript
# In Main.gd or a data loader script
var territory_data = {}

func load_territory_polygons():
    var file = FileAccess.open("res://data/territory_polygons.json", FileAccess.READ)
    if file:
        var json = JSON.new()
        var parse_result = json.parse(file.get_as_text())
        if parse_result == OK:
            territory_data = json.data
        file.close()
```

2. **Update Territory.tscn:**
   - Replace ColorRect with Polygon2D node
   - Name it "PolygonShape" or similar

3. **Update Territory.gd:**

```gdscript
@onready var polygon = $PolygonShape

func set_polygon_data(polygon_points: Array):
    # Convert array to PackedVector2Array
    var vector_array = PackedVector2Array()
    for point in polygon_points:
        vector_array.append(Vector2(point[0], point[1]))
    polygon.polygon = vector_array
```

4. **Update Main.gd territory creation:**

```gdscript
func create_territory_nodes():
    load_territory_polygons()
    
    for territory_name in territories.keys():
        var territory = Territory_scene.instantiate()
        territory.territory_name = territory_name
        
        # Set polygon data
        if territory_name in territory_data:
            var poly_data = territory_data[territory_name]
            territory.set_polygon_data(poly_data["polygon"])
            
            # Position at centroid instead of grid
            var centroid = poly_data["centroid"]
            territory.position = Vector2(centroid[0], centroid[1])
        
        add_child(territory)
```

---

## 📝 Script Configuration

### Adjustable Parameters

You can edit the script to customize behavior:

**Simplification Tolerance** (line 233):
```python
tolerance=1.0  # Higher = more simplification (2.0-5.0 recommended range)
```

**Coordinate Rounding** (line 232):
```python
round(x, 2)  # Decimal places (2 = 0.01 precision, 1 = 0.1 precision)
```

**Source Viewport** (lines 199-200):
```python
source_width = 1920   # Original SVG dimensions
source_height = 1080
```

---

## 📚 Additional Features

### Vertex Count Information

The script outputs how many vertices each territory has. This is useful for:
- Performance optimization (fewer vertices = faster rendering)
- Identifying complex territories that might need manual adjustment
- Comparing before/after simplification

### Centroid Calculation

Each territory includes its centroid (geometric center). Use this for:
- Positioning territory labels
- Calculating distances between territories
- Determining starting positions for game pieces
- AI pathfinding nodes

### Automatic Scaling

The script handles coordinate scaling automatically. If you want to test different viewport sizes, just change the target dimensions - all coordinates will scale proportionally.

---

## 🆘 Getting Help

### Common Questions

**Q: Can I run this multiple times?**
A: Yes! The script will overwrite the output file each time. It's safe to run repeatedly.

**Q: Will this modify my original SVG file?**
A: No, the script only reads from territory-paths.js. Your original file is never modified.

**Q: What if I want to scale to a different size later?**
A: Just run the script again with new target dimensions. You don't need to change the source file.

**Q: Can I edit the JSON output?**
A: Yes! It's plain JSON. You can manually adjust coordinates if needed, though this isn't recommended.

---

## 📌 Summary Checklist

Before running:
- [ ] Python 3.7+ installed
- [ ] In the correct project directory
- [ ] territory-paths.js file exists

After running:
- [ ] JSON file created in MVP_GODOT/data/
- [ ] No error messages in console
- [ ] File size looks reasonable (~200-300 KB)
- [ ] Ready to integrate with Godot!

---

## 📞 Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify all prerequisites are met
3. Try running with full file paths instead of relative paths
4. Check PowerShell error messages for specific issues

---

**Created:** 2024
**Version:** 1.0
**For:** Risk Game MVP - Godot 4.3+
