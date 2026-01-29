extends Node
class_name PhaseManager

## Manages the 4-phase turn cycle
## Phases: startup → reinforcement → attack → fortification → (next player)

# Signals
signal phase_changed(new_phase: Phase)
signal phase_validation_failed(reason: String)

# Phase enum
enum Phase {
	STARTUP,
	REINFORCEMENT,
	ATTACK,
	FORTIFICATION
}

# Current phase
var current_phase: Phase = Phase.STARTUP

# Reference to GameState
var game_state: GameState

# Phase configuration
var phase_config = {
	Phase.STARTUP: {
		"name": "Startup",
		"description": "Place initial armies on your territories",
		"mandatory": true,
		"can_skip": false
	},
	Phase.REINFORCEMENT: {
		"name": "Reinforcement",
		"description": "Deploy reinforcement armies",
		"mandatory": true,
		"can_skip": false
	},
	Phase.ATTACK: {
		"name": "Attack",
		"description": "Attack adjacent enemy territories",
		"mandatory": false,
		"can_skip": true
	},
	Phase.FORTIFICATION: {
		"name": "Fortification",
		"description": "Move armies between adjacent owned territories",
		"mandatory": false,
		"can_skip": true
	}
}

func _ready():
	name = "PhaseManager"

## Initialize with GameState reference
func initialize(state: GameState):
	game_state = state
	print("PhaseManager initialized")

## Set current phase
func set_phase(phase: Phase):
	var old_phase = current_phase
	current_phase = phase
	
	# Update GameState
	if game_state:
		game_state.current_phase = get_phase_name(phase).to_lower()
		game_state.phase_changed.emit(game_state.current_phase)
	
	phase_changed.emit(phase)
	print("Phase changed: %s → %s" % [get_phase_name(old_phase), get_phase_name(phase)])

## Get phase name from enum
func get_phase_name(phase: Phase) -> String:
	match phase:
		Phase.STARTUP:
			return "Startup"
		Phase.REINFORCEMENT:
			return "Reinforcement"
		Phase.ATTACK:
			return "Attack"
		Phase.FORTIFICATION:
			return "Fortification"
	return "Unknown"

## Get current phase configuration
func get_current_phase_config() -> Dictionary:
	return phase_config[current_phase]

## Validate if current phase can be completed
func can_complete_phase() -> bool:
	match current_phase:
		Phase.STARTUP:
			return validate_startup_complete()
		Phase.REINFORCEMENT:
			return validate_reinforcement_complete()
		Phase.ATTACK:
			return true  # Always can skip attack
		Phase.FORTIFICATION:
			return true  # Always can skip fortification
	return false

## Validate startup phase completion
func validate_startup_complete() -> bool:
	if not game_state:
		return false
	
	# Check if all players have deployed all armies
	for player in game_state.players:
		if game_state.remaining_armies.get(player, 0) > 0:
			return false
	
	# Check if we're back to first player
	return game_state.current_player_index == 0

## Validate reinforcement phase completion
func validate_reinforcement_complete() -> bool:
	if not game_state:
		return false
	
	# All reinforcement armies must be deployed
	var current_player = game_state.get_current_player()
	return game_state.remaining_armies.get(current_player, 0) == 0

## Attempt to advance to next phase
func advance_phase() -> bool:
	if not can_complete_phase():
		var reason = "Phase requirements not met"
		match current_phase:
			Phase.STARTUP:
				var current_player = game_state.get_current_player()
				var remaining = game_state.remaining_armies.get(current_player, 0)
				reason = "Player must deploy all armies (-%d remaining)" % remaining
			Phase.REINFORCEMENT:
				var current_player = game_state.get_current_player()
				var remaining = game_state.remaining_armies.get(current_player, 0)
				reason = "Deploy all reinforcements (%d remaining)" % remaining
		
		phase_validation_failed.emit(reason)
		print("Cannot advance phase: %s" % reason)
		return false
	
	match current_phase:
		Phase.STARTUP:
			# Startup complete for all players, transition to turn 1
			if validate_startup_complete():
				game_state.turn_number = 1
				game_state.initial_deployment_complete = true
				set_phase(Phase.REINFORCEMENT)
				# Calculate reinforcements for first player
				var current_player = game_state.get_current_player()
				var reinforcements = game_state.calculate_reinforcements(current_player)
				game_state.remaining_armies[current_player] = reinforcements
			else:
				# Next player in startup
				game_state.advance_player()
		
		Phase.REINFORCEMENT:
			set_phase(Phase.ATTACK)
		
		Phase.ATTACK:
			set_phase(Phase.FORTIFICATION)
		
		Phase.FORTIFICATION:
			# End turn, advance to next player
			game_state.advance_player()
			set_phase(Phase.REINFORCEMENT)
			
			# Calculate reinforcements for new player
			var current_player = game_state.get_current_player()
			var reinforcements = game_state.calculate_reinforcements(current_player)
			game_state.remaining_armies[current_player] = reinforcements
	
	return true

## Get phase instruction text
func get_phase_instructions() -> String:
	var config = get_current_phase_config()
	var instructions = config["description"]
	
	match current_phase:
		Phase.STARTUP:
			var current_player = game_state.get_current_player()
			var remaining = game_state.remaining_armies.get(current_player, 0)
			instructions += "\nArmies remaining: %d" % remaining
		
		Phase.REINFORCEMENT:
			var current_player = game_state.get_current_player()
			var remaining = game_state.remaining_armies.get(current_player, 0)
			instructions += "\nReinforcements to deploy: %d" % remaining
		
		Phase.ATTACK:
			instructions += "\nSelect attacking territory (2+ armies), then target"
		
		Phase.FORTIFICATION:
			instructions += "\nSelect source territory, then destination (both owned, adjacent)"
	
	return instructions

## Check if phase can be skipped
func can_skip_phase() -> bool:
	var config = get_current_phase_config()
	return config.get("can_skip", false)
