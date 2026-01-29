#!/usr/bin/env python3
"""
SVG Territory Path to Godot Polygon Converter
==============================================

This script converts SVG files from territories_svg folder
into Godot-compatible Polygon2D coordinate arrays.

Features:
- Parses individual SVG files from territories_svg folder
- Converts SVG path commands to Vector2 arrays
- Scales coordinates from source viewport to target dimensions
- Outputs JSON format for easy import into Godot
- Provides detailed console output and error handling

Author: Risk Game MVP Project
Date: 2024
"""

import json
import re
import sys
from pathlib import Path
from typing import List, Tuple, Dict
import xml.etree.ElementTree as ET


class SVGToGodotConverter:
    """Converts SVG path data to Godot Polygon2D format."""
    
    def __init__(self, source_width=1920, source_height=1080, 
                 target_width=1920, target_height=1080):
        """
        Initialize the converter with viewport dimensions.
        
        Args:
            source_width: Width of the original SVG viewport
            source_height: Height of the original SVG viewport
            target_width: Width of the target Godot viewport
            target_height: Height of the target Godot viewport
        """
        self.source_width = source_width
        self.source_height = source_height
        self.target_width = target_width
        self.target_height = target_height
        self.scale_x = target_width / source_width
        self.scale_y = target_height / source_height
    
    def parse_svg_file(self, file_path: str) -> List[Tuple[float, float]]:
        """
        Parse an SVG file and extract path data.
        
        Args:
            file_path: Path to the SVG file
            
        Returns:
            List of (x, y) coordinate tuples
        """
        try:
            # Parse the SVG XML
            tree = ET.parse(file_path)
            root = tree.getroot()
            
            # Handle namespace
            namespace = {'svg': 'http://www.w3.org/2000/svg'}
            
            # Find all path elements
            paths = root.findall('.//svg:path', namespace)
            if not paths:
                # Try without namespace
                paths = root.findall('.//path')
            
            if not paths:
                print(f"❌ ERROR: No path elements found in {file_path}")
                return []
            
            # Combine all paths (in case there are multiple)
            all_coordinates = []
            for path in paths:
                d = path.get('d', '')
                if d:
                    coords = self.parse_svg_path(d)
                    all_coordinates.extend(coords)
            
            return all_coordinates
            
        except Exception as e:
            print(f"❌ ERROR: Failed to parse SVG file {file_path}: {e}")
            return []
    
    def parse_svg_path(self, path_string: str) -> List[Tuple[float, float]]:
        """
        Parse SVG path commands into coordinate pairs.
        
        Supports:
        - M x,y (MoveTo)
        - L x,y (LineTo)
        - Z (ClosePath - ignored as it just connects to first point)
        
        Args:
            path_string: SVG path data string
            
        Returns:
            List of (x, y) coordinate tuples
        """
        coordinates = []
        
        # Remove extra whitespace and split by commands
        path_string = path_string.strip()
        
        # Split the path into tokens (commands and coordinates)
        tokens = re.findall(r'[MLZ]|[\d.]+', path_string)
        
        i = 0
        while i < len(tokens):
            token = tokens[i]
            
            if token in ['M', 'L']:
                # Next two tokens should be x and y coordinates
                if i + 2 < len(tokens):
                    try:
                        x = float(tokens[i + 1])
                        y = float(tokens[i + 2])
                        coordinates.append((x, y))
                        i += 3
                    except (ValueError, IndexError):
                        i += 1
                else:
                    i += 1
            elif token == 'Z':
                # Close path - skip
                i += 1
            else:
                # If we encounter a coordinate without a command,
                # assume it's a continuation of the last command (LineTo)
                if i + 1 < len(tokens):
                    try:
                        x = float(token)
                        y = float(tokens[i + 1])
                        coordinates.append((x, y))
                        i += 2
                    except (ValueError, IndexError):
                        i += 1
                else:
                    i += 1
        
        return coordinates
    
    def scale_coordinates(self, coordinates: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """
        Scale coordinates from source viewport to target viewport.
        
        Args:
            coordinates: List of (x, y) coordinate tuples
            
        Returns:
            List of scaled (x, y) coordinate tuples
        """
        scaled = []
        for x, y in coordinates:
            scaled_x = x * self.scale_x
            scaled_y = y * self.scale_y
            scaled.append((scaled_x, scaled_y))
        return scaled
    
    def simplify_polygon(self, coordinates: List[Tuple[float, float]], 
                         tolerance: float = 1.0) -> List[Tuple[float, float]]:
        """
        Simplify polygon by removing vertices that are very close together.
        This reduces file size and improves performance in Godot.
        
        Args:
            coordinates: List of (x, y) coordinate tuples
            tolerance: Minimum distance between points (in pixels)
            
        Returns:
            Simplified list of coordinates
        """
        if len(coordinates) <= 3:
            return coordinates
        
        simplified = [coordinates[0]]
        
        for i in range(1, len(coordinates)):
            prev_x, prev_y = simplified[-1]
            curr_x, curr_y = coordinates[i]
            
            # Calculate distance between points
            distance = ((curr_x - prev_x) ** 2 + (curr_y - prev_y) ** 2) ** 0.5
            
            if distance >= tolerance:
                simplified.append((curr_x, curr_y))
        
        return simplified
    
    def calculate_centroid(self, coordinates: List[Tuple[float, float]]) -> Tuple[float, float]:
        """
        Calculate the centroid (center point) of a polygon.
        Useful for positioning labels or determining territory centers.
        
        Args:
            coordinates: List of (x, y) coordinate tuples
            
        Returns:
            (x, y) tuple representing the centroid
        """
        if not coordinates:
            return (0, 0)
        
        x_sum = sum(x for x, y in coordinates)
        y_sum = sum(y for x, y in coordinates)
        count = len(coordinates)
        
        return (x_sum / count, y_sum / count)
    
    def convert_svg_folder(self, svg_folder: str, 
                           simplify: bool = True,
                           tolerance: float = 1.0) -> Dict[str, Dict]:
        """
        Convert all SVG files in a folder to Godot format.
        
        Args:
            svg_folder: Path to folder containing SVG files
            simplify: Whether to simplify polygons
            tolerance: Simplification tolerance (pixels)
            
        Returns:
            Dictionary with territory data including polygon points and centroids
        """
        svg_path = Path(svg_folder)
        
        if not svg_path.exists():
            print(f"❌ ERROR: Folder not found: {svg_folder}")
            return {}
        
        # Find all SVG files
        svg_files = list(svg_path.glob("*.svg"))
        
        if not svg_files:
            print(f"❌ ERROR: No SVG files found in {svg_folder}")
            return {}
        
        print(f"\n🔄 Converting {len(svg_files)} SVG files...")
        print(f"   Source folder: {svg_folder}")
        print(f"   Target viewport: {self.target_width}x{self.target_height}")
        print(f"   Scale factors: x={self.scale_x:.3f}, y={self.scale_y:.3f}")
        if simplify:
            print(f"   Simplification: ON (tolerance={tolerance}px)")
        else:
            print(f"   Simplification: OFF")
        print()
        
        result = {}
        
        for idx, svg_file in enumerate(sorted(svg_files), 1):
            # Get territory name from filename (remove .svg extension)
            territory_name = svg_file.stem.replace('_', ' ').title()
            territory_id = svg_file.stem  # Keep underscore version as ID
            
            print(f"  [{idx}/{len(svg_files)}] Processing '{territory_id}'...", end=" ")
            
            # Parse SVG file
            raw_coords = self.parse_svg_file(str(svg_file))
            
            if not raw_coords:
                print("❌ FAILED (no coordinates)")
                continue
            
            # Scale coordinates
            scaled_coords = self.scale_coordinates(raw_coords)
            
            # Simplify if requested
            if simplify:
                original_count = len(scaled_coords)
                scaled_coords = self.simplify_polygon(scaled_coords, tolerance)
                simplified_count = len(scaled_coords)
                reduction = ((original_count - simplified_count) / original_count * 100) if original_count > 0 else 0
            
            # Calculate centroid
            centroid = self.calculate_centroid(scaled_coords)
            
            # Format for Godot (Vector2 arrays)
            # Godot format: [[x1, y1], [x2, y2], ...]
            polygon_points = [[round(x, 2), round(y, 2)] for x, y in scaled_coords]
            
            result[territory_id] = {
                "name": territory_name,
                "polygon": polygon_points,
                "centroid": [round(centroid[0], 2), round(centroid[1], 2)],
                "vertex_count": len(polygon_points)
            }
            
            if simplify:
                print(f"✅ {original_count} → {simplified_count} vertices (-{reduction:.1f}%)")
            else:
                print(f"✅ {len(polygon_points)} vertices")
        
        print(f"\n✅ Conversion complete! {len(result)} territories converted.")
        return result
    
    def save_to_json(self, data: Dict, output_path: str):
        """
        Save converted territory data to JSON file.
        
        Args:
            data: Dictionary with territory polygon data
            output_path: Path to output JSON file
        """
        print(f"\n💾 Saving to: {output_path}")
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            
            # Calculate file size
            file_size = Path(output_path).stat().st_size
            size_kb = file_size / 1024
            
            print(f"✅ Successfully saved! File size: {size_kb:.2f} KB")
            print(f"   Total territories: {len(data)}")
            print(f"   Total vertices: {sum(t['vertex_count'] for t in data.values())}")
            
        except Exception as e:
            print(f"❌ ERROR: Failed to save file: {e}")
            sys.exit(1)


def main():
    """Main execution function."""
    print("=" * 70)
    print("SVG Territory to Godot Polygon Converter")
    print("=" * 70)
    print()
    
    # Configuration
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    # Default paths - use territories_svg folder
    default_input = project_root / "territories_svg"
    default_output = script_dir.parent / "data" / "territory_polygons.json"
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        input_folder = sys.argv[1]
    else:
        input_folder = str(default_input)
    
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        output_file = str(default_output)
    
    # Optional: Custom viewport dimensions
    source_width = 1920
    source_height = 1080
    target_width = 1920
    target_height = 1080
    
    if len(sys.argv) > 4:
        try:
            target_width = int(sys.argv[3])
            target_height = int(sys.argv[4])
        except ValueError:
            print("⚠️  Warning: Invalid target dimensions, using defaults (1920x1080)")
    
    print(f"📋 Configuration:")
    print(f"   Input folder: {input_folder}")
    print(f"   Output file:  {output_file}")
    print()
    
    # Create output directory if it doesn't exist
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Create converter
    converter = SVGToGodotConverter(
        source_width=source_width,
        source_height=source_height,
        target_width=target_width,
        target_height=target_height
    )
    
    # Convert all SVG files in folder
    godot_data = converter.convert_svg_folder(
        input_folder,
        simplify=True,
        tolerance=1.0  # Adjust this value: higher = more simplification
    )
    
    if not godot_data:
        print("\n❌ No territories converted. Exiting.")
        sys.exit(1)
    
    # Save to JSON
    converter.save_to_json(godot_data, output_file)
    
    print()
    print("=" * 70)
    print("🎉 Conversion complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Open Godot project")
    print("2. The JSON file has been saved to: " + str(output_file))
    print("3. Run the game - territories will automatically use the new shapes")
    print()


if __name__ == "__main__":
    main()
