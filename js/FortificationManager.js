/**
 * FortificationManager - Handles army movement during fortify phase
 * Manages territory selection, pathfinding, and army movement with visual feedback
 */
class FortificationManager {
  constructor() {
    this.gameState = null;
    this.territoryVisualManager = null;
    this.selectedSourceTerritory = null;
    this.selectedDestinationTerritory = null;
    this.validDestinations = [];
    this.hasUsedFortification = false;
    this.fortificationModal = null;

    this.createFortificationModal();
  }

  /**
   * Initialize the FortificationManager with game dependencies
   */
  initializeGame(gameState, territoryVisualManager) {
    this.gameState = gameState;
    this.territoryVisualManager = territoryVisualManager;
  }

  /**
   * Start fortification phase for current player
   */
  startFortificationPhase() {
    this.hasUsedFortification = false;
    this.clearSelection();
    this.highlightValidSources();
    this.showFortificationInstructions();
  }

  /**
   * Reset fortification state for new player turn
   * Should be called when a new player starts their turn
   */
  resetForNewTurn() {
    this.hasUsedFortification = false;
    this.selectedSourceTerritory = null;
    this.selectedDestinationTerritory = null;
    this.validDestinations = [];
    
    console.log('[FortificationManager] Reset for new player turn');
    
    // Clear UI highlights
    if (this.territoryVisualManager && typeof this.territoryVisualManager.clearAllHighlights === 'function') {
      this.territoryVisualManager.clearAllHighlights();
    }
    
    // Hide fortification modal
    if (this.fortificationModal) {
      this.fortificationModal.style.display = 'none';
    }
  }

  /**
   * Initialize fortification phase
   * Should be called when entering fortification phase
   */
  initializeFortificationPhase() {
    this.selectedSourceTerritory = null;
    this.selectedDestinationTerritory = null;
    this.validDestinations = [];
    
    console.log('[FortificationManager] Initializing fortification phase');
    console.log(`Fortification used: ${this.hasUsedFortification}`);
    
    // Show fortification instructions
    this.showFortificationInstructions();
    
    // Highlight valid source territories
    this.highlightValidSources();
  }

  /**
   * Handle territory click during fortify phase
   */
  handleTerritoryClick(territoryId) {
    const currentPlayer = this.gameState.getCurrentPlayer();
    const territory = this.gameState.territories[territoryId];

    if (!territory || territory.owner !== currentPlayer) {
      return null;
    }

    // If no source selected yet, try to select as source
    if (!this.selectedSourceTerritory) {
      return this.selectSourceTerritory(territoryId);
    }

    // If source is selected, try to select as destination
    if (this.selectedSourceTerritory && !this.selectedDestinationTerritory) {
      return this.selectDestinationTerritory(territoryId);
    }

    // If both selected, deselect and start over
    this.clearSelection();
    return this.selectSourceTerritory(territoryId);
  }

  /**
   * Select source territory for fortification
   */
  selectSourceTerritory(territoryId) {
    const territory = this.gameState.territories[territoryId];
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Validate source territory
    if (territory.owner !== currentPlayer || territory.armies <= 1) {
      return {
        type: "fortify-invalid-source",
        message:
          territory.armies <= 1
            ? "Cannot move from territory with only 1 army"
            : "Territory not owned by current player",
      };
    }

    this.selectedSourceTerritory = territoryId;
    this.validDestinations = this.findValidDestinations(territoryId);

    // Update visual feedback
    this.territoryVisualManager.highlightTerritory(
      territoryId,
      "selected-source"
    );
    this.highlightValidDestinations();

    return {
      type: "fortify-source-selected",
      territory: territoryId,
      validDestinations: this.validDestinations,
    };
  }

  /**
   * Select destination territory for fortification
   */
  selectDestinationTerritory(territoryId) {
    if (!this.validDestinations.includes(territoryId)) {
      return {
        type: "fortify-invalid-destination",
        message: "Can only fortify to directly adjacent territories you own",
      };
    }

    this.selectedDestinationTerritory = territoryId;
    this.territoryVisualManager.highlightTerritory(
      territoryId,
      "selected-destination"
    );

    // Show movement interface
    this.showMovementInterface();

    return {
      type: "fortify-destination-selected",
      source: this.selectedSourceTerritory,
      destination: territoryId,
    };
  }

  /**
   * Find valid destination territories - only directly adjacent territories
   */
  findValidDestinations(sourceId) {
    const currentPlayer = this.gameState.getCurrentPlayer();
    const sourceTerritory = this.gameState.territories[sourceId];
    const validDestinations = [];

    // Only check direct neighbors (no pathfinding through chains)
    for (const neighborId of sourceTerritory.neighbors) {
      const neighbor = this.gameState.territories[neighborId];

      // Neighbor must be owned by current player
      if (neighbor.owner === currentPlayer) {
        validDestinations.push(neighborId);
      }
    }

    return validDestinations;
  }

  /**
   * Show movement interface modal
   */
  showMovementInterface() {
    try {
      if (!this.fortificationModal) {
        console.error("Fortification modal not initialized");
        return;
      }

      const sourceTerritory =
        this.gameState.territories[this.selectedSourceTerritory];
      const destinationTerritory =
        this.gameState.territories[this.selectedDestinationTerritory];

      if (!sourceTerritory || !destinationTerritory) {
        console.error("Invalid territories selected");
        return;
      }

      const maxMovableArmies = sourceTerritory.armies - 1;

      // Update modal content - find elements within the modal
      const sourceName = this.fortificationModal.querySelector(
        "#fortify-source-name"
      );
      if (sourceName)
        sourceName.textContent = this.formatTerritoryName(
          this.selectedSourceTerritory
        );

      const destName = this.fortificationModal.querySelector(
        "#fortify-destination-name"
      );
      if (destName)
        destName.textContent = this.formatTerritoryName(
          this.selectedDestinationTerritory
        );

      const sourceArmies = this.fortificationModal.querySelector(
        "#fortify-source-armies"
      );
      if (sourceArmies) sourceArmies.textContent = sourceTerritory.armies;

      const destArmies = this.fortificationModal.querySelector(
        "#fortify-destination-armies"
      );
      if (destArmies) destArmies.textContent = destinationTerritory.armies;

      const maxMovable = this.fortificationModal.querySelector(
        "#fortify-max-movable"
      );
      if (maxMovable) maxMovable.textContent = maxMovableArmies;

      // Set up army count controls - find within modal
      const armyInput = this.fortificationModal.querySelector(
        "#fortify-army-count"
      );
      const armySlider = this.fortificationModal.querySelector(
        "#fortify-army-slider"
      );

      if (armyInput) {
        armyInput.max = maxMovableArmies;
        armyInput.value = 1;
      }

      if (armySlider) {
        armySlider.max = maxMovableArmies;
        armySlider.value = 1;
      }

      // Update preview
      this.updatePreview();

      // Show modal
      this.fortificationModal.style.display = "block";
      console.log("Fortification modal shown");
    } catch (error) {
      console.error("Error showing movement interface:", error);
    }
  }

  /**
   * Execute army movement
   */
  executeFortification(armyCount) {
    if (this.hasUsedFortification) {
      return {
        type: "fortify-already-used",
        message: "You can only fortify once per turn",
      };
    }

    const sourceTerritory =
      this.gameState.territories[this.selectedSourceTerritory];
    const destinationTerritory =
      this.gameState.territories[this.selectedDestinationTerritory];

    // Validate army count
    if (armyCount < 1 || armyCount >= sourceTerritory.armies) {
      return {
        type: "fortify-invalid-count",
        message: "Invalid army count",
      };
    }

    // Execute movement
    sourceTerritory.armies -= armyCount;
    destinationTerritory.armies += armyCount;
    
    // Dispatch events for dashboard system
    document.dispatchEvent(new CustomEvent('armyCountChanged', {
      detail: { territoryId: sourceId, armyCount: sourceTerritory.armies, source: 'FortificationManager' }
    }));
    document.dispatchEvent(new CustomEvent('armyCountChanged', {
      detail: { territoryId: destinationId, armyCount: destinationTerritory.armies, source: 'FortificationManager' }
    }));

    // Mark fortification as used
    this.hasUsedFortification = true;

    console.log(`✅ Fortification complete: ${this.selectedSourceTerritory} → ${this.selectedDestinationTerritory} (${armyCount} armies)`);
    console.log(`${this.selectedSourceTerritory}: ${sourceTerritory.armies + armyCount} → ${sourceTerritory.armies}`);
    console.log(`${this.selectedDestinationTerritory}: ${destinationTerritory.armies - armyCount} → ${destinationTerritory.armies}`);

    // Update visuals with dynamic opacity
    if (this.territoryVisualManager) {
      this.territoryVisualManager.updateTerritoryVisual(
        this.selectedSourceTerritory,
        sourceTerritory,
        null,
        this.gameState
      );
      this.territoryVisualManager.updateTerritoryVisual(
        this.selectedDestinationTerritory,
        destinationTerritory,
        null,
        this.gameState
      );
    }
    
    // Refresh all territory opacities since max armies may have changed
    if (window.riskUI && window.riskUI.colorManager) {
      window.riskUI.colorManager.refreshAllTerritories(this.gameState);
    }

    // Clear selection and close modal
    this.clearSelection();
    this.fortificationModal.style.display = "none";

    return {
      type: "fortify-complete",
      source: this.selectedSourceTerritory,
      destination: this.selectedDestinationTerritory,
      armiesMoved: armyCount,
      sourceArmiesLeft: sourceTerritory.armies,
      destinationArmiesNew: destinationTerritory.armies,
    };
  }

  /**
   * Skip fortification phase
   */
  skipFortification() {
    this.hasUsedFortification = true;
    this.clearSelection();

    return {
      type: "fortify-skipped",
    };
  }

  /**
   * Check if fortification phase can be completed
   */
  canCompleteFortification() {
    return this.hasUsedFortification;
  }

  /**
   * Check if player has any valid fortification moves
   * @returns {boolean} True if valid moves exist
   */
  hasValidFortificationMoves() {
    if (!this.gameState) {
      return false;
    }

    const currentPlayer = this.gameState.getCurrentPlayer();
    const playerTerritories = Object.keys(this.gameState.territories).filter(
      id => this.gameState.territories[id].owner === currentPlayer
    );
    
    // Check if any territory with >1 army can reach another owned territory
    for (const sourceId of playerTerritories) {
      const source = this.gameState.territories[sourceId];
      if (source.armies <= 1) continue; // Need armies to move
      
      // Check if connected to any other owned territory
      for (const targetId of playerTerritories) {
        if (sourceId === targetId) continue;
        
        if (this.areConnectedTerritories(sourceId, targetId)) {
          return true; // Found valid move
        }
      }
    }
    
    return false; // No valid moves
  }

  /**
   * Check if two territories are connected through owned territories
   * @param {string} startId - Starting territory
   * @param {string} targetId - Target territory
   * @returns {boolean} True if connected
   */
  areConnectedTerritories(startId, targetId) {
    if (!this.gameState) return false;

    const currentPlayer = this.gameState.getCurrentPlayer();
    const visited = new Set();
    const queue = [startId];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      
      if (currentId === targetId) {
        return true;
      }
      
      if (visited.has(currentId)) {
        continue;
      }
      
      visited.add(currentId);
      
      const territory = this.gameState.territories[currentId];
      if (!territory || territory.owner !== currentPlayer) {
        continue;
      }
      
      // Add neighbors to queue
      const neighbors = territory.neighbors || [];
      for (const neighborId of neighbors) {
        const neighbor = this.gameState.territories[neighborId];
        if (neighbor && neighbor.owner === currentPlayer && !visited.has(neighborId)) {
          queue.push(neighborId);
        }
      }
    }
    
    return false;
  }

  /**
   * Clear all selections and highlights
   */
  clearSelection() {
    this.selectedSourceTerritory = null;
    this.selectedDestinationTerritory = null;
    this.validDestinations = [];
    this.territoryVisualManager.clearAllHighlights();

    if (this.fortificationModal) {
      this.fortificationModal.style.display = "none";
    }
  }

  /**
   * Highlight valid source territories
   */
  highlightValidSources() {
    const currentPlayer = this.gameState.getCurrentPlayer();

    Object.entries(this.gameState.territories).forEach(
      ([territoryId, territory]) => {
        if (territory.owner === currentPlayer && territory.armies > 1) {
          this.territoryVisualManager.highlightTerritory(
            territoryId,
            "valid-source"
          );
        }
      }
    );
  }

  /**
   * Highlight valid destination territories
   */
  highlightValidDestinations() {
    this.validDestinations.forEach((territoryId) => {
      this.territoryVisualManager.highlightTerritory(
        territoryId,
        "valid-destination"
      );
    });
  }

  /**
   * Show fortification instructions
   */
  showFortificationInstructions() {
    // This could be integrated with the game UI to show instructions
    console.log(
      "Fortification Phase: Select a territory to move armies from (must have >1 army)"
    );
  }

  /**
   * Format territory name for display
   */
  formatTerritoryName(territoryId) {
    return territoryId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Create fortification modal
   */
  createFortificationModal() {
    this.fortificationModal = document.createElement("div");
    this.fortificationModal.className = "fortification-modal";
    this.fortificationModal.innerHTML = `
            <div class="fortification-modal-content">
                <div class="fortification-header">
                    <h3>Move Armies</h3>
                    <button class="close-btn" id="close-fortification-modal">&times;</button>
                </div>
                
                <div class="fortification-info">
                    <div class="movement-path">
                        <div class="territory-info source">
                            <h4>From: <span id="fortify-source-name">Territory</span></h4>
                            <p>Current armies: <span id="fortify-source-armies">0</span></p>
                        </div>
                        
                        <div class="movement-arrow">→</div>
                        
                        <div class="territory-info destination">
                            <h4>To: <span id="fortify-destination-name">Territory</span></h4>
                            <p>Current armies: <span id="fortify-destination-armies">0</span></p>
                        </div>
                    </div>
                    
                    <div class="movement-constraints">
                        <p>Maximum armies you can move: <span id="fortify-max-movable">0</span></p>
                        <p class="constraint-note">Must leave at least 1 army in source territory</p>
                    </div>
                </div>
                
                <div class="fortification-controls">
                    <label for="fortify-army-count">Armies to move:</label>
                    <div class="army-input-group">
                        <button type="button" id="decrease-fortify-armies">-</button>
                        <input type="number" id="fortify-army-count" min="1" value="1">
                        <button type="button" id="increase-fortify-armies">+</button>
                    </div>
                    <input type="range" id="fortify-army-slider" min="1" value="1" class="army-slider" aria-label="Number of armies to move - drag to adjust" title="Drag slider to select number of armies to fortify">
                </div>
                
                <div class="fortification-preview">
                    <h4>After Movement:</h4>
                    <p><span id="preview-source-name">Source</span>: <span id="preview-source-armies">0</span> armies</p>
                    <p><span id="preview-destination-name">Destination</span>: <span id="preview-destination-armies">0</span> armies</p>
                </div>
                
                <div class="fortification-actions">
                    <button type="button" id="cancel-fortification" class="secondary-btn">Cancel</button>
                    <button type="button" id="confirm-fortification" class="primary-btn">Move Armies</button>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.appendChild(this.fortificationModal);

    // Set up event listeners
    this.setupModalEventListeners();
  }

  /**
   * Set up event listeners for the fortification modal
   */
  setupModalEventListeners() {
    try {
      // Close modal
      const closeBtn = this.fortificationModal.querySelector(
        "#close-fortification-modal"
      );
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.fortificationModal.style.display = "none";
        });
      }

      const cancelBtn = this.fortificationModal.querySelector(
        "#cancel-fortification"
      );
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          this.fortificationModal.style.display = "none";
        });
      }

      // Army count controls
      const armyInput = this.fortificationModal.querySelector(
        "#fortify-army-count"
      );
      const armySlider = this.fortificationModal.querySelector(
        "#fortify-army-slider"
      );
      const decreaseBtn = this.fortificationModal.querySelector(
        "#decrease-fortify-armies"
      );
      const increaseBtn = this.fortificationModal.querySelector(
        "#increase-fortify-armies"
      );

      // Only set up listeners if elements exist
      if (armyInput && armySlider) {
        // Sync input and slider
        armyInput.addEventListener("input", () => {
          armySlider.value = armyInput.value;
          this.updatePreview();
        });

        armySlider.addEventListener("input", () => {
          armyInput.value = armySlider.value;
          this.updatePreview();
        });

        // +/- buttons
        if (decreaseBtn) {
          decreaseBtn.addEventListener("click", () => {
            const currentValue = parseInt(armyInput.value);
            if (currentValue > 1) {
              armyInput.value = currentValue - 1;
              armySlider.value = armyInput.value;
              this.updatePreview();
            }
          });
        }

        if (increaseBtn) {
          increaseBtn.addEventListener("click", () => {
            const currentValue = parseInt(armyInput.value);
            const maxValue = parseInt(armyInput.max);
            if (currentValue < maxValue) {
              armyInput.value = currentValue + 1;
              armySlider.value = armyInput.value;
              this.updatePreview();
            }
          });
        }
      }

      // Confirm fortification
      const confirmBtn = this.fortificationModal.querySelector(
        "#confirm-fortification"
      );
      if (confirmBtn && armyInput) {
        confirmBtn.addEventListener("click", () => {
          const armyCount = parseInt(armyInput.value);
          const result = this.executeFortification(armyCount);

          // Dispatch result to game system
          if (window.riskUI) {
            window.riskUI.updateUI(result);
          }
        });
      }

      // Update preview on initial load
      setTimeout(() => this.updatePreview(), 100);
    } catch (error) {
      console.error("Error setting up modal event listeners:", error);
    }
  }

  /**
   * Update movement preview
   */
  updatePreview() {
    try {
      if (!this.selectedSourceTerritory || !this.selectedDestinationTerritory)
        return;
      if (!this.fortificationModal) return;

      const armyInput = this.fortificationModal.querySelector(
        "#fortify-army-count"
      );
      if (!armyInput) return;

      const armyCount = parseInt(armyInput.value) || 1;
      const sourceTerritory =
        this.gameState.territories[this.selectedSourceTerritory];
      const destinationTerritory =
        this.gameState.territories[this.selectedDestinationTerritory];

      if (!sourceTerritory || !destinationTerritory) return;

      const sourceName = this.fortificationModal.querySelector(
        "#preview-source-name"
      );
      if (sourceName)
        sourceName.textContent = this.formatTerritoryName(
          this.selectedSourceTerritory
        );

      const destName = this.fortificationModal.querySelector(
        "#preview-destination-name"
      );
      if (destName)
        destName.textContent = this.formatTerritoryName(
          this.selectedDestinationTerritory
        );

      const sourceArmies = this.fortificationModal.querySelector(
        "#preview-source-armies"
      );
      if (sourceArmies)
        sourceArmies.textContent = sourceTerritory.armies - armyCount;

      const destArmies = this.fortificationModal.querySelector(
        "#preview-destination-armies"
      );
      if (destArmies)
        destArmies.textContent = destinationTerritory.armies + armyCount;
    } catch (error) {
      console.error("Error updating preview:", error);
    }
  }

  /**
   * Reset fortification state for new turn
   */
  resetForNewTurn() {
    this.hasUsedFortification = false;
    this.clearSelection();
  }

  /**
   * Check if the current player has valid fortification moves available
   * A valid fortification move requires:
   * - At least 2 territories owned by the player
   * - Connection between at least 2 territories (can transfer armies)
   * @returns {boolean} - True if valid moves exist, false otherwise
   */
  hasValidFortificationMoves() {
    try {
      if (!this.gameState) {
        return false;
      }

      const currentPlayer = this.gameState.getCurrentPlayer();
      const playerTerritories =
        this.gameState.getTerritoriesOwnedByPlayer(currentPlayer);

      // Need at least 2 territories to fortify
      if (!playerTerritories || playerTerritories.length < 2) {
        return false;
      }

      // Check if there's at least one valid fortification path
      for (let i = 0; i < playerTerritories.length; i++) {
        const territory = playerTerritories[i];

        // Territory must have more than 1 army to be a source
        if (territory.armies <= 1) {
          continue;
        }

        // Check if this territory can fortify to any neighbor
        for (let neighbor of territory.neighbors || []) {
          const neighborTerritory = this.gameState.territories[neighbor];

          if (neighborTerritory && neighborTerritory.owner === currentPlayer) {
            // Found a valid fortification path
            console.log(
              `✅ Valid fortification move found: ${territory.id} → ${neighbor}`
            );
            return true;
          }
        }
      }

      console.log("❌ No valid fortification moves available");
      return false;
    } catch (error) {
      console.error("Error checking fortification moves:", error);
      return false;
    }
  }

  /**
   * Get all valid fortification moves for current player
   * @returns {Array} - Array of valid fortification move objects
   */
  getValidFortificationMoves() {
    try {
      if (!this.gameState) {
        return [];
      }

      const currentPlayer = this.gameState.getCurrentPlayer();
      const playerTerritories =
        this.gameState.getTerritoriesOwnedByPlayer(currentPlayer);
      const validMoves = [];

      if (!playerTerritories || playerTerritories.length < 2) {
        return [];
      }

      // Find all valid fortification paths
      for (let territory of playerTerritories) {
        // Territory must have more than 1 army to be a source
        if (territory.armies <= 1) {
          continue;
        }

        // Check all neighbors
        for (let neighbor of territory.neighbors || []) {
          const neighborTerritory = this.gameState.territories[neighbor];

          if (neighborTerritory && neighborTerritory.owner === currentPlayer) {
            validMoves.push({
              source: territory.id,
              destination: neighbor,
              maxArmies: territory.armies - 1,
              sourceArmies: territory.armies,
              destinationArmies: neighborTerritory.armies,
            });
          }
        }
      }

      console.log(`Found ${validMoves.length} valid fortification moves`);
      return validMoves;
    } catch (error) {
      console.error("Error getting fortification moves:", error);
      return [];
    }
  }
}
