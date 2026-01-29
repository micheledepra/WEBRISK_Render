extends Window

## Unit transfer dialog for moving armies after conquest

# Signals
signal transfer_confirmed(army_count: int)
signal transfer_cancelled()

# UI references
@onready var territory_label = $Panel/VBox/TerritoryLabel
@onready var transfer_spinbox = $Panel/VBox/TransferControl/SpinBox
@onready var confirm_button = $Panel/VBox/Buttons/ConfirmButton
@onready var cancel_button = $Panel/VBox/Buttons/CancelButton

# Transfer data
var source_id: String = ""
var destination_id: String = ""
var available_armies: int = 0

func _ready():
	# Connect buttons
	confirm_button.pressed.connect(_on_confirm_pressed)
	cancel_button.pressed.connect(_on_cancel_pressed)
	
	# Connect close request
	close_requested.connect(_on_cancel_pressed)

## Setup transfer dialog
func setup_transfer(source: String, destination: String, max_armies: int):
	source_id = source
	destination_id = destination
	available_armies = max_armies
	
	# Update label
	territory_label.text = "From: %s → To: %s" % [format_name(source), format_name(destination)]
	
	# Set spinbox range
	transfer_spinbox.min_value = 1
	transfer_spinbox.max_value = max_armies
	transfer_spinbox.value = max(1, max_armies)
	
	show()

## Format territory name
func format_name(id: String) -> String:
	return id.replace("_", " ").capitalize()

## Handle confirm button
func _on_confirm_pressed():
	var army_count = int(transfer_spinbox.value)
	transfer_confirmed.emit(army_count)
	hide()

## Handle cancel button
func _on_cancel_pressed():
	# Default to minimum transfer
	transfer_confirmed.emit(1)
	hide()
