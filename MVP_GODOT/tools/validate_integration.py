#!/usr/bin/env python3
"""
Quick validation script to verify polygon integration is ready.
Checks that all required files and data are present.
"""

import json
from pathlib import Path

def check_integration():
    """Verify all components are ready for Godot integration."""
    
    print("🔍 Validating Polygon Integration Setup...")
    print("=" * 60)
    
    checks_passed = 0
    checks_total = 0
    
    # Check 1: JSON file exists
    checks_total += 1
    json_path = Path("MVP_GODOT/data/territory_polygons.json")
    if json_path.exists():
        print("✅ 1. JSON file exists:", json_path)
        checks_passed += 1
        
        # Check JSON is valid and has all territories
        checks_total += 1
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
            
            if len(data) == 42:
                print(f"✅ 2. JSON contains all 42 territories")
                checks_passed += 1
                
                # Sample a few territories
                sample_territories = ['alaska', 'quebec', 'great_britain', 'argentina']
                print("\n   📊 Sample Territory Data:")
                for terr in sample_territories:
                    if terr in data:
                        d = data[terr]
                        print(f"      • {terr}: {d['vertex_count']} vertices at [{d['centroid'][0]:.1f}, {d['centroid'][1]:.1f}]")
                
            else:
                print(f"❌ 2. JSON has {len(data)} territories (expected 42)")
        except json.JSONDecodeError as e:
            print(f"❌ 2. JSON parse error: {e}")
    else:
        print("❌ 1. JSON file missing:", json_path)
        print("   Run: python MVP_GODOT/tools/svg_to_godot_polygons.py")
        checks_total += 1
        print("⏭️  2. Skipping JSON validation")
    
    # Check 3: Territory.tscn updated
    checks_total += 1
    tscn_path = Path("MVP_GODOT/scenes/Territory.tscn")
    if tscn_path.exists():
        content = tscn_path.read_text()
        if 'Polygon2D' in content and 'CollisionPolygon2D' in content:
            print("✅ 3. Territory.tscn uses Polygon2D")
            checks_passed += 1
        else:
            print("❌ 3. Territory.tscn still uses ColorRect (not updated)")
    else:
        print("❌ 3. Territory.tscn not found")
    
    # Check 4: Territory.gd updated
    checks_total += 1
    gd_path = Path("MVP_GODOT/scripts/Territory.gd")
    if gd_path.exists():
        content = gd_path.read_text()
        if 'set_polygon_data' in content and 'territory_shape' in content:
            print("✅ 4. Territory.gd has polygon methods")
            checks_passed += 1
        else:
            print("❌ 4. Territory.gd missing set_polygon_data() method")
    else:
        print("❌ 4. Territory.gd not found")
    
    # Check 5: Main.gd updated
    checks_total += 1
    main_path = Path("MVP_GODOT/scripts/Main.gd")
    if main_path.exists():
        content = main_path.read_text(encoding='utf-8')
        if 'load_territory_polygons' in content and 'territory_polygon_data' in content:
            print("✅ 5. Main.gd loads polygon data")
            checks_passed += 1
        else:
            print("❌ 5. Main.gd missing load_territory_polygons() method")
    else:
        print("❌ 5. Main.gd not found")
    
    # Summary
    print("\n" + "=" * 60)
    print(f"📋 Results: {checks_passed}/{checks_total} checks passed")
    
    if checks_passed == checks_total:
        print("\n🎉 SUCCESS! Integration is complete and ready to test!")
        print("\n📝 Next Steps:")
        print("   1. Open MVP_GODOT project in Godot 4.3+")
        print("   2. Press F5 to run the game")
        print("   3. Verify territories render as polygons")
        print("   4. Check console for \"Loaded polygon data for 42 territories\"")
        print("\n📖 See POLYGON_INTEGRATION_COMPLETE.md for details")
        return True
    else:
        print("\n⚠️  Some checks failed - review errors above")
        return False

if __name__ == "__main__":
    import sys
    success = check_integration()
    sys.exit(0 if success else 1)
