/**
 * PhaseDebugger - Debugging and monitoring utility for turn and phase management
 *
 * Provides comprehensive debugging, logging, and state inspection
 * for troubleshooting phase transitions and turn management
 */
class PhaseDebugger {
  constructor(gameState, turnManager, phaseManager, phaseSynchronizer) {
    this.gameState = gameState;
    this.turnManager = turnManager;
    this.phaseManager = phaseManager;
    this.phaseSynchronizer = phaseSynchronizer;

    // Logging state
    this.isLogging = false;
    this.logBuffer = [];
    this.maxLogSize = 200;

    // Event tracking
    this.phaseChangeEvents = [];
    this.maxEventSize = 100;

    // Performance metrics
    this.metrics = {
      transitionTimes: [],
      averageTransitionTime: 0,
      slowestTransition: 0,
    };
  }

  /**
   * Enable detailed phase logging
   */
  enableLogging() {
    this.isLogging = true;
    console.log("[PhaseDebugger] Logging enabled");
    this.log("Logging enabled");
  }

  /**
   * Disable detailed phase logging
   */
  disableLogging() {
    this.isLogging = false;
    console.log("[PhaseDebugger] Logging disabled");
  }

  /**
   * Log a message to the buffer
   */
  log(message) {
    if (!this.isLogging) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;

    this.logBuffer.push(logEntry);
    console.log(logEntry);

    if (this.logBuffer.length > this.maxLogSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Get the complete log
   */
  getLogs() {
    return this.logBuffer.join("\n");
  }

  /**
   * Clear the log buffer
   */
  clearLogs() {
    this.logBuffer = [];
  }

  /**
   * Print current game state
   */
  printGameState() {
    console.group("[PhaseDebugger] Game State");
    console.log("Current Phase:", this.gameState.phase);
    console.log("Current Player:", this.gameState.getCurrentPlayer());
    console.log("Turn Number:", this.gameState.turnNumber);
    console.log("Player Index:", this.gameState.currentPlayerIndex);
    console.log("Total Players:", this.gameState.players.length);
    console.log(
      "Initial Deployment Complete:",
      this.gameState.initialDeploymentComplete
    );
    console.log("Territories Owned:", {
      ...Object.values(this.gameState.territories).reduce((acc, t) => {
        acc[t.owner] = (acc[t.owner] || 0) + 1;
        return acc;
      }, {}),
    });
    console.log("Remaining Armies:", this.gameState.remainingArmies);
    console.log("Reinforcements:", this.gameState.reinforcements);
    console.groupEnd();

    this.log(
      `STATE: Phase=${
        this.gameState.phase
      }, Player=${this.gameState.getCurrentPlayer()}, Turn=${
        this.gameState.turnNumber
      }`
    );
  }

  /**
   * Print manager states
   */
  printManagerStates() {
    console.group("[PhaseDebugger] Manager States");

    console.group("TurnManager");
    console.log("Current Phase:", this.turnManager.currentPhase);
    console.log("Turn Number:", this.turnManager.turnNumber);
    console.log("Selected Territory:", this.turnManager.selectedTerritory);
    console.groupEnd();

    console.group("PhaseManager");
    console.log("Current Phase:", this.phaseManager.currentPhase);
    console.log("Can Advance:", this.phaseManager.canAdvancePhase());
    console.log("Can Skip:", this.phaseManager.canSkipPhase());
    console.groupEnd();

    console.group("PhaseSynchronizer");
    console.log("History Size:", this.phaseSynchronizer.phaseHistory.length);
    console.log("Listeners:", this.phaseSynchronizer.listeners.length);
    console.groupEnd();

    console.groupEnd();

    this.log(
      `MANAGERS: TM=${this.turnManager.currentPhase}, PM=${this.phaseManager.currentPhase}, PS=${this.phaseSynchronizer.phaseHistory.length} history`
    );
  }

  /**
   * Verify synchronization between systems
   */
  verifySynchronization() {
    console.group("[PhaseDebugger] Synchronization Check");

    const gameStatePhase = this.gameState.phase;
    const turnManagerPhase = this.turnManager.currentPhase;
    const phaseManagerPhase = this.phaseManager.currentPhase;

    const isSync =
      gameStatePhase === turnManagerPhase &&
      turnManagerPhase === phaseManagerPhase;

    console.log("GameState Phase:", gameStatePhase);
    console.log("TurnManager Phase:", turnManagerPhase);
    console.log("PhaseManager Phase:", phaseManagerPhase);
    console.log("🔄 Synchronized:", isSync ? "✅ YES" : "❌ NO");

    if (!isSync) {
      console.warn("Synchronization mismatch detected!");
      console.warn(
        `GameState: ${gameStatePhase}, TurnManager: ${turnManagerPhase}, PhaseManager: ${phaseManagerPhase}`
      );
    }

    console.groupEnd();

    const syncStatus = isSync ? "SYNC" : "OUT_OF_SYNC";
    this.log(
      `SYNC CHECK: ${syncStatus} (GS=${gameStatePhase}, TM=${turnManagerPhase}, PM=${phaseManagerPhase})`
    );

    return isSync;
  }

  /**
   * Print phase transition history
   */
  printPhaseHistory() {
    console.group("[PhaseDebugger] Phase Transition History");

    const history = this.phaseSynchronizer.getPhaseHistory(20);
    if (history.length === 0) {
      console.log("No history recorded");
    } else {
      history.forEach((record, index) => {
        console.log(
          `${index + 1}. Turn ${record.turn}, ${record.player}: ${
            record.from
          } → ${record.to}`
        );
      });
    }

    console.groupEnd();

    this.log(`HISTORY: ${history.length} transitions recorded`);
  }

  /**
   * Check phase requirement status
   */
  checkPhaseRequirements() {
    console.group("[PhaseDebugger] Phase Requirements");

    const phase = this.gameState.phase;
    const currentPlayer = this.gameState.getCurrentPlayer();

    console.log("Current Phase:", phase);
    console.log("Current Player:", currentPlayer);

    switch (phase) {
      case "initial-setup":
        const allClaimed = Object.values(this.gameState.territories).every(
          (t) => t.owner !== null
        );
        console.log("All territories claimed:", allClaimed ? "✅" : "❌");
        this.log(
          `REQUIREMENT: initial-setup - all territories claimed: ${allClaimed}`
        );
        break;

      case "initial-placement":
        const allPlaced = this.gameState.players.every(
          (p) => (this.gameState.remainingArmies[p] || 0) === 0
        );
        console.log("All armies placed:", allPlaced ? "✅" : "❌");
        this.log(
          `REQUIREMENT: initial-placement - all armies placed: ${allPlaced}`
        );
        break;

      case "deploy":
      case "reinforce":
        const remaining = this.gameState.remainingArmies[currentPlayer] || 0;
        console.log(
          `${phase} - Remaining armies for ${currentPlayer}:`,
          remaining
        );
        console.log("Phase complete:", remaining === 0 ? "✅" : "❌");
        this.log(
          `REQUIREMENT: ${phase} - ${currentPlayer} remaining: ${remaining}`
        );
        break;

      case "attack":
        console.log("Attack phase - Can be skipped: ✅");
        this.log("REQUIREMENT: attack - can skip");
        break;

      case "fortify":
        console.log("Fortify phase - Can be skipped: ✅");
        this.log("REQUIREMENT: fortify - can skip");
        break;
    }

    console.groupEnd();
  }

  /**
   * Simulate a phase transition
   */
  simulatePhaseTransition() {
    console.group("[PhaseDebugger] Simulating Phase Transition");

    const oldPhase = this.gameState.phase;
    console.log("Current Phase:", oldPhase);

    if (this.phaseManager.canAdvancePhase()) {
      console.log("✅ Can advance phase");
      console.log("Attempting transition...");

      const startTime = performance.now();
      const result = this.phaseManager.advancePhase();
      const endTime = performance.now();

      console.log("Transition result:", result ? "✅ Success" : "❌ Failed");
      console.log("Transition time:", (endTime - startTime).toFixed(2) + "ms");

      if (result) {
        console.log("New Phase:", this.gameState.phase);
        this.recordTransitionMetrics(endTime - startTime);
      }
    } else {
      console.log("❌ Cannot advance phase - requirements not met");
    }

    console.groupEnd();

    this.log(`SIMULATION: ${oldPhase} → ${this.gameState.phase}`);
  }

  /**
   * Record transition performance metrics
   */
  recordTransitionMetrics(duration) {
    this.metrics.transitionTimes.push(duration);

    const sum = this.metrics.transitionTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageTransitionTime =
      sum / this.metrics.transitionTimes.length;
    this.metrics.slowestTransition = Math.max(...this.metrics.transitionTimes);

    console.log("Metrics:", {
      averageTime: this.metrics.averageTransitionTime.toFixed(3) + "ms",
      slowestTime: this.metrics.slowestTransition.toFixed(3) + "ms",
      totalTransitions: this.metrics.transitionTimes.length,
    });
  }

  /**
   * Generate comprehensive debug report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      gameState: {
        phase: this.gameState.phase,
        currentPlayer: this.gameState.getCurrentPlayer(),
        turnNumber: this.gameState.turnNumber,
        playerIndex: this.gameState.currentPlayerIndex,
        totalPlayers: this.gameState.players.length,
        initialDeploymentComplete: this.gameState.initialDeploymentComplete,
      },
      managers: {
        turnManager: {
          phase: this.turnManager.currentPhase,
          turnNumber: this.turnManager.turnNumber,
        },
        phaseManager: {
          phase: this.phaseManager.currentPhase,
          canAdvance: this.phaseManager.canAdvancePhase(),
          canSkip: this.phaseManager.canSkipPhase(),
        },
        synchronizer: {
          historySize: this.phaseSynchronizer.phaseHistory.length,
          listeners: this.phaseSynchronizer.listeners.length,
        },
      },
      synchronization: this.verifySynchronization(),
      metrics: this.metrics,
      recentHistory: this.phaseSynchronizer.getPhaseHistory(5),
    };

    return report;
  }

  /**
   * Print formatted debug report
   */
  printReport() {
    const report = this.generateReport();
    console.group("[PhaseDebugger] Debug Report");
    console.table(report);
    console.groupEnd();

    this.log(`REPORT: ${JSON.stringify(report)}`);

    return report;
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return {
      timestamp: new Date().toISOString(),
      logs: this.logBuffer,
      report: this.generateReport(),
    };
  }

  /**
   * Download logs as JSON file
   */
  downloadLogs() {
    const data = this.exportLogs();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `phase-debug-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get status summary
   */
  getStatus() {
    return {
      isSynchronized: this.verifySynchronization(),
      currentPhase: this.gameState.phase,
      currentPlayer: this.gameState.getCurrentPlayer(),
      turnNumber: this.gameState.turnNumber,
      requirementsMet: this.phaseManager.canAdvancePhase(),
      canSkip: this.phaseManager.canSkipPhase(),
    };
  }
}

// Make available globally
window.PhaseDebugger = PhaseDebugger;
