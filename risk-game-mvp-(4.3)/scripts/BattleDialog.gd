extends Window

## Battle dialog for direct army input combat system

# Signals
signal battle_resolved(attacker_remaining: int, defender_remaining: int)
signal battle_cancelled()

# UI references
@onready var attacker_label = $Panel/VBox/AttackerLabel
@onready var defender_label = $Panel/VBox/DefenderLabel
@onready var attacker_spinbox = $Panel/VBox/AttackerInput/SpinBox
@onready var defender_spinbox = $Panel/VBox/DefenderInput/SpinBox
@onready var resolve_button = $Panel/VBox/Buttons/ResolveButton
@onready var cancel_button = $Panel/VBox/Buttons/CancelButton

# Battle data
var attacker_id: String = ""
var defender_id: String = ""
var attacker_initial: int = 0
var defender_initial: int = 0

func _ready():
	# Connect buttons
	resolve_button.pressed.connect(_on_resolve_pressed)
	cancel_button.pressed.connect(_on_cancel_pressed)
	
	# Connect close request
	close_requested.connect(_on_cancel_pressed)

## Setup battle dialog with territory data
func setup_battle(attacker: String, defender: String, attacker_armies: int, defender_armies: int):
	attacker_id = attacker
	defender_id = defender
	attacker_initial = attacker_armies
	defender_initial = defender_armies
	
	# Update labels
	attacker_label.text = "Attacker: %s (%d armies)" % [format_name(attacker), attacker_armies]
	defender_label.text = "Defender: %s (%s armies)" % [format_name(defender), defender_armies]
	
	# Set spinbox ranges
	attacker_spinbox.min_value = 1
	attacker_spinbox.max_value = attacker_armies - 1
	attacker_spinbox.value = max(1, attacker_armies - 1)
	
	defender_spinbox.min_value = 0
	defender_spinbox.max_value = defender_armies
	defender_spinbox.value = max(0, defender_armies - 1)
	
	show()

## Format territory name
func format_name(id: String) -> String:
	return id.replace("_", " ").capitalize()

## Handle resolve button
func _on_resolve_pressed():
	var attacker_remaining = int(attacker_spinbox.value)
	var defender_remaining = int(defender_spinbox.value)
	
	battle_resolved.emit(attacker_remaining, defender_remaining)
	hide()

## Handle cancel button
func _on_cancel_pressed():
	battle_cancelled.emit()
	hide()
