extends Node
class_name CombatSystem

## Handles attack validation, combat resolution, and conquest

# Signals
signal combat_initiated(attacker_id: String, defender_id: String)
signal combat_resolved(result: Dictionary)
signal territory_conquered(territory_id: String, new_owner: String)
signal battle_dialog_requested(attacker_id: String, defender_id: String)

# References
var game_state: GameState

# Combat state
var selected_attacker: String = ""
var selected_defender: String = ""
var combat_in_progress: bool = false

# Current combat instance
var current_combat: Dictionary = {}

func _ready():
	name = "CombatSystem"

## Initialize with GameState reference
func initialize(state: GameState):
	game_state = state
	print("CombatSystem initialized")

## Handle territory click during attack phase
func handle_territory_click_for_attack(territory_id: String) -> Dictionary:
	if not game_state:
		return {"success": false, "message": "Game state not initialized"}
	
	var territory = game_state.get_territory(territory_id)
	if territory.is_empty():
		return {"success": false, "message": "Territory not found"}
	
	var current_player = game_state.get_current_player()
	
	# If no attacker selected yet
	if selected_attacker == "":
		# Must be owned by current player and have 2+ armies
		if territory["owner"] != current_player:
			return {"success": false, "message": "Select your own territory to attack from"}
		
		if territory["armies"] < 2:
			return {"success": false, "message": "Need at least 2 armies to attack (1 must remain)"}
		
		# Select as attacker
		selected_attacker = territory_id
		print("Attacker selected: %s (%d armies)" % [territory_id, territory["armies"]])
		
		return {
			"success": true,
			"type": "attacker_selected",
			"territory_id": territory_id,
			"message": "Select adjacent enemy territory to attack"
		}
	
	# Attacker already selected, now selecting defender
	else:
		# Validate attack
		var validation = validate_attack(selected_attacker, territory_id)
		if not validation["valid"]:
			# If clicked own territory again, allow reselection
			if territory["owner"] == current_player:
				selected_attacker = ""
				selected_defender = ""
				return handle_territory_click_for_attack(territory_id)
			
			return {"success": false, "message": validation["reason"]}
		
		# Valid attack target
		selected_defender = territory_id
		
		# Initiate combat
		return initiate_combat(selected_attacker, selected_defender)

## Validate if attack is legal
func validate_attack(attacker_id: String, defender_id: String) -> Dictionary:
	var attacker = game_state.get_territory(attacker_id)
	var defender = game_state.get_territory(defender_id)
	
	# Rule 1: Both territories must exist
	if attacker.is_empty() or defender.is_empty():
		return {"valid": false, "reason": "Territory does not exist"}
	
	# Rule 2: Attacker must belong to current player
	var current_player = game_state.get_current_player()
	if attacker["owner"] != current_player:
		return {"valid": false, "reason": "You can only attack from your own territories"}
	
	# Rule 3: Defender must belong to different player
	if attacker["owner"] == defender["owner"]:
		return {"valid": false, "reason": "Cannot attack your own territory"}
	
	# Rule 4: Attacker must have 2+ armies
	if attacker["armies"] < 2:
		return {"valid": false, "reason": "Need at least 2 armies to attack"}
	
	# Rule 5: Territories must be adjacent
	if not game_state.are_adjacent(attacker_id, defender_id):
		return {"valid": false, "reason": "Territories must be adjacent"}
	
	return {"valid": true}

## Initiate combat between two territories
func initiate_combat(attacker_id: String, defender_id: String) -> Dictionary:
	var validation = validate_attack(attacker_id, defender_id)
	if not validation["valid"]:
		return {"success": false, "message": validation["reason"]}
	
	var attacker = game_state.get_territory(attacker_id)
	var defender = game_state.get_territory(defender_id)
	
	# Create combat instance
	current_combat = {
		"attacker_id": attacker_id,
		"defender_id": defender_id,
		"attacker_initial_armies": attacker["armies"],
		"defender_initial_armies": defender["armies"],
		"attacker_owner": attacker["owner"],
		"defender_owner": defender["owner"]
	}
	
	combat_in_progress = true
	combat_initiated.emit(attacker_id, defender_id)
	battle_dialog_requested.emit(attacker_id, defender_id)
	
	print("Combat initiated: %s (%d) vs %s (%d)" % 
		[attacker_id, attacker["armies"], defender_id, defender["armies"]])
	
	return {
		"success": true,
		"type": "combat_initiated",
		"attacker_id": attacker_id,
		"defender_id": defender_id,
		"message": "Battle started - Enter remaining armies"
	}

## Resolve combat with direct army input
func resolve_combat(attacker_remaining: int, defender_remaining: int) -> Dictionary:
	if not combat_in_progress or current_combat.is_empty():
		return {"success": false, "message": "No combat in progress"}
	
	var attacker_id = current_combat["attacker_id"]
	var defender_id = current_combat["defender_id"]
	var attacker_initial = current_combat["attacker_initial_armies"]
	var defender_initial = current_combat["defender_initial_armies"]
	
	# Validate input
	if attacker_remaining >= attacker_initial:
		return {"success": false, "message": "Attacker must lose at least 1 army"}
	
	if defender_remaining >= defender_initial:
		return {"success": false, "message": "Defender must lose at least 1 army"}
	
	if attacker_remaining < 1:
		return {"success": false, "message": "Attacker must have at least 1 army remaining"}
	
	if defender_remaining < 0:
		return {"success": false, "message": "Invalid defender army count"}
	
	# Calculate losses
	var attacker_losses = attacker_initial - attacker_remaining
	var defender_losses = defender_initial - defender_remaining
	
	# Apply results
	game_state.set_territory_armies(attacker_id, attacker_remaining)
	game_state.set_territory_armies(defender_id, defender_remaining)
	
	var result = {
		"success": true,
		"type": "combat_resolved",
		"attacker_id": attacker_id,
		"defender_id": defender_id,
		"attacker_losses": attacker_losses,
		"defender_losses": defender_losses,
		"attacker_remaining": attacker_remaining,
		"defender_remaining": defender_remaining,
		"conquest": defender_remaining == 0
	}
	
	# Check for conquest
	if defender_remaining == 0:
		result["conquest_data"] = {
			"territory_id": defender_id,
			"new_owner": current_combat["attacker_owner"],
			"available_armies": attacker_remaining - 1  # Must leave 1 in attacker
		}
	
	combat_resolved.emit(result)
	reset_combat()
	
	print("Combat resolved: Attacker lost %d, Defender lost %d%s" % 
		[attacker_losses, defender_losses, " - CONQUEST!" if result["conquest"] else ""])
	
	return result

## Complete conquest by transferring armies
func complete_conquest(territory_id: String, new_owner: String, armies_to_transfer: int) -> Dictionary:
	var territory = game_state.get_territory(territory_id)
	if territory.is_empty():
		return {"success": false, "message": "Territory not found"}
	
	# Validate transfer
	if armies_to_transfer < 1:
		return {"success": false, "message": "Must transfer at least 1 army"}
	
	# Update ownership
	game_state.set_territory_owner(territory_id, new_owner)
	game_state.set_territory_armies(territory_id, armies_to_transfer)
	
	territory_conquered.emit(territory_id, new_owner)
	
	print("Conquest complete: %s now owned by %s (%d armies)" % 
		[territory_id, new_owner, armies_to_transfer])
	
	# Check victory
	var winner = game_state.check_victory()
	if winner != "":
		print("=== VICTORY: %s has conquered all territories! ===" % winner)
	
	return {
		"success": true,
		"type": "conquest",
		"territory_id": territory_id,
		"new_owner": new_owner,
		"armies": armies_to_transfer
	}

## Reset combat state
func reset_combat():
	selected_attacker = ""
	selected_defender = ""
	combat_in_progress = false
	current_combat = {}

## Get valid attack targets from selected attacker
func get_valid_targets(attacker_id: String) -> Array:
	var targets = []
	var attacker = game_state.get_territory(attacker_id)
	
	if attacker.is_empty():
		return targets
	
	var current_player = game_state.get_current_player()
	
	for neighbor_id in attacker["neighbors"]:
		var neighbor = game_state.get_territory(neighbor_id)
		if not neighbor.is_empty() and neighbor["owner"] != current_player:
			targets.append(neighbor_id)
	
	return targets
