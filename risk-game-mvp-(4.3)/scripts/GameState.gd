extends Node
class_name GameState

## Central game state management
## Handles territory data, player management, victory checking, and state persistence

# Signals for state changes
signal state_changed()
signal victory_achieved(player_name: String)
signal territories_assigned()
signal phase_changed(new_phase: String)

# Core game data
var territories: Dictionary = {}  # { "territory_id": Territory data }
var players: Array = []            # ["Player 1", "Player 2", ...]
var current_player_index: int = 0
var current_phase: String = "startup"  # startup, reinforcement, attack, fortification
var turn_number: int = 0
var remaining_armies: Dictionary = {}  # { "player": army_count }
var player_colors: Dictionary = {}     # { "player": Color }

# Map data references
var map_data: Dictionary = {}
var continent_data: Dictionary = {}

# Game flags
var initial_deployment_complete: bool = false
var is_new_game: bool = true

# Constants for initial army allocation
const INITIAL_ARMIES = {
	2: 40,
	3: 35,
	4: 30,
	5: 25,
	6: 20
}

func _ready():
	name = "GameState"

## Initialize new game with players
func initialize_game(player_names: Array, colors: Dictionary = {}):
	players = player_names.duplicate()
	player_colors = colors.duplicate()
	
	# Assign default colors if not provided
	var default_colors = [
		Color.RED, Color.BLUE, Color.GREEN, 
		Color.YELLOW, Color.MAGENTA, Color.CYAN
	]
	for i in range(players.size()):
		if not player_colors.has(players[i]):
			player_colors[players[i]] = default_colors[i % default_colors.size()]
	
	# Load map data
	load_map_data()
	
	# Check for saved game
	if has_saved_game():
		load_game()
		is_new_game = false
	else:
		# Initialize new game
		assign_territories_randomly()
		calculate_remaining_armies()
		current_phase = "startup"
		turn_number = 0
		is_new_game = true
	
	state_changed.emit()
	print("Game initialized with %d players" % players.size())

## Load map and continent data from JSON files
func load_map_data():
	# Load territory neighbor relationships
	var map_file = FileAccess.open("res://resources/map_data.json", FileAccess.READ)
	if map_file:
		var json_parser = JSON.new()
		var parse_result = json_parser.parse(map_file.get_as_text())
		if parse_result == OK:
			map_data = json_parser.data
		map_file.close()
	
	# Load continent definitions
	var continent_file = FileAccess.open("res://resources/continents.json", FileAccess.READ)
	if continent_file:
		var json_parser = JSON.new()
		var parse_result = json_parser.parse(continent_file.get_as_text())
		if parse_result == OK:
			continent_data = json_parser.data
		continent_file.close()

## Randomly assign all territories to players (Fisher-Yates shuffle)
func assign_territories_randomly():
	if territories.size() > 0 and not is_new_game:
		print("Territories already assigned, skipping")
		return
	
	var territory_ids = map_data.keys()
	territory_ids.shuffle()  # Built-in Fisher-Yates shuffle
	
	# Distribute territories evenly
	for i in range(territory_ids.size()):
		var territory_id = territory_ids[i]
		var player_index = i % players.size()
		var player = players[player_index]
		
		territories[territory_id] = {
			"owner": player,
			"armies": 1,
			"neighbors": map_data[territory_id]["neighbors"],
			"continent": map_data[territory_id]["continent"]
		}
		
		# Deduct 1 army from player's remaining pool
		if remaining_armies.has(player):
			remaining_armies[player] -= 1
	
	territories_assigned.emit()
	print("Assigned %d territories to %d players" % [territory_ids.size(), players.size()])

## Calculate remaining armies for each player based on initial allocation
func calculate_remaining_armies():
	var army_count = INITIAL_ARMIES.get(players.size(), 20)
	
	for player in players:
		# Start with full allocation, then subtract territories already occupied
		var owned_count = count_player_territories(player)
		remaining_armies[player] = army_count - owned_count

## Count territories owned by a specific player
func count_player_territories(player: String) -> int:
	var count = 0
	for territory in territories.values():
		if territory["owner"] == player:
			count += 1
	return count

## Calculate reinforcements for a player at turn start
## Formula: max(1, floor(territories / 3)) + continent_bonuses
func calculate_reinforcements(player: String) -> int:
	var territory_count = count_player_territories(player)
	var base_reinforcement = max(1, int(floor(territory_count / 3.0)))
	
	var continent_bonus = calculate_continent_bonuses(player)
	
	var total = base_reinforcement + continent_bonus
	print("Player %s reinforcements: %d (base) + %d (continents) = %d" % 
		[player, base_reinforcement, continent_bonus, total])
	
	return total

## Calculate continent control bonuses
func calculate_continent_bonuses(player: String) -> int:
	var bonus = 0
	
	for continent_name in continent_data.keys():
		var continent = continent_data[continent_name]
		var owns_continent = true
		
		# Check if player owns all territories in continent
		for territory_id in continent["territories"]:
			if not territories.has(territory_id) or territories[territory_id]["owner"] != player:
				owns_continent = false
				break
		
		if owns_continent:
			bonus += continent["bonus"]
			print("  %s controls %s (+%d armies)" % [player, continent_name, continent["bonus"]])
	
	return bonus

## Get current player name
func get_current_player() -> String:
	if players.is_empty():
		return ""
	return players[current_player_index]

## Advance to next player
func advance_player():
	current_player_index = (current_player_index + 1) % players.size()
	
	# If cycled back to first player, increment turn number
	if current_player_index == 0:
		turn_number += 1
		print("=== Turn %d ===" % turn_number)

## Check if any player has won (controls all territories)
func check_victory() -> String:
	var territory_count = {}
	
	for territory in territories.values():
		var owner = territory["owner"]
		if not territory_count.has(owner):
			territory_count[owner] = 0
		territory_count[owner] += 1
	
	var total_territories = territories.size()
	for player in territory_count.keys():
		if territory_count[player] == total_territories:
			victory_achieved.emit(player)
			return player
	
	return ""

## Get territory data by ID
func get_territory(territory_id: String) -> Dictionary:
	return territories.get(territory_id, {})

## Update territory owner
func set_territory_owner(territory_id: String, new_owner: String):
	if territories.has(territory_id):
		territories[territory_id]["owner"] = new_owner
		state_changed.emit()

## Update territory army count
func set_territory_armies(territory_id: String, army_count: int):
	if territories.has(territory_id):
		territories[territory_id]["armies"] = max(0, army_count)
		state_changed.emit()

## Add armies to territory
func add_armies_to_territory(territory_id: String, army_count: int):
	if territories.has(territory_id):
		territories[territory_id]["armies"] += army_count
		state_changed.emit()

## Check if territories are adjacent
func are_adjacent(territory_a: String, territory_b: String) -> bool:
	if not territories.has(territory_a):
		return false
	return territories[territory_a]["neighbors"].has(territory_b)

## Get all territories owned by player
func get_player_territories(player: String) -> Array:
	var owned = []
	for territory_id in territories.keys():
		if territories[territory_id]["owner"] == player:
			owned.append(territory_id)
	return owned

## Save game state to file
func save_game():
	var save_data = {
		"territories": territories,
		"players": players,
		"current_player_index": current_player_index,
		"current_phase": current_phase,
		"turn_number": turn_number,
		"remaining_armies": remaining_armies,
		"player_colors_hex": {},
		"initial_deployment_complete": initial_deployment_complete,
		"is_new_game": is_new_game
	}
	
	# Convert colors to hex strings for JSON compatibility
	for player in player_colors.keys():
		save_data["player_colors_hex"][player] = player_colors[player].to_html()
	
	var save_file = FileAccess.open("user://risk_save.json", FileAccess.WRITE)
	if save_file:
		save_file.store_string(JSON.stringify(save_data, "\t"))
		save_file.close()
		print("Game saved successfully")

## Load game state from file
func load_game():
	var save_file = FileAccess.open("user://risk_save.json", FileAccess.READ)
	if not save_file:
		print("No save file found")
		return
	
	var json_parser = JSON.new()
	var parse_result = json_parser.parse(save_file.get_as_text())
	save_file.close()
	
	if parse_result != OK:
		print("Failed to parse save file")
		return
	
	var save_data = json_parser.data
	
	# Restore state
	territories = save_data.get("territories", {})
	players = save_data.get("players", [])
	current_player_index = save_data.get("current_player_index", 0)
	current_phase = save_data.get("current_phase", "startup")
	turn_number = save_data.get("turn_number", 0)
	remaining_armies = save_data.get("remaining_armies", {})
	initial_deployment_complete = save_data.get("initial_deployment_complete", false)
	is_new_game = save_data.get("is_new_game", true)
	
	# Restore player colors from hex strings
	var color_data = save_data.get("player_colors_hex", {})
	for player in color_data.keys():
		player_colors[player] = Color.from_string(color_data[player], Color.WHITE)
	
	print("Game loaded successfully - Turn %d, Phase: %s" % [turn_number, current_phase])

## Check if saved game exists
func has_saved_game() -> bool:
	return FileAccess.file_exists("user://risk_save.json")

## Clear saved game
func clear_save():
	if FileAccess.file_exists("user://risk_save.json"):
		DirAccess.remove_absolute("user://risk_save.json")
		print("Save file cleared")
