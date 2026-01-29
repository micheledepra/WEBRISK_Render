# 🎯 Quick Reference: SVG to Godot Polygon Converter

## One-Line Command

```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py
```

**Run from:** `C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\`

---

## What It Does

✅ Converts all 42 SVG territory paths → Godot Polygon2D arrays  
✅ Generates `MVP_GODOT/data/territory_polygons.json`  
✅ Includes polygon coordinates, centroids, and vertex counts  
✅ Automatically simplifies polygons (5-10% reduction)  

---

## Output Format

```json
{
  "alaska": {
    "polygon": [[x1, y1], [x2, y2], ...],  // Ready for Godot
    "centroid": [450.25, 615.80],          // Territory center
    "vertex_count": 477                     // Number of points
  }
}
```

---

## Common Commands

### Basic Usage (Default 1920x1080)
```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py
```

### Custom Output Path
```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py js\territory-paths.js custom_output.json
```

### Scale to Different Viewport (e.g., 1280x720)
```powershell
python MVP_GODOT\tools\svg_to_godot_polygons.py js\territory-paths.js MVP_GODOT\data\territories.json 1280 720
```

---

## Using in Godot

### 1. Load JSON

```gdscript
var territory_data = {}

func load_territory_polygons():
    var file = FileAccess.open("res://data/territory_polygons.json", FileAccess.READ)
    if file:
        var json = JSON.new()
        if json.parse(file.get_as_text()) == OK:
            territory_data = json.data
        file.close()
```

### 2. Apply to Polygon2D

```gdscript
func set_territory_polygon(territory_name: String):
    if territory_name in territory_data:
        var poly_data = territory_data[territory_name]
        var vector_array = PackedVector2Array()
        
        for point in poly_data["polygon"]:
            vector_array.append(Vector2(point[0], point[1]))
        
        $Polygon2D.polygon = vector_array
        
        # Optional: Use centroid for positioning
        var centroid = poly_data["centroid"]
        position = Vector2(centroid[0], centroid[1])
```

---

## Troubleshooting One-Liners

**Python not found?**
```powershell
python --version
# If error, install from https://python.org/downloads
```

**Wrong directory?**
```powershell
cd "C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2"
```

**File doesn't exist?**
```powershell
ls js\territory-paths.js
```

**Need to create output folder?**
```powershell
mkdir MVP_GODOT\data -Force
```

---

## Key Numbers

- **42** territories converted
- **~13,800** total vertices
- **~700 KB** JSON file size
- **1-15%** polygon simplification
- **1920x1080** default viewport

---

## Files Created

✅ `MVP_GODOT/tools/svg_to_godot_polygons.py` - Converter script  
✅ `MVP_GODOT/tools/CONVERTER_USAGE_GUIDE.md` - Full documentation  
✅ `MVP_GODOT/data/territory_polygons.json` - Generated output  

---

## Need More Help?

See the full guide: `MVP_GODOT\tools\CONVERTER_USAGE_GUIDE.md`
