extends Node

## Main game controller - initializes all managers and coordinates game flow

# Manager nodes
var game_state: GameState
var phase_manager: PhaseManager
var turn_manager: TurnManager
var reinforcement_manager: ReinforcementManager
var combat_system: CombatSystem
var fortification_manager: FortificationManager

# Territory polygon data from converted SVG
var territory_polygon_data = {}

# UI references
@onready var turn_label = $UIOverlay/Panel/VBox/TurnLabel
@onready var phase_label = $UIOverlay/Panel/VBox/PhaseLabel
@onready var player_label = $UIOverlay/Panel/VBox/PlayerLabel
@onready var armies_label = $UIOverlay/Panel/VBox/ArmiesLabel
@onready var instructions_label = $UIOverlay/Panel/VBox/InstructionsLabel
@onready var message_label = $UIOverlay/Panel/VBox/MessageLabel
@onready var end_phase_button = $UIOverlay/Panel/VBox/EndPhaseButton

# Game board
@onready var game_board = $GameBoard

# Test players
var test_players = ["Red Player", "Blue Player", "Green Player"]
var test_colors = {
	"Red Player": Color.RED,
	"Blue Player": Color.BLUE,
	"Green Player": Color.GREEN
}

func _ready():
	print("=== Risk Game MVP - Godot Edition ===")
	# Load polygon data BEFORE initializing game
	load_territory_polygons()
	initialize_managers()
	initialize_game()
	setup_ui()

## Initialize all manager nodes
func initialize_managers():
	# Create manager instances
	game_state = GameState.new()
	phase_manager = PhaseManager.new()
	turn_manager = TurnManager.new()
	reinforcement_manager = ReinforcementManager.new()
	combat_system = CombatSystem.new()
	fortification_manager = FortificationManager.new()
	
	# Add to scene tree
	add_child(game_state)
	add_child(phase_manager)
	add_child(turn_manager)
	add_child(reinforcement_manager)
	add_child(combat_system)
	add_child(fortification_manager)
	
	# Initialize managers with references
	phase_manager.initialize(game_state)
	reinforcement_manager.initialize(game_state)
	combat_system.initialize(game_state)
	fortification_manager.initialize(game_state)
	turn_manager.initialize(game_state, phase_manager, reinforcement_manager, combat_system, fortification_manager)
	
	# Connect signals
	game_state.state_changed.connect(_on_state_changed)
	game_state.victory_achieved.connect(_on_victory_achieved)
	phase_manager.phase_changed.connect(_on_phase_changed)
	turn_manager.turn_started.connect(_on_turn_started)
	turn_manager.action_performed.connect(_on_action_performed)
	combat_system.battle_dialog_requested.connect(_on_battle_dialog_requested)
	
	print("All managers initialized and connected")

## Initialize the game
func initialize_game():
	game_state.initialize_game(test_players, test_colors)
	
	# Create territory nodes on game board
	create_territory_nodes()
	
	update_ui()

## Load territory polygon data from JSON
func load_territory_polygons():
	"""Load the converted SVG polygon data from JSON file."""
	var file = FileAccess.open("res://data/territory_polygons.json", FileAccess.READ)
	if file:
		var json = JSON.new()
		var parse_result = json.parse(file.get_as_text())
		if parse_result == OK:
			territory_polygon_data = json.data
			print("✅ Loaded polygon data for %d territories" % territory_polygon_data.size())
		else:
			push_error("❌ Failed to parse territory_polygons.json: %s" % json.get_error_message())
		file.close()
	else:
		push_error("❌ Failed to open territory_polygons.json")
		push_error("   Make sure you've run the Python converter script!")
		push_error("   Expected location: res://data/territory_polygons.json")

## Create territory visual nodes with polygon data
func create_territory_nodes():
	"""
	Create all territory nodes using real geographic polygon shapes.
	Positions territories at their geographic centroids instead of grid layout.
	"""
	print("\n🗺️  Creating territories with polygon shapes...")
	
	if territory_polygon_data.is_empty():
		push_error("❌ No polygon data loaded! Territories will not appear correctly.")
		push_error("   Run: python MVP_GODOT\\tools\\svg_to_godot_polygons.py")
		return
	
	var territory_index = 0
	for territory_id in game_state.territories.keys():
		# Check if we have polygon data for this territory
		if territory_id not in territory_polygon_data:
			push_warning("⚠️  No polygon data for territory: %s" % territory_id)
			continue
		
		var poly_data = territory_polygon_data[territory_id]
		
		# Create territory node
		var territory_node = preload("res://scenes/Territory.tscn").instantiate()
		territory_node.territory_id = territory_id
		territory_node.game_state = game_state
		territory_node.turn_manager = turn_manager
		
		# Position at geographic centroid instead of grid
		var centroid = poly_data["centroid"]
		territory_node.position = Vector2(centroid[0], centroid[1])
		
		# Apply polygon shape data
		territory_node.set_polygon_data(poly_data["polygon"])
		
		# Set territory name from polygon data if available
		if "name" in poly_data:
			territory_node.territory_display_name = poly_data["name"]
		
		# Connect territory clicked signal
		territory_node.territory_clicked.connect(_on_territory_clicked)
		
		game_board.add_child(territory_node)
		territory_index += 1
	
	print("✅ Created %d territory nodes with polygon shapes" % territory_index)
	print("   Total vertices: %d" % _count_total_vertices())

## Helper: Count total vertices across all territories
func _count_total_vertices() -> int:
	var total = 0
	for poly_data in territory_polygon_data.values():
		total += poly_data["vertex_count"]
	return total

## Setup UI connections
func setup_ui():
	end_phase_button.pressed.connect(_on_end_phase_button_pressed)

## Update all UI elements
func update_ui():
	if not game_state:
		return
	
	# Update labels
	turn_label.text = "Turn: %d" % game_state.turn_number
	phase_label.text = "Phase: %s" % phase_manager.get_phase_name(phase_manager.current_phase)
	
	var current_player = game_state.get_current_player()
	player_label.text = "Current Player: %s" % current_player
	player_label.modulate = game_state.player_colors.get(current_player, Color.WHITE)
	
	var remaining = game_state.remaining_armies.get(current_player, 0)
	armies_label.text = "Remaining Armies: %d" % remaining
	
	if phase_manager:
		instructions_label.text = phase_manager.get_phase_instructions()
	
	# Update button state
	end_phase_button.disabled = not phase_manager.can_complete_phase()
	
	# Update all territory visuals
	update_territory_visuals()

## Update visual appearance of all territories
func update_territory_visuals():
	for child in game_board.get_children():
		if child.has_method("update_visual"):
			child.update_visual()

## Handle territory click
func _on_territory_clicked(territory_id: String):
	var result = turn_manager.handle_territory_click(territory_id)
	
	if result.get("success", false):
		message_label.text = result.get("message", "Action successful")
		message_label.modulate = Color.GREEN
	else:
		message_label.text = result.get("message", "Action failed")
		message_label.modulate = Color.RED
	
	update_ui()
	
	# Clear message after delay
	await get_tree().create_timer(3.0).timeout
	message_label.text = ""

## Handle end phase button
func _on_end_phase_button_pressed():
	var success = turn_manager.end_phase()
	
	if success:
		message_label.text = "Phase advanced"
		message_label.modulate = Color.GREEN
		
		# Reset fortification state on new turn
		if phase_manager.current_phase == PhaseManager.Phase.REINFORCEMENT:
			fortification_manager.reset_for_new_turn()
	else:
		message_label.text = "Cannot advance phase yet"
		message_label.modulate = Color.YELLOW
	
	update_ui()

## Handle state changes
func _on_state_changed():
	update_ui()

## Handle phase changes
func _on_phase_changed(new_phase):
	print("Phase changed to: %s" % phase_manager.get_phase_name(new_phase))
	update_ui()

## Handle turn start
func _on_turn_started(player_name: String):
	print("Turn started for: %s" % player_name)
	update_ui()

## Handle actions performed
func _on_action_performed(result: Dictionary):
	print("Action performed: %s" % result.get("type", "unknown"))

## Handle battle dialog request
func _on_battle_dialog_requested(attacker_id: String, defender_id: String):
	# For MVP, show simple input dialog
	# In full implementation, this would open BattleDialog.tscn
	show_battle_input_dialog(attacker_id, defender_id)

## Show simple battle input dialog
func show_battle_input_dialog(attacker_id: String, defender_id: String):
	var attacker = game_state.get_territory(attacker_id)
	var defender = game_state.get_territory(defender_id)
	
	print("\n=== BATTLE ===")
	print("Attacker: %s (%d armies)" % [attacker_id, attacker["armies"]])
	print("Defender: %s (%d armies)" % [defender_id, defender["armies"]])
	print("\nFor MVP, manually enter combat result in console:")
	print("  resolve_combat(attacker_remaining, defender_remaining)")
	print("  Example: resolve_combat(3, 0)  # Conquest!")

## Handle victory
func _on_victory_achieved(player_name: String):
	print("\n=== VICTORY ===")
	print("%s has conquered all territories!" % player_name)
	message_label.text = "VICTORY: %s wins!" % player_name
	message_label.modulate = game_state.player_colors.get(player_name, Color.YELLOW)
	
	# Disable further input
	end_phase_button.disabled = true

## Input handling for keyboard shortcuts
func _input(event):
	if event is InputEventKey and event.pressed:
		# Space to end phase
		if event.keycode == KEY_SPACE:
			_on_end_phase_button_pressed()
		
		# S to save game
		if event.keycode == KEY_S and event.ctrl_pressed:
			game_state.save_game()
			message_label.text = "Game saved"
			message_label.modulate = Color.GREEN

## Debug: Resolve combat manually (for MVP testing)
func resolve_combat(attacker_remaining: int, defender_remaining: int):
	var result = combat_system.resolve_combat(attacker_remaining, defender_remaining)
	
	if result.get("success", false):
		if result.get("conquest", false):
			var conquest_data = result.get("conquest_data", {})
			print("\nCONQUEST! Territory can be claimed")
			print("Call: complete_conquest('%s', %d)" % 
				[conquest_data.get("territory_id", ""), conquest_data.get("available_armies", 1)])
		
		update_ui()
	else:
		print("Combat resolution failed: %s" % result.get("message", "Unknown error"))

## Debug: Complete conquest manually
func complete_conquest(territory_id: String, armies_to_transfer: int):
	var current_player = game_state.get_current_player()
	var result = combat_system.complete_conquest(territory_id, current_player, armies_to_transfer)
	
	if result.get("success", false):
		print("Conquest complete!")
		update_ui()
	else:
		print("Conquest failed: %s" % result.get("message", "Unknown error"))
