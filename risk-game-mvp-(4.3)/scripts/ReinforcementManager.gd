extends Node
class_name ReinforcementManager

## Manages reinforcement deployment during reinforcement phase

# Signals
signal reinforcement_deployed(territory_id: String, armies: int)
signal reinforcements_complete()

# References
var game_state: GameState

func _ready():
	name = "ReinforcementManager"

## Initialize with GameState reference
func initialize(state: GameState):
	game_state = state
	print("ReinforcementManager initialized")

## Deploy reinforcement armies to owned territory
func deploy_reinforcement(territory_id: String) -> Dictionary:
	if not game_state:
		return {"success": false, "message": "Game state not initialized"}
	
	var territory = game_state.get_territory(territory_id)
	if territory.is_empty():
		return {"success": false, "message": "Territory not found"}
	
	var current_player = game_state.get_current_player()
	
	# Validate ownership
	if territory["owner"] != current_player:
		return {"success": false, "message": "You can only reinforce your own territories"}
	
	# Check remaining armies
	var remaining = game_state.remaining_armies.get(current_player, 0)
	if remaining <= 0:
		return {"success": false, "message": "No reinforcements remaining"}
	
	# Deploy 1 army
	game_state.add_armies_to_territory(territory_id, 1)
	game_state.remaining_armies[current_player] -= 1
	
	reinforcement_deployed.emit(territory_id, 1)
	
	# Check if all reinforcements deployed
	if game_state.remaining_armies[current_player] == 0:
		reinforcements_complete.emit()
	
	print("%s deployed reinforcement to %s (%d remaining)" % 
		[current_player, territory_id, game_state.remaining_armies[current_player]])
	
	return {
		"success": true,
		"type": "reinforcement",
		"territory_id": territory_id,
		"armies_placed": 1,
		"remaining_armies": game_state.remaining_armies[current_player]
	}

## Calculate continent bonuses for a player
func calculate_continent_bonuses(player: String) -> int:
	return game_state.calculate_continent_bonuses(player)
