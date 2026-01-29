extends Node
class_name TurnManager

## Manages turn progression and routes territory clicks to appropriate phase handlers

# Signals
signal turn_started(player_name: String)
signal action_performed(result: Dictionary)

# References
var game_state: GameState
var phase_manager: PhaseManager
var reinforcement_manager: Node
var combat_system: Node
var fortification_manager: Node

func _ready():
	name = "TurnManager"

## Initialize with manager references
func initialize(state: GameState, phase_mgr: PhaseManager, reinforce_mgr: Node, combat_mgr: Node, fortify_mgr: Node):
	game_state = state
	phase_manager = phase_mgr
	reinforcement_manager = reinforce_mgr
	combat_system = combat_mgr
	fortification_manager = fortify_mgr
	print("TurnManager initialized")

## Handle territory click based on current phase
func handle_territory_click(territory_id: String) -> Dictionary:
	if not game_state or not phase_manager:
		return {"success": false, "message": "Game not initialized"}
	
	var current_phase = phase_manager.current_phase
	var result: Dictionary
	
	match current_phase:
		PhaseManager.Phase.STARTUP:
			result = handle_startup_click(territory_id)
		
		PhaseManager.Phase.REINFORCEMENT:
			result = handle_reinforcement_click(territory_id)
		
		PhaseManager.Phase.ATTACK:
			result = handle_attack_click(territory_id)
		
		PhaseManager.Phase.FORTIFICATION:
			result = handle_fortification_click(territory_id)
		
		_:
			result = {"success": false, "message": "Unknown phase"}
	
	if result.get("success", false):
		action_performed.emit(result)
		game_state.save_game()
	
	return result

## Handle startup phase territory clicks
func handle_startup_click(territory_id: String) -> Dictionary:
	var territory = game_state.get_territory(territory_id)
	if territory.is_empty():
		return {"success": false, "message": "Territory not found"}
	
	var current_player = game_state.get_current_player()
	var remaining = game_state.remaining_armies.get(current_player, 0)
	
	# Player can only place on their own territories
	if territory["owner"] != current_player:
		return {"success": false, "message": "You can only place armies on your own territories"}
	
	# Check if player has armies left
	if remaining <= 0:
		return {"success": false, "message": "No armies remaining"}
	
	# Place 1 army
	game_state.add_armies_to_territory(territory_id, 1)
	game_state.remaining_armies[current_player] -= 1
	
	print("%s placed army on %s (%d remaining)" % [current_player, territory_id, remaining - 1])
	
	# Auto-advance if player depleted their armies
	if game_state.remaining_armies[current_player] == 0:
		# Check if startup is complete for all players
		var all_depleted = true
		for player in game_state.players:
			if game_state.remaining_armies.get(player, 0) > 0:
				all_depleted = false
				break
		
		if all_depleted and game_state.current_player_index == game_state.players.size() - 1:
			# Startup complete, transition to turn 1
			game_state.advance_player()  # Back to player 0
			phase_manager.advance_phase()
		else:
			# Next player continues startup
			game_state.advance_player()
			turn_started.emit(game_state.get_current_player())
	
	return {
		"success": true,
		"type": "deployment",
		"territory_id": territory_id,
		"armies_placed": 1,
		"remaining_armies": game_state.remaining_armies[current_player]
	}

## Handle reinforcement phase territory clicks
func handle_reinforcement_click(territory_id: String) -> Dictionary:
	if not reinforcement_manager:
		return {"success": false, "message": "ReinforcementManager not initialized"}
	
	return reinforcement_manager.deploy_reinforcement(territory_id)

## Handle attack phase territory clicks
func handle_attack_click(territory_id: String) -> Dictionary:
	if not combat_system:
		return {"success": false, "message": "CombatSystem not initialized"}
	
	return combat_system.handle_territory_click_for_attack(territory_id)

## Handle fortification phase territory clicks
func handle_fortification_click(territory_id: String) -> Dictionary:
	if not fortification_manager:
		return {"success": false, "message": "FortificationManager not initialized"}
	
	return fortification_manager.handle_territory_click(territory_id)

## Advance to next phase
func end_phase() -> bool:
	if not phase_manager:
		return false
	
	return phase_manager.advance_phase()

## Start new player's turn
func start_turn():
	var current_player = game_state.get_current_player()
	turn_started.emit(current_player)
	print("=== %s's Turn (Turn %d) ===" % [current_player, game_state.turn_number])
