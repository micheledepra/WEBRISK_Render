extends Node2D

## Individual territory node - handles visual representation and player interaction
## Now uses Polygon2D for accurate geographic shapes from SVG files

# Signals
signal territory_clicked(territory_id: String)

# Territory data
var territory_id: String = ""
var territory_display_name: String = ""  # Optional display name from polygon data
var polygon_data: Array = []  # Array of Vector2 points

# References
var game_state: GameState
var turn_manager: TurnManager

# UI nodes
@onready var territory_shape = $TerritoryShape
@onready var name_label = $NameLabel
@onready var army_label = $ArmyLabel
@onready var owner_label = $OwnerLabel
@onready var click_area = $ClickArea
@onready var collision_polygon = $ClickArea/CollisionPolygon2D

# Visual state
var is_hovered: bool = false
var is_highlighted: bool = false
var highlight_color: Color = Color.WHITE

# Store polygon data to apply after _ready()
var _pending_polygon_data: Array = []

func _ready():
	# Apply pending polygon data if it was set before _ready()
	if not _pending_polygon_data.is_empty():
		_apply_polygon_data(_pending_polygon_data)
	
	# Connect click area
	click_area.input_event.connect(_on_click_area_input_event)
	click_area.mouse_entered.connect(_on_mouse_entered)
	click_area.mouse_exited.connect(_on_mouse_exited)
	
	# Initial visual update
	update_visual()

## Set the polygon shape from converted SVG data
func set_polygon_data(polygon_points: Array):
	"""
	Apply polygon data to this territory.
	
	Args:
		polygon_points: Array of [x, y] coordinate pairs from JSON
	"""
	if polygon_points.is_empty():
		push_warning("Empty polygon data for territory: %s" % territory_id)
		return
	
	# Store the data
	_pending_polygon_data = polygon_points
	polygon_data = polygon_points
	
	# If nodes are ready, apply immediately. Otherwise, _ready() will apply it
	if is_node_ready():
		_apply_polygon_data(polygon_points)

## Internal: Apply polygon data to nodes
func _apply_polygon_data(polygon_points: Array):
	"""Apply the polygon points to Polygon2D and CollisionPolygon2D."""
	# Convert array of arrays to PackedVector2Array
	var vector_array = PackedVector2Array()
	for point in polygon_points:
		vector_array.append(Vector2(point[0], point[1]))
	
	# Apply to Polygon2D
	if territory_shape:
		territory_shape.polygon = vector_array
	else:
		push_warning("TerritoryShape node not found for: %s" % territory_id)
	
	# Apply to CollisionPolygon2D for click detection
	if collision_polygon:
		collision_polygon.polygon = vector_array
	else:
		push_warning("CollisionPolygon2D node not found for: %s" % territory_id)
	
	print("Applied polygon to %s: %d vertices" % [territory_id, vector_array.size()])

## Handle input events on territory
func _on_click_area_input_event(_viewport, event, _shape_idx):
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_on_territory_clicked()

## Handle mouse enter
func _on_mouse_entered():
	is_hovered = true
	update_visual()

## Handle mouse exit
func _on_mouse_exited():
	is_hovered = false
	update_visual()

## Handle territory click
func _on_territory_clicked():
	print("Territory clicked: %s" % territory_id)
	territory_clicked.emit(territory_id)

## Update visual appearance
func update_visual():
	if not game_state or territory_id == "":
		return
	
	var territory = game_state.get_territory(territory_id)
	if territory.is_empty():
		return
	
	# Update labels - use display name if available, otherwise format the ID
	if territory_display_name != "":
		name_label.text = territory_display_name
	else:
		name_label.text = format_territory_name(territory_id)
	
	army_label.text = str(territory["armies"])
	owner_label.text = territory["owner"]
	
	# Get base color from player color
	var base_color = game_state.player_colors.get(territory["owner"], Color.GRAY)
	
	# Apply hover effect
	if is_hovered:
		base_color = base_color.lightened(0.2)
	
	# Apply highlight if set
	if is_highlighted:
		base_color = base_color.lerp(highlight_color, 0.3)
	
	# Update Polygon2D color (was color_rect.color)
	territory_shape.color = base_color
	
	# Update label colors for readability
	var text_color = Color.WHITE if base_color.get_luminance() < 0.5 else Color.BLACK
	name_label.modulate = text_color
	army_label.modulate = text_color
	owner_label.modulate = text_color

## Format territory ID to readable name
func format_territory_name(id: String) -> String:
	return id.replace("_", " ").capitalize()

## Highlight territory with specific color
func highlight(color: Color):
	is_highlighted = true
	highlight_color = color
	update_visual()

## Remove highlight
func unhighlight():
	is_highlighted = false
	update_visual()
