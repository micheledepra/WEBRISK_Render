extends Node2D

## Individual territory node - handles visual representation and player interaction

# Signals
signal territory_clicked(territory_id: String)

# Territory data
var territory_id: String = ""
var size: Vector2 = Vector2(120, 80)

# References
var game_state: GameState
var turn_manager: TurnManager

# UI nodes
@onready var color_rect = $ColorRect
@onready var name_label = $NameLabel
@onready var army_label = $ArmyLabel
@onready var owner_label = $OwnerLabel
@onready var click_area = $ClickArea
@onready var collision_shape = $ClickArea/CollisionShape2D

# Visual state
var is_hovered: bool = false
var is_highlighted: bool = false
var highlight_color: Color = Color.WHITE

func _ready():
	# Set up collision shape
	var shape = RectangleShape2D.new()
	shape.size = size
	collision_shape.shape = shape
	collision_shape.position = size / 2
	
	# Set color rect size
	color_rect.size = size
	
	# Connect click area
	click_area.input_event.connect(_on_click_area_input_event)
	click_area.mouse_entered.connect(_on_mouse_entered)
	click_area.mouse_exited.connect(_on_mouse_exited)
	
	# Initial visual update
	update_visual()

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
	
	# Update labels
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
	
	color_rect.color = base_color
	
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
