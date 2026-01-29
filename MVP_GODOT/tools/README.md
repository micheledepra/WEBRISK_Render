# MVP_GODOT/tools - Development Tools

This directory contains utility scripts for the Risk Game MVP Godot project.

## 📁 Contents

### Scripts

- **`svg_to_godot_polygons.py`** - Main converter script
  - Converts SVG territory paths to Godot Polygon2D format
  - Parses JavaScript source file (territory-paths.js)
  - Generates JSON with polygon coordinates and metadata
  - Handles scaling and polygon simplification

### Documentation

- **`CONVERTER_USAGE_GUIDE.md`** - Complete beginner-friendly guide
  - Prerequisites and installation
  - Step-by-step instructions
  - Troubleshooting section
  - Godot integration examples

- **`QUICK_REFERENCE.md`** - Quick reference card
  - One-line commands
  - Common use cases
  - Code snippets
  - Key numbers and file locations

### Generated Data

Output is created in: `MVP_GODOT/data/territory_polygons.json`

## 🚀 Quick Start

```powershell
# From project root directory
cd "C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2"

# Run converter
python MVP_GODOT\tools\svg_to_godot_polygons.py
```

## 📚 Documentation Links

- **New User?** Start with `CONVERTER_USAGE_GUIDE.md`
- **Need Quick Command?** See `QUICK_REFERENCE.md`
- **Script Details?** Read docstrings in `svg_to_godot_polygons.py`

## ✨ Features

- ✅ Converts all 42 territories automatically
- ✅ No external dependencies (uses Python stdlib)
- ✅ Automatic coordinate scaling
- ✅ Polygon simplification (5-10% reduction)
- ✅ Centroid calculation for each territory
- ✅ Detailed console output with progress tracking
- ✅ JSON output ready for Godot import

## 🎯 Use Cases

### 1. Initial Setup
Convert SVG paths to Godot format for the first time.

### 2. Viewport Scaling
Need different dimensions? Re-run with custom target viewport.

### 3. Re-conversion
Updated territory-paths.js? Simply re-run the converter.

## 🔧 Requirements

- Python 3.7 or higher
- No pip packages needed!
- Source file: `js/territory-paths.js`

## 📊 Stats

After conversion you'll have:
- **42 territories** with full polygon data
- **~13,800 vertices** total
- **~700 KB** JSON file
- **Centroid coordinates** for label positioning
- **Vertex counts** for performance monitoring

## 🆘 Need Help?

1. Check `CONVERTER_USAGE_GUIDE.md` - Troubleshooting section
2. Verify Python installation: `python --version`
3. Ensure you're in the correct directory: `pwd`
4. Check source file exists: `ls js\territory-paths.js`

## 🔄 Workflow

```
SVG Data → Converter Script → JSON Output → Godot Integration
   ↓              ↓                ↓              ↓
territory-   svg_to_godot_   territory_    Load in Main.gd
paths.js     polygons.py     polygons.json  Apply to Polygon2D
```

## 📝 Next Steps

After running the converter:

1. ✅ JSON file created at `MVP_GODOT/data/territory_polygons.json`
2. ⏭️ Update `Territory.tscn` to use Polygon2D instead of ColorRect
3. ⏭️ Modify `Territory.gd` to set polygon property
4. ⏭️ Update `Main.gd` to load JSON and apply polygon data
5. ⏭️ Replace grid layout with geographic positioning using centroids

See `CONVERTER_USAGE_GUIDE.md` section "Integration with Godot" for code examples.

---

**Created:** 2024  
**Project:** Risk Game MVP  
**Godot Version:** 4.3+  
**Python Version:** 3.7+
