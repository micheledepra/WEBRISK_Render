/**
 * PhaseManager - Official Risk Rules Phase Management
 * Manages phase display and validation following official Risk rules
 */
class PhaseManager {
  constructor(gameState, ui, combatSystem = null) {
    this.gameState = gameState;
    this.ui = ui;
    this.combatSystem = combatSystem;
    this.currentPhase = 'startup';
    this.phaseSynchronizer = null;

    // Official Risk phase configuration
    this.phaseConfig = {
      startup: {
        name: 'Startup Deployment',
        description: 'Place your initial armies on the map',
        mandatory: true,
        canSkip: false,
        emoji: '🎮'
      },
      reinforcement: {
        name: 'Reinforcement',
        description: 'Calculate and deploy reinforcement armies',
        mandatory: true,
        canSkip: false,
        emoji: '💰'
      },
      attack: {
        name: 'Attack',
        description: 'Attack adjacent enemy territories',
        mandatory: false,
        canSkip: true,
        emoji: '⚔️'
      },
      fortification: {
        name: 'Fortification',
        description: 'Move armies between your connected territories',
        mandatory: false,
        canSkip: true,
        emoji: '🛡️'
      }
    };

    this.phaseRequirements = {
      startup: () => this.isStartupComplete(),
      reinforcement: () => this.isReinforcementComplete(),
      attack: () => true, // Optional phase - always can advance
      fortification: () => {
        // ✅ Fortification is complete if:
        // 1. Player has used their fortification, OR
        // 2. Player has no valid fortification moves
        const fortificationManager = this.ui?.fortificationManager || window.riskUI?.fortificationManager;
        if (fortificationManager) {
          const hasUsed = fortificationManager.hasUsedFortification || false;
          const hasValidMoves = fortificationManager.hasValidFortificationMoves ? 
                                fortificationManager.hasValidFortificationMoves() : true;
          return hasUsed || !hasValidMoves;
        }
        return true; // If no manager, allow skip
      }
    };

    this.setupPhaseUI();
  }

  /**
   * Set phase synchronizer (called after all managers initialized)
   * @param {PhaseSynchronizer} synchronizer - Phase synchronizer instance
   */
  setPhaseSynchronizer(synchronizer) {
    this.phaseSynchronizer = synchronizer;
    console.log("[PhaseManager] PhaseSynchronizer connected");
  }

  /**
   * Set combat system instance
   * @param {CombatSystem} combatSystem - Combat system instance
   */
  setCombatSystem(combatSystem) {
    this.combatSystem = combatSystem;
  }

  /**
   * Set current phase
   */
  setPhase(newPhase) {
    if (!this.phaseConfig[newPhase]) {
      console.error(`[PhaseManager] Invalid phase: ${newPhase}`);
      return false;
    }
    
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;
    
    // Sync with game state
    this.syncWithGameState();
    
    // Update UI
    this.updatePhaseDisplay();
    
    console.log(`[PhaseManager] Phase set: ${oldPhase} → ${newPhase}`);
    
    // Dispatch event for dashboard system
    document.dispatchEvent(new CustomEvent('phaseChanged', {
      detail: { oldPhase, newPhase, source: 'PhaseManager' }
    }));
    
    return true;
  }

  /**
   * Advance to next phase
   */
  advancePhase() {
    if (this.phaseSynchronizer) {
      return this.phaseSynchronizer.advanceToNextPhase();
    }
    
    console.error('[PhaseManager] No PhaseSynchronizer connected');
    return { success: false, reason: 'No synchronizer' };
  }

  /**
   * Sync with GameState
   */
  syncWithGameState() {
    if (this.gameState) {
      this.gameState.phase = this.currentPhase;
    }
    
    if (this.phaseSynchronizer) {
      this.phaseSynchronizer.updatePhase(this.currentPhase, 'PhaseManager');
    }
  }

  /**
   * Get current phase configuration
   */
  getCurrentPhaseConfig() {
    return {
      phase: this.currentPhase,
      ...this.phaseConfig[this.currentPhase]
    };
  }

  /**
   * Check if current phase requirements are met
   */
  canCompletePhase() {
    const requirement = this.phaseRequirements[this.currentPhase];
    return requirement ? requirement() : false;
  }

  /**
   * Check if phase can be skipped
   */
  canSkipPhase() {
    const config = this.phaseConfig[this.currentPhase];
    return config ? config.canSkip : false;
  }

  // Phase requirement checkers
  isStartupComplete() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    return (this.gameState.remainingArmies[currentPlayer] || 0) === 0;
  }

  isReinforcementComplete() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    return (this.gameState.remainingArmies[currentPlayer] || 0) === 0;
  }

  setupPhaseUI() {
    // Create phase indicator UI elements
    this.createPhaseIndicator();
    this.createPhaseButtons();
    this.updatePhaseDisplay();
  }

  createPhaseIndicator() {
    // Phase indicator system has been removed - this method is now a no-op
    console.log("Phase indicator system removed - skipping indicator creation");
  }

  createPhaseButtons() {
    // Create phase control buttons
    let buttonContainer = document.getElementById("phase-buttons");
    if (!buttonContainer) {
      buttonContainer = document.createElement("div");
      buttonContainer.id = "phase-buttons";
      buttonContainer.className = "phase-buttons";

      // Add to controls section
      const controls = document.querySelector(".controls");
      if (controls) {
        controls.appendChild(buttonContainer);
      }
    }

    buttonContainer.innerHTML = `
            <button class="btn phase-btn" id="next-phase-btn" disabled>
                Next Phase
            </button>
            <button class="btn phase-btn secondary" id="skip-phase-btn" style="display: none;">
                Skip Phase
            </button>
        `;

    // Add event listeners
    document.getElementById("next-phase-btn").addEventListener("click", () => {
      this.advancePhase();
    });

    document.getElementById("skip-phase-btn").addEventListener("click", () => {
      this.skipPhase();
    });
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  skipPhase() {
    if (!this.canSkipPhase()) {
      console.warn(
        `[PhaseManager] ${this.currentPhase} phase cannot be skipped`
      );
      return false;
    }

    // Use phase synchronizer if available
    if (this.phaseSynchronizer) {
      const result = this.phaseSynchronizer.skipPhase();
      return result.success;
    } else {
      this.advancePhase();
      return true;
    }
  }

  // Duplicate canAdvancePhase removed (already defined above)

  // Legacy canSkipPhase (now using official phase config)
  canSkipCurrentPhase() {
    // Only attack and fortification phases can be skipped
    return this.currentPhase === "attack" || this.currentPhase === "fortification";
  }

  updatePhaseDisplay() {
    try {
      if (!this.gameState) {
        console.warn("GameState not available");
        return;
      }

      const phaseNameEl = document.getElementById("phase-name");
      const phaseDescriptionEl = document.getElementById("phase-description");
      const nextPhaseBtn = document.getElementById("next-phase-btn");
      const skipPhaseBtn = document.getElementById("skip-phase-btn");

      if (!phaseNameEl || !phaseDescriptionEl) return;

      const currentPhase = this.currentPhase;
      const canAdvance = this.canAdvancePhase();

      console.log(
        `Phase Display Update: ${currentPhase} (Advancement: ${canAdvance})`
      );

      const phaseInfo = this.getPhaseInfo(currentPhase);

      phaseNameEl.textContent = phaseInfo.name;
      phaseNameEl.className = `phase-name phase-${currentPhase}`;
      phaseDescriptionEl.textContent = phaseInfo.description;

      // Update progress
      this.updatePhaseProgress();

      // Update buttons
      if (nextPhaseBtn) {
        nextPhaseBtn.disabled = !canAdvance;
        nextPhaseBtn.textContent = phaseInfo.buttonText;
      }

      if (skipPhaseBtn) {
        skipPhaseBtn.style.display = this.canSkipPhase() ? "block" : "none";
      }

      // Update the phase progress panel
      if (typeof window.updateTurnManagementUI === 'function') {
        window.updateTurnManagementUI();
      }
    } catch (error) {
      console.error("Error updating phase display:", error);
    }
  }

  updatePhaseProgress() {
    const progressFill = document.getElementById("phase-progress-fill");
    const progressText = document.getElementById("phase-progress-text");

    if (!progressFill || !progressText) return;

    let progress = 0;
    let progressMessage = "";

    switch (this.currentPhase) {
      case "deploy":
        const currentPlayer = this.gameState.getCurrentPlayer();
        const totalReinforcements =
          this.gameState.reinforcements[currentPlayer] || 0;
        const remainingArmies =
          this.gameState.remainingArmies[currentPlayer] || 0;
        const deployed = totalReinforcements - remainingArmies;
        progress =
          totalReinforcements > 0
            ? (deployed / totalReinforcements) * 100
            : 100;
        progressMessage = `${deployed} of ${totalReinforcements} armies deployed`;
        break;

      case "attack":
        progressMessage = "Attack adjacent enemy territories or skip";
        progress = 0; // Attack progress is not measurable
        break;

      case "fortify":
        if (
          this.ui.fortificationManager &&
          this.ui.fortificationManager.hasUsedFortification
        ) {
          progress = 100;
          progressMessage = "Fortification completed";
        } else {
          progress = 0;
          progressMessage = "Move armies between your territories or skip";
        }
        break;

      default:
        progress = 0;
        progressMessage = "Phase in progress...";
    }

    progressFill.style.width = `${progress}%`;
    progressText.textContent = progressMessage;
  }

  updatePhaseRestrictions() {
    // Update territory highlighting and interaction rules
    this.clearAllHighlights();

    switch (this.currentPhase) {
      case "deploy":
        this.highlightOwnTerritories();
        break;
      case "attack":
        this.highlightAttackSources();
        break;
      case "fortify":
        this.highlightFortificationSources();
        break;
    }
  }

  getPhaseInfo(phase) {
    const phaseData = {
      "initial-setup": {
        name: "Initial Setup",
        description: "Players take turns claiming territories",
        buttonText: "Continue",
      },
      "initial-placement": {
        name: "Initial Placement",
        description: "Place your remaining armies on your territories",
        buttonText: "Continue",
      },
      deploy: {
        name: "Deploy",
        description: "Deploy your initial armies to your territories",
        buttonText: "Continue to Attack",
      },
      reinforce: {
        name: "Reinforce",
        description: "Deploy your reinforcement armies to your territories",
        buttonText: "Continue to Attack",
      },
      attack: {
        name: "Attack",
        description: "Attack adjacent enemy territories to expand your empire",
        buttonText: "Continue to Fortify",
      },
      fortify: {
        name: "Fortify",
        description: "Move armies between your connected territories",
        buttonText: "End Turn",
      },
    };

    return (
      phaseData[phase] || {
        name: "Unknown",
        description: "Unknown phase",
        buttonText: "Continue",
      }
    );
  }

  // Phase requirement checkers (legacy support)
  isInitialSetupComplete() {
    return this.isStartupComplete();
  }

  isInitialPlacementComplete() {
    return this.isStartupComplete();
  }

  isDeployPhaseComplete() {
    return this.isReinforcementComplete();
  }

  isReinforcePhaseComplete() {
    return this.isReinforcementComplete();
  }

  isFortifyPhaseComplete() {
    // Fortification phase is optional - can always be ended
    return true;
  }

  isFortificationPhaseComplete() {
    // Fortification phase is optional - can always be ended
    return true;
  }

  canAdvancePhase() {
    return this.canCompletePhase();
  }

  // Territory validation methods
  canInteractWithTerritory(territoryId, action) {
    const territory = this.gameState.territories[territoryId];
    const currentPlayer = this.gameState.getCurrentPlayer();

    switch (this.currentPhase) {
      case "deploy":
        return territory.owner === currentPlayer && action === "deploy";

      case "reinforce":
        return territory.owner === currentPlayer && action === "reinforce";

      case "attack":
        if (action === "select_source") {
          return territory.owner === currentPlayer && territory.armies > 1;
        } else if (action === "attack") {
          return territory.owner !== currentPlayer;
        }
        return false;

      case "fortify":
        return territory.owner === currentPlayer && action === "fortify";

      default:
        return true;
    }
  }

  // UI highlighting methods
  clearAllHighlights() {
    document.querySelectorAll(".territory").forEach((territory) => {
      territory.classList.remove(
        "highlight-own",
        "highlight-attackable",
        "highlight-fortifiable",
        "highlight-valid-source",
        "highlight-valid-target"
      );
    });
  }

  highlightOwnTerritories() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    Object.entries(this.gameState.territories).forEach(
      ([territoryId, territory]) => {
        if (territory.owner === currentPlayer) {
          const element = document.getElementById(territoryId);
          if (element) {
            element.classList.add("highlight-own");
          }
        }
      }
    );
  }

  highlightAttackSources() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    Object.entries(this.gameState.territories).forEach(
      ([territoryId, territory]) => {
        if (territory.owner === currentPlayer && territory.armies > 1) {
          // Check if this territory can attack any adjacent enemy territory
          const hasValidTargets = territory.neighbors.some((neighborId) => {
            const neighbor = this.gameState.territories[neighborId];
            return neighbor && neighbor.owner !== currentPlayer;
          });

          if (hasValidTargets) {
            const element = document.getElementById(territoryId);
            if (element) {
              element.classList.add("highlight-attackable");
            }
          }
        }
      }
    );
  }

  highlightFortificationSources() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    Object.entries(this.gameState.territories).forEach(
      ([territoryId, territory]) => {
        if (territory.owner === currentPlayer && territory.armies > 1) {
          const element = document.getElementById(territoryId);
          if (element) {
            element.classList.add("highlight-fortifiable");
          }
        }
      }
    );
  }

  // Event handlers
  onPhaseChange(oldPhase, newPhase) {
    // Notify other systems about phase changes
    if (this.ui) {
      this.ui.onPhaseChange && this.ui.onPhaseChange(oldPhase, newPhase);
    }

    // Phase-specific initialization
    switch (newPhase) {
      case "deploy":
        this.calculateReinforcements();
        break;
      case "attack":
        // Initialize attack phase with combat system
        this.initializeAttackPhase();
        break;
      case "fortify":
        if (this.ui.fortificationManager) {
          this.ui.fortificationManager.startFortificationPhase();
        }
        break;
    }

    // Update attack panel visibility for all phase changes
    if (typeof window.updateAttackPanelVisibility === "function") {
      window.updateAttackPanelVisibility();
    }
  }

  calculateReinforcements() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    const reinforcements =
      this.gameState.calculateReinforcements(currentPlayer);
    this.gameState.reinforcements[currentPlayer] = reinforcements;
    this.gameState.remainingArmies[currentPlayer] = reinforcements;

    // Update UI
    this.updatePhaseProgress();
  }

  endTurn() {
    // Reset phase-specific states
    if (this.ui.fortificationManager) {
      this.ui.fortificationManager.resetForNewTurn();
    }

    // Move to next player
    this.gameState.nextPlayer();

    // Start new turn with appropriate phase
    if (this.gameState.initialDeploymentComplete) {
      this.setPhase("reinforce");
    } else {
      this.setPhase("deploy");
    }

    // Calculate reinforcements for new turn
    this.calculateReinforcements();

    // Update turn counter if we've completed a full round
    if (this.gameState.currentPlayerIndex === 0) {
      this.gameState.turnNumber = (this.gameState.turnNumber || 1) + 1;
    }
  }

  showPhaseRequirementMessage() {
    const messages = {
      deploy: "You must deploy all your initial armies before continuing.",
      reinforce:
        "You must deploy all your reinforcement armies before continuing.",
      attack: "You can skip the attack phase if you don't want to attack.",
      fortify:
        "You can skip fortification or move armies between your territories.",
    };

    const message =
      messages[this.currentPhase] ||
      "Complete the current phase requirements to continue.";

    // Show a temporary message (you can enhance this with a proper notification system)
    const notification = document.createElement("div");
    notification.className = "phase-notification";
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Initialize attack phase with combat system
   */
  initializeAttackPhase() {
    // Clear any previous combat state
    if (this.combatSystem) {
      this.combatSystem.endCombat();
    }

    // Update UI for attack phase
    if (typeof window.updateAttackPanelVisibility === "function") {
      window.updateAttackPanelVisibility();
    }

    // Initialize combat UI if available
    if (window.combatUI) {
      window.combatUI.reset();
    }

    // Set up attack phase help text
    const helpText =
      "Click a territory you control with 2+ armies to start attacking, then click an adjacent enemy territory.";
    if (this.ui && this.ui.showMessage) {
      this.ui.showMessage(helpText);
    }
  }

  /**
   * Handle attack phase end
   */
  endAttackPhase() {
    // Clean up combat state
    if (this.combatSystem) {
      this.combatSystem.endCombat();
    }

    // Clear combat UI
    if (window.combatUI) {
      window.combatUI.reset();
    }

    // Hide attack panels
    if (typeof window.updateAttackPanelVisibility === "function") {
      window.updateAttackPanelVisibility();
    }
  }
}
