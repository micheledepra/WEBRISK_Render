extends Node
class_name FortificationManager

## Manages army movement between owned territories during fortification phase

# Signals
signal fortification_started(source_id: String)
signal fortification_complete(source_id: String, destination_id: String, armies: int)

# References
var game_state: GameState

# Fortification state
var selected_source: String = ""
var selected_destination: String = ""
var has_fortified: bool = false  # Only one fortification per turn

func _ready():
	name = "FortificationManager"

## Initialize with GameState reference
func initialize(state: GameState):
	game_state = state
	print("FortificationManager initialized")

## Handle territory click during fortification phase
func handle_territory_click(territory_id: String) -> Dictionary:
	if not game_state:
		return {"success": false, "message": "Game state not initialized"}
	
	if has_fortified:
		return {"success": false, "message": "Already fortified this turn"}
	
	var territory = game_state.get_territory(territory_id)
	if territory.is_empty():
		return {"success": false, "message": "Territory not found"}
	
	var current_player = game_state.get_current_player()
	
	# Must be owned by current player
	if territory["owner"] != current_player:
		return {"success": false, "message": "You can only fortify your own territories"}
	
	# If no source selected yet
	if selected_source == "":
		# Must have 2+ armies (1 must remain)
		if territory["armies"] < 2:
			return {"success": false, "message": "Need at least 2 armies to fortify from (1 must remain)"}
		
		# Select as source
		selected_source = territory_id
		fortification_started.emit(territory_id)
		
		print("Fortification source selected: %s (%d armies)" % [territory_id, territory["armies"]])
		
		return {
			"success": true,
			"type": "fortification_source_selected",
			"territory_id": territory_id,
			"message": "Select adjacent owned territory to move armies to"
		}
	
	# Source already selected, now selecting destination
	else:
		# Validate fortification
		var validation = validate_fortification(selected_source, territory_id)
		if not validation["valid"]:
			# If clicked different owned territory, allow reselection
			if territory["owner"] == current_player:
				selected_source = ""
				selected_destination = ""
				return handle_territory_click(territory_id)
			
			return {"success": false, "message": validation["reason"]}
		
		# Valid fortification target
		selected_destination = territory_id
		
		return {
			"success": true,
			"type": "fortification_destination_selected",
			"source_id": selected_source,
			"destination_id": selected_destination,
			"message": "Select number of armies to move"
		}

## Validate fortification
func validate_fortification(source_id: String, destination_id: String) -> Dictionary:
	var source = game_state.get_territory(source_id)
	var destination = game_state.get_territory(destination_id)
	
	# Rule 1: Both territories must exist
	if source.is_empty() or destination.is_empty():
		return {"valid": false, "reason": "Territory does not exist"}
	
	# Rule 2: Both must be owned by current player
	var current_player = game_state.get_current_player()
	if source["owner"] != current_player or destination["owner"] != current_player:
		return {"valid": false, "reason": "Both territories must be owned by you"}
	
	# Rule 3: Territories must be adjacent
	if not game_state.are_adjacent(source_id, destination_id):
		return {"valid": false, "reason": "Territories must be adjacent"}
	
	# Rule 4: Source must have 2+ armies
	if source["armies"] < 2:
		return {"valid": false, "reason": "Source must have at least 2 armies"}
	
	return {"valid": true}

## Execute fortification
func execute_fortification(source_id: String, destination_id: String, army_count: int) -> Dictionary:
	var validation = validate_fortification(source_id, destination_id)
	if not validation["valid"]:
		return {"success": false, "message": validation["reason"]}
	
	var source = game_state.get_territory(source_id)
	
	# Validate army count
	if army_count < 1:
		return {"success": false, "message": "Must move at least 1 army"}
	
	if army_count >= source["armies"]:
		return {"success": false, "message": "Must leave at least 1 army in source territory"}
	
	# Move armies
	game_state.add_armies_to_territory(source_id, -army_count)
	game_state.add_armies_to_territory(destination_id, army_count)
	
	has_fortified = true
	fortification_complete.emit(source_id, destination_id, army_count)
	reset_fortification()
	
	print("Fortified: %s → %s (%d armies)" % [source_id, destination_id, army_count])
	
	return {
		"success": true,
		"type": "fortification",
		"source_id": source_id,
		"destination_id": destination_id,
		"armies_moved": army_count
	}

## Get valid fortification destinations from source
func get_valid_destinations(source_id: String) -> Array:
	var destinations = []
	var source = game_state.get_territory(source_id)
	
	if source.is_empty():
		return destinations
	
	var current_player = game_state.get_current_player()
	
	for neighbor_id in source["neighbors"]:
		var neighbor = game_state.get_territory(neighbor_id)
		if not neighbor.is_empty() and neighbor["owner"] == current_player:
			destinations.append(neighbor_id)
	
	return destinations

## Reset fortification state for new turn
func reset_fortification():
	selected_source = ""
	selected_destination = ""
	has_fortified = false

## Reset state for new turn
func reset_for_new_turn():
	reset_fortification()
