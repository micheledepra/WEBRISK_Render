/**
 * Turn and Phase Management System - Integration Example
 *
 * This file demonstrates how the unified turn and phase management
 * system is integrated into the RiskUI.initGame() method.
 *
 * It shows:
 * 1. How PhaseSynchronizer is created and wired
 * 2. How to subscribe to phase changes
 * 3. How to update UI based on phase events
 * 4. How to enable debugging
 */

// ============================================================================
// EXAMPLE 1: Basic Integration in RiskUI.initGame()
// ============================================================================

class RiskUI {
  initGame(players, colors = []) {
    // Step 1: Create core game systems
    this.gameState = new GameState(players, colors);
    this.turnManager = new TurnManager(this.gameState);
    this.phaseManager = new PhaseManager(this.gameState, this);

    // Step 2: Initialize other managers (reinforcement, fortification, etc.)
    this.reinforcementManager.initializeGame(
      this.gameState,
      this.territoryVisualManager
    );
    this.fortificationManager.initializeGame(
      this.gameState,
      this.territoryVisualManager
    );

    // Step 3: Connect managers to TurnManager
    this.turnManager.setReinforcementManager(this.reinforcementManager);
    this.turnManager.setFortificationManager(this.fortificationManager);

    // Step 4: Create PhaseSynchronizer (Central Orchestrator)
    //         This is the NEW unified phase management system
    this.phaseSynchronizer = new PhaseSynchronizer(
      this.gameState,
      this.turnManager,
      this.phaseManager
    );

    // Step 5: Connect synchronizer to all systems
    this.turnManager.setPhaseSynchronizer(this.phaseSynchronizer);
    this.phaseManager.setPhaseSynchronizer(this.phaseSynchronizer);

    // Step 6: Subscribe to phase changes for UI updates
    this.phaseSynchronizer.onPhaseChange((data) => {
      console.log(
        `Phase: ${data.oldPhase} → ${data.newPhase} (Turn ${data.turn})`
      );
      this.updatePhaseUI(data);
    });

    // Step 7: Set up event handlers and initial UI
    this.setupEventHandlers();
    this.updateAllTerritoryVisuals();

    // Step 8: Optional - Set up debugging
    this.setupDebugging();
  }

  /**
   * Update UI in response to phase changes
   */
  updatePhaseUI(phaseData) {
    const { oldPhase, newPhase, turn, player, config } = phaseData;

    // Update turn counter
    const turnElement = document.querySelector("[data-turn-number]");
    if (turnElement) {
      turnElement.textContent = turn;
    }

    // Update current player
    const playerElement = document.querySelector("[data-current-player]");
    if (playerElement) {
      playerElement.textContent = player;
      playerElement.style.color = this.gameState.playerColors[player];
    }

    // Update phase indicator
    const phaseElement = document.querySelector("[data-current-phase]");
    if (phaseElement) {
      phaseElement.textContent = config.name;
      if (config.color) {
        phaseElement.style.backgroundColor = config.color;
      }
    }

    // Phase-specific UI updates
    this.handlePhaseSpecificUI(newPhase);
  }

  /**
   * Handle phase-specific UI display
   */
  handlePhaseSpecificUI(phase) {
    switch (phase) {
      case "initial-setup":
        this.showInitialSetupUI();
        break;
      case "deploy":
      case "reinforce":
        this.showReinforcementUI();
        break;
      case "attack":
        this.showAttackUI();
        break;
      case "fortify":
        this.showFortificationUI();
        break;
    }
  }

  /**
   * Optional: Set up debugging for development
   */
  setupDebugging() {
    // Create debugger instance
    this.debugger = new PhaseDebugger(
      this.gameState,
      this.turnManager,
      this.phaseManager,
      this.phaseSynchronizer
    );

    // Make available globally for console access
    window.gameDebugger = this.debugger;

    // Example: Log on phase changes
    console.log("[RiskUI] Phase management system ready");
    console.log("[RiskUI] To debug, use: window.gameDebugger");
    console.log("[RiskUI] Commands:");
    console.log("  - gameDebugger.enableLogging()");
    console.log("  - gameDebugger.printGameState()");
    console.log("  - gameDebugger.verifySynchronization()");
    console.log("  - gameDebugger.printPhaseHistory()");
    console.log("  - gameDebugger.printReport()");
    console.log("  - gameDebugger.downloadLogs()");
  }
}

// ============================================================================
// EXAMPLE 2: Handling Phase Advancement from UI Buttons
// ============================================================================

class RiskUIButtonHandlers {
  /**
   * Handle "Next Phase" button click
   */
  handleNextPhaseClick() {
    // Check if current phase has been completed
    if (!this.phaseManager.canAdvancePhase()) {
      // Show error message
      const config = this.phaseManager.getCurrentPhaseConfig();
      showNotification(`Cannot advance: ${config.minRequirement}`);
      return;
    }

    // Advance to next phase
    if (this.phaseManager.advancePhase()) {
      console.log("✅ Phase advanced");
      // UI update happens automatically via onPhaseChange listener
    } else {
      console.error("❌ Failed to advance phase");
    }
  }

  /**
   * Handle "Skip Phase" button click (attack and fortify only)
   */
  handleSkipPhaseClick() {
    // Check if phase can be skipped
    if (!this.phaseManager.canSkipPhase()) {
      showNotification("This phase cannot be skipped");
      return;
    }

    // Skip the phase
    if (this.phaseManager.skipPhase()) {
      console.log("✅ Phase skipped");
      // UI update happens automatically
    } else {
      console.error("❌ Failed to skip phase");
    }
  }

  /**
   * Handle "End Turn" button click (same as next phase when in fortify)
   */
  handleEndTurnClick() {
    // Only available in fortify phase
    if (this.gameState.phase !== "fortify") {
      showNotification("You can only end turn during fortify phase");
      return;
    }

    // Advance from fortify to next player's reinforce
    if (this.phaseManager.advancePhase()) {
      console.log("✅ Turn ended, moving to next player");
    }
  }
}

// ============================================================================
// EXAMPLE 3: Monitoring Game State Changes
// ============================================================================

class GameMonitor {
  constructor(riskUI) {
    this.riskUI = riskUI;
    this.setupPhaseMonitoring();
    this.setupStateValidation();
  }

  /**
   * Monitor all phase transitions
   */
  setupPhaseMonitoring() {
    this.riskUI.phaseSynchronizer.onPhaseChange((data) => {
      console.group(`[Monitor] Phase Transition - Turn ${data.turn}`);
      console.log(`Player: ${data.player}`);
      console.log(`${data.oldPhase} → ${data.newPhase}`);
      console.log(`Time: ${new Date().toLocaleTimeString()}`);

      // Track important transitions
      if (data.oldPhase === "fortify" && data.newPhase === "reinforce") {
        console.log("🔄 Full player cycle detected");
      }

      console.groupEnd();
    });
  }

  /**
   * Validate game state after each phase change
   */
  setupStateValidation() {
    this.riskUI.phaseSynchronizer.onPhaseChange((data) => {
      this.validateGameState();
    });
  }

  /**
   * Comprehensive state validation
   */
  validateGameState() {
    const { gameState, turnManager, phaseManager, phaseSynchronizer } =
      this.riskUI;

    // Check synchronization
    const isSynced =
      gameState.phase === turnManager.currentPhase &&
      turnManager.currentPhase === phaseManager.currentPhase;

    if (!isSynced) {
      console.error("❌ SYNCHRONIZATION ERROR");
      console.error(`GameState: ${gameState.phase}`);
      console.error(`TurnManager: ${turnManager.currentPhase}`);
      console.error(`PhaseManager: ${phaseManager.currentPhase}`);
      return false;
    }

    // Check player validity
    const currentPlayer = gameState.getCurrentPlayer();
    if (!gameState.players.includes(currentPlayer)) {
      console.error("❌ Invalid current player");
      return false;
    }

    // Check territories are valid
    const territories = Object.values(gameState.territories);
    for (const territory of territories) {
      if (territory.owner && !gameState.players.includes(territory.owner)) {
        console.error(`❌ Invalid territory owner: ${territory.owner}`);
        return false;
      }
    }

    console.log("✅ Game state valid");
    return true;
  }
}

// ============================================================================
// EXAMPLE 4: Debug Commands for Console
// ============================================================================

/**
 * Global debug commands (use in browser console)
 *
 * Enable these by creating RiskUI and accessing:
 *   window.gameDebugger
 *
 * Then use:
 *   gameDebugger.enableLogging()
 *   gameDebugger.printGameState()
 *   gameDebugger.verifySynchronization()
 *   etc.
 */

// Quick reference for console:
const DebugCommands = {
  // Check current state
  "gameDebugger.printGameState()": "Show current phase, player, turn",
  "gameDebugger.printManagerStates()": "Show all manager states",
  "gameDebugger.verifySynchronization()": "Check if systems are synchronized",

  // View history
  "gameDebugger.printPhaseHistory()": "Show last 20 phase transitions",
  "gameDebugger.checkPhaseRequirements()": "Show current phase requirements",

  // Logging
  "gameDebugger.enableLogging()": "Enable detailed phase logging",
  "gameDebugger.disableLogging()": "Disable logging",
  "gameDebugger.getLogs()": "Get all logs as string",
  "gameDebugger.clearLogs()": "Clear log buffer",

  // Reports
  "gameDebugger.printReport()": "Print comprehensive debug report",
  "gameDebugger.downloadLogs()": "Download logs as JSON file",

  // Utilities
  "gameDebugger.getStatus()": "Get current status summary",
  "window.gameDebugger.simulatePhaseTransition()": "Test phase transition",
};

// ============================================================================
// EXAMPLE 5: Custom Phase Change Listener
// ============================================================================

class CustomPhaseListener {
  /**
   * Example: Track specific phase transitions
   */
  trackAttackPhase(riskUI) {
    riskUI.phaseSynchronizer.onPhaseChange((data) => {
      if (data.newPhase === "attack") {
        console.log(`🗡️  ${data.player} entering attack phase`);
        this.logAttackPhaseStart(data.player);
      } else if (data.oldPhase === "attack") {
        console.log(`${data.player} finished attack phase`);
        this.logAttackPhaseEnd(data.player);
      }
    });
  }

  /**
   * Example: Track reinforcement amounts
   */
  trackReinforcements(riskUI) {
    riskUI.phaseSynchronizer.onPhaseChange((data) => {
      if (data.newPhase === "reinforce" || data.newPhase === "deploy") {
        const player = data.player;
        const reinforcements = riskUI.gameState.remainingArmies[player];
        console.log(`💪 ${player} receives ${reinforcements} armies`);
      }
    });
  }

  /**
   * Example: Track turn progression
   */
  trackTurns(riskUI) {
    let lastTurn = riskUI.gameState.turnNumber;

    riskUI.phaseSynchronizer.onPhaseChange((data) => {
      if (data.turn > lastTurn) {
        console.log(`📊 TURN ${data.turn} STARTED`);
        lastTurn = data.turn;
      }
    });
  }

  logAttackPhaseStart(player) {
    // Custom logic here
  }

  logAttackPhaseEnd(player) {
    // Custom logic here
  }
}

// ============================================================================
// EXAMPLE 6: Testing Phase Management
// ============================================================================

class PhaseManagementTests {
  /**
   * Test initial setup phase sequence
   */
  testInitialSetup() {
    console.group("TEST: Initial Setup Sequence");

    const gameState = window.riskUI.gameState;
    const phaseManager = window.riskUI.phaseManager;

    // Initial state
    console.assert(
      gameState.phase === "initial-setup",
      "Should start at initial-setup"
    );

    // Claim all territories
    let owned = 0;
    for (const territory of Object.values(gameState.territories)) {
      territory.owner = gameState.getCurrentPlayer();
      territory.armies = 1;
      owned++;

      if (
        owned %
          Math.ceil(
            Object.keys(gameState.territories).length / gameState.players.length
          ) ===
        0
      ) {
        gameState.nextPlayer();
      }
    }

    // Verify phase advanced
    console.assert(
      gameState.phase === "initial-placement",
      "Should advance to initial-placement"
    );

    console.groupEnd();
  }

  /**
   * Test reinforcement calculation
   */
  testReinforcements() {
    console.group("TEST: Reinforcement Calculation");

    const gameState = window.riskUI.gameState;
    const player = gameState.getCurrentPlayer();

    // Give player 9 territories
    let count = 0;
    for (const territory of Object.values(gameState.territories)) {
      if (count < 9) {
        territory.owner = player;
        count++;
      }
    }

    const reinforcements = gameState.calculateReinforcements(player);
    console.log(`${player} with 9 territories gets ${reinforcements} armies`);
    console.assert(reinforcements >= 3, "Should be at least 3 (minimum)");

    console.groupEnd();
  }

  /**
   * Test synchronization
   */
  testSynchronization() {
    console.group("TEST: Synchronization Check");

    const { gameState, turnManager, phaseManager } = window.riskUI;

    const isSynced =
      gameState.phase === turnManager.currentPhase &&
      turnManager.currentPhase === phaseManager.currentPhase;

    console.log(`GameState: ${gameState.phase}`);
    console.log(`TurnManager: ${turnManager.currentPhase}`);
    console.log(`PhaseManager: ${phaseManager.currentPhase}`);
    console.assert(isSynced, "All systems should be synchronized");

    console.groupEnd();
  }
}

// ============================================================================
// QUICK START GUIDE FOR DEVELOPERS
// ============================================================================

/*
 * TO USE THE PHASE MANAGEMENT SYSTEM:
 *
 * 1. INITIALIZATION (happens automatically in RiskUI.initGame())
 *    - PhaseSynchronizer created
 *    - All systems connected
 *    - Event listeners subscribed
 *
 * 2. ADVANCE PHASE (from UI buttons)
 *    if (riskUI.phaseManager.advancePhase()) {
 *        console.log('Phase advanced');
 *    }
 *
 * 3. SKIP PHASE (attack/fortify only)
 *    if (riskUI.phaseManager.skipPhase()) {
 *        console.log('Phase skipped');
 *    }
 *
 * 4. LISTEN TO CHANGES
 *    riskUI.phaseSynchronizer.onPhaseChange((data) => {
 *        console.log(`${data.oldPhase} → ${data.newPhase}`);
 *    });
 *
 * 5. DEBUG
 *    window.gameDebugger.printGameState();
 *    window.gameDebugger.verifySynchronization();
 *    window.gameDebugger.printReport();
 *
 * For more: see TURN_AND_PHASE_IMPLEMENTATION.md
 */
