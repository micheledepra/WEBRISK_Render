# Godot Territory Polygon Integration Example
# This file shows how to use the generated territory_polygons.json in your Godot project

extends Node2D

## EXAMPLE 1: Load Territory Polygon Data
## ========================================

var territory_polygon_data = {}

func load_territory_polygons():
	"""Load the JSON file containing all territory polygon data."""
	var file = FileAccess.open("res://data/territory_polygons.json", FileAccess.READ)
	if file:
		var json = JSON.new()
		var parse_result = json.parse(file.get_as_text())
		if parse_result == OK:
			territory_polygon_data = json.data
			print("✅ Loaded polygon data for %d territories" % territory_polygon_data.size())
		else:
			push_error("Failed to parse territory_polygons.json: %s" % json.get_error_message())
		file.close()
	else:
		push_error("Failed to open territory_polygons.json")


## EXAMPLE 2: Apply Polygon to Territory Node
## ===========================================

func apply_polygon_to_territory(territory_node: Node2D, territory_name: String):
	"""
	Apply polygon data to a territory node's Polygon2D child.
	
	Args:
		territory_node: The Territory scene instance
		territory_name: Name of the territory (e.g., "alaska")
	"""
	if territory_name not in territory_polygon_data:
		push_warning("No polygon data found for territory: %s" % territory_name)
		return
	
	var poly_data = territory_polygon_data[territory_name]
	var polygon_node = territory_node.get_node("Polygon2D")  # Adjust path as needed
	
	if polygon_node:
		# Convert JSON array to PackedVector2Array
		var vector_array = PackedVector2Array()
		for point in poly_data["polygon"]:
			vector_array.append(Vector2(point[0], point[1]))
		
		# Set the polygon
		polygon_node.polygon = vector_array
		
		# Optional: Set color based on owner
		polygon_node.color = Color.GRAY
		
		print("✅ Applied polygon to %s: %d vertices" % [territory_name, poly_data["vertex_count"]])


## EXAMPLE 3: Position Territory at Centroid
## ==========================================

func position_territory_at_centroid(territory_node: Node2D, territory_name: String):
	"""
	Position a territory node at its geographic center (centroid).
	
	Args:
		territory_node: The Territory scene instance
		territory_name: Name of the territory
	"""
	if territory_name not in territory_polygon_data:
		return
	
	var centroid = territory_polygon_data[territory_name]["centroid"]
	territory_node.position = Vector2(centroid[0], centroid[1])


## EXAMPLE 4: Create Territory with Polygon
## =========================================

func create_territory_with_polygon(territory_name: String, Territory_scene: PackedScene) -> Node2D:
	"""
	Create a complete territory node with polygon data applied.
	
	Args:
		territory_name: Name of the territory
		Territory_scene: Preloaded Territory.tscn scene
		
	Returns:
		The instantiated territory node
	"""
	var territory = Territory_scene.instantiate()
	territory.name = territory_name
	
	# Apply polygon data
	apply_polygon_to_territory(territory, territory_name)
	
	# Position at centroid (optional - use if not using fixed grid layout)
	# position_territory_at_centroid(territory, territory_name)
	
	return territory


## EXAMPLE 5: Complete Main.gd Integration
## ========================================

# In your Main.gd:

# @onready var Territory_scene = preload("res://scenes/Territory.tscn")
# var territories = {}  # Your existing territory data

# func _ready():
# 	load_territory_polygons()
# 	create_all_territories()

# func create_all_territories():
# 	"""Create all territory nodes with polygon data."""
# 	var territory_names = [
# 		"alaska", "northwest_territory", "greenland", "alberta", "ontario", "quebec",
# 		"western_united_states", "eastern_united_states", "central_america",
# 		"venezuela", "brazil", "peru", "argentina",
# 		# ... all 42 territory names
# 	]
# 	
# 	for territory_name in territory_names:
# 		var territory = create_territory_with_polygon(territory_name, Territory_scene)
# 		add_child(territory)
# 		territories[territory_name] = territory


## EXAMPLE 6: Update Territory Colors
## ===================================

func update_territory_color(territory_name: String, owner_color: Color):
	"""
	Update the color of a territory's polygon.
	
	Args:
		territory_name: Name of the territory
		owner_color: The new color to apply
	"""
	if territory_name in territories:
		var territory = territories[territory_name]
		var polygon = territory.get_node("Polygon2D")
		if polygon:
			polygon.color = owner_color


## EXAMPLE 7: Get Territory Bounds
## ================================

func get_territory_bounds(territory_name: String) -> Rect2:
	"""
	Calculate the bounding rectangle of a territory.
	
	Args:
		territory_name: Name of the territory
		
	Returns:
		Rect2 representing the territory's bounds
	"""
	if territory_name not in territory_polygon_data:
		return Rect2()
	
	var polygon = territory_polygon_data[territory_name]["polygon"]
	
	var min_x = polygon[0][0]
	var max_x = polygon[0][0]
	var min_y = polygon[0][1]
	var max_y = polygon[0][1]
	
	for point in polygon:
		min_x = min(min_x, point[0])
		max_x = max(max_x, point[0])
		min_y = min(min_y, point[1])
		max_y = max(max_y, point[1])
	
	return Rect2(min_x, min_y, max_x - min_x, max_y - min_y)


## EXAMPLE 8: Check if Point is Inside Territory
## ==============================================

func point_in_territory(territory_name: String, point: Vector2) -> bool:
	"""
	Check if a point is inside a territory's polygon.
	Uses the Geometry2D.is_point_in_polygon() built-in function.
	
	Args:
		territory_name: Name of the territory
		point: The point to check
		
	Returns:
		True if point is inside the territory
	"""
	if territory_name not in territory_polygon_data:
		return false
	
	var polygon_data = territory_polygon_data[territory_name]["polygon"]
	var vector_array = PackedVector2Array()
	for p in polygon_data:
		vector_array.append(Vector2(p[0], p[1]))
	
	return Geometry2D.is_point_in_polygon(point, vector_array)


## EXAMPLE 9: Territory Statistics
## ================================

func print_territory_statistics():
	"""Print statistics about all territories."""
	print("\n=== Territory Polygon Statistics ===")
	print("Total territories: %d" % territory_polygon_data.size())
	
	var total_vertices = 0
	var max_vertices = 0
	var min_vertices = 9999
	var max_territory = ""
	var min_territory = ""
	
	for territory_name in territory_polygon_data:
		var vertex_count = territory_polygon_data[territory_name]["vertex_count"]
		total_vertices += vertex_count
		
		if vertex_count > max_vertices:
			max_vertices = vertex_count
			max_territory = territory_name
		
		if vertex_count < min_vertices:
			min_vertices = vertex_count
			min_territory = territory_name
	
	var avg_vertices = total_vertices / territory_polygon_data.size()
	
	print("Total vertices: %d" % total_vertices)
	print("Average vertices per territory: %.1f" % avg_vertices)
	print("Most complex: %s (%d vertices)" % [max_territory, max_vertices])
	print("Least complex: %s (%d vertices)" % [min_territory, min_vertices])
	print("====================================\n")


## NOTES:
## ======
## 
## 1. Territory.tscn should have a Polygon2D node as a child
## 2. Update the node path in get_node("Polygon2D") to match your scene structure
## 3. The polygon data uses absolute screen coordinates (1920x1080 viewport)
## 4. For collision detection, consider using CollisionPolygon2D with the same data
## 5. Centroids are useful for label positioning and AI pathfinding nodes
## 6. Simplification reduces vertices by ~5-10% while maintaining visual accuracy
##
## For more information, see:
## - MVP_GODOT/tools/CONVERTER_USAGE_GUIDE.md
## - MVP_GODOT/tools/QUICK_REFERENCE.md
