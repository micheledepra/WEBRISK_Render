/**
 * PhaseSynchronizer - Official Risk Rules Phase Management
 * Synchronizes phases across all game managers
 *
 * Official Risk Phase Order:
 * STARTUP (one-time): Players take turns placing initial armies
 * REGULAR TURNS (repeating): reinforcement → attack → fortification
 */
class PhaseSynchronizer {
  constructor(gameState, turnManager, phaseManager) {
    this.gameState = gameState;
    this.turnManager = turnManager;
    this.phaseManager = phaseManager;

    this.currentPhase = 'startup';
    this.phaseHistory = [];
    this.maxHistorySize = 100;
    this.listeners = [];

    // Managers object for connection after initialization
    this.managers = {
      turnManager: turnManager,
      phaseManager: phaseManager,
      gameState: gameState
    };
    
    // Valid phase transitions following official Risk rules
    this.validTransitions = {
      startup: ['reinforcement'],     // Startup only goes to reinforcement
      reinforcement: ['attack'],       // Reinforcement must go to attack
      attack: ['fortification'],       // Attack goes to fortification
      fortification: ['reinforcement'] // Fortification starts new turn
    };

    // Phase configurations following official Risk rules
    this.phaseConfig = {
      startup: {
        name: "Startup",
        description: "Players take turns placing initial armies",
        allowSkip: false,
        minRequirement: "All armies placed",
        color: "#9C27B0",
        emoji: "🎮",
        isPlayerCycle: true  // ✅ This "phase" cycles through all players (like a mini-turn for each)
      },
      reinforcement: {
        name: "Reinforcement",
        description: "Deploy your reinforcement armies to your territories",
        allowSkip: false,
        minRequirement: "All armies deployed",
        color: "#FDD835",
        emoji: "💰"
      },
      attack: {
        name: "Attack",
        description: "Attack adjacent enemy territories to expand your empire",
        allowSkip: true,
        minRequirement: "None (can skip)",
        color: "#81C784",
        emoji: "⚔️"
      },
      fortification: {
        name: "Fortification",
        description: "Move armies between your connected territories",
        allowSkip: true,
        minRequirement: "None (can skip)",
        color: "#64B5F6",
        emoji: "🛡️"
      }
    };

    console.log("[PhaseSynchronizer] Initialized with official Risk rules");
  }

  /**
   * Main phase transition method with full validation and synchronization
   * @param {string} newPhase - Target phase
   * @returns {object} - Transition result
   */
  transitionPhase(newPhase) {
    const oldPhase = this.gameState.phase;

    console.log(
      `[PhaseSynchronizer] Attempting transition: ${oldPhase} → ${newPhase}`
    );

    // Validate transition
    if (!this.isValidTransition(oldPhase, newPhase)) {
      const error = `Invalid transition from ${oldPhase} to ${newPhase}`;
      console.warn(`[PhaseSynchronizer] ${error}`);
      return {
        success: false,
        reason: error,
        oldPhase,
        newPhase,
      };
    }

    // Execute phase-specific cleanup from old phase
    this.executePhaseExit(oldPhase);
    
    // Update phase
    this.updatePhase(newPhase, 'transitionPhase');
    
    // Sync all managers
    this.syncAllManagers(newPhase);
    
    // Execute phase-specific initialization for new phase
    this.executePhaseEntry(newPhase);
    
    // Record history
    this.phaseHistory.push({
      from: oldPhase,
      to: newPhase,
      timestamp: Date.now(),
      reason: 'transitionPhase'
    });
    
    // Trim history if too large
    if (this.phaseHistory.length > this.maxHistorySize) {
      this.phaseHistory = this.phaseHistory.slice(-this.maxHistorySize);
    }
    
    // Notify listeners
    this.notifyListeners(newPhase, oldPhase);
    
    console.log(`[PhaseSynchronizer] ✅ Phase transition: ${oldPhase} → ${newPhase}`);
    
    return {
      success: true,
      oldPhase,
      newPhase,
      turn: this.gameState.turnNumber,
      player: this.gameState.getCurrentPlayer()
    };
  }

  /**
   * Advance to next phase following official Risk turn order
   */
  advanceToNextPhase() {
    const nextPhases = this.validTransitions[this.currentPhase];
    
    if (!nextPhases || nextPhases.length === 0) {
      return {
        success: false,
        reason: `No valid transition from ${this.currentPhase}`
      };
    }
    
    const nextPhase = nextPhases[0];
    const oldPhase = this.currentPhase;
    
    // Check if we're completing a player's turn (end of fortification)
    const completingTurn = oldPhase === 'fortification';
    
    // Execute phase-specific cleanup from old phase
    this.executePhaseExit(oldPhase);
    
    // Update phase
    this.updatePhase(nextPhase, 'PhaseSynchronizer');
    
    // Sync all managers
    this.syncAllManagers(nextPhase);
    
    // Execute phase-specific initialization for new phase
    this.executePhaseEntry(nextPhase);
    
    // If completing a turn, let TurnManager handle player advancement
    if (completingTurn && this.managers.turnManager) {
      console.log(`🔄 Completing turn - advancing to next player`);
      // TurnManager.advancePhase() will handle player advancement
    }
    
    // Record history
    this.phaseHistory.push({
      from: oldPhase,
      to: nextPhase,
      timestamp: Date.now(),
      reason: 'advanceToNextPhase',
      playerChange: completingTurn
    });
    
    // Trim history if too large
    if (this.phaseHistory.length > this.maxHistorySize) {
      this.phaseHistory = this.phaseHistory.slice(-this.maxHistorySize);
    }
    
    // Notify listeners
    this.notifyListeners(nextPhase, oldPhase);
    
    console.log(`[PhaseSynchronizer] ✅ Phase transition: ${oldPhase} → ${nextPhase}${completingTurn ? ' (Turn Complete)' : ''}`);
    
    return {
      success: true,
      oldPhase,
      newPhase: nextPhase,
      turn: this.gameState?.turnNumber,
      player: this.gameState?.getCurrentPlayer(),
      turnComplete: completingTurn
    };
  }

  /**
   * Skip current phase (only if optional)
   */
  skipPhase() {
    const skippablePhases = ['attack', 'fortification'];
    
    if (!skippablePhases.includes(this.currentPhase)) {
      return {
        success: false,
        reason: `Cannot skip ${this.currentPhase} phase (mandatory)`
      };
    }
    
    console.log(`[PhaseSynchronizer] ⏭️ Skipping ${this.currentPhase} phase`);
    return this.advanceToNextPhase();
  }

  /**
   * Update phase across all managers
   */
  updatePhase(newPhase, source = 'unknown') {
    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;
    
    console.log(`[PhaseSynchronizer] Phase updated: ${oldPhase} → ${newPhase} (source: ${source})`);
    
    return {
      success: true,
      oldPhase,
      newPhase
    };
  }

  /**
   * Sync all connected managers
   */
  syncAllManagers(phase) {
    if (this.gameState) {
      this.gameState.phase = phase;
    }
    
    if (this.turnManager) {
      this.turnManager.currentPhase = phase;
    }
    
    if (this.phaseManager) {
      this.phaseManager.currentPhase = phase;
      if (this.phaseManager.updatePhaseDisplay) {
        this.phaseManager.updatePhaseDisplay();
      }
    }
    
    console.log(`[PhaseSynchronizer] All managers synced to ${phase}`);
  }

  /**
   * Execute initialization when entering a phase
   */
  executePhaseEntry(phase) {
    const currentPlayer = this.gameState.getCurrentPlayer();

    console.log(`[PhaseSynchronizer] Entering ${phase} phase`);

    switch (phase) {
      case "startup":
        // Startup phase handling
        const remaining = this.gameState.remainingArmies[currentPlayer] || 0;
        console.log(`[PhaseSynchronizer] ${currentPlayer} has ${remaining} armies to deploy`);
        break;

      case "reinforcement":
        // Calculate reinforcements
        const reinforcements =
          this.gameState.calculateReinforcements(currentPlayer);
        this.gameState.reinforcements[currentPlayer] = reinforcements;
        this.gameState.remainingArmies[currentPlayer] = reinforcements;

        console.log(
          `[PhaseSynchronizer] ${currentPlayer} receives ${reinforcements} reinforcements`
        );
        break;

      case "attack":
        // Initialize attack phase
        if (this.phaseManager) {
          this.phaseManager.initializeAttackPhase?.();
        }
        console.log('[PhaseSynchronizer] Attack phase initialized');
        break;

      case "fortification":
        // ✅ CRITICAL: Initialize fortification phase
        if (this.fortificationManager) {
          this.fortificationManager.initializeFortificationPhase();
          console.log('[PhaseSynchronizer] Fortification initialized via direct manager');
        } else if (this.phaseManager?.ui?.fortificationManager) {
          this.phaseManager.ui.fortificationManager.initializeFortificationPhase?.();
          console.log('[PhaseSynchronizer] Fortification initialized via PhaseManager UI');
        } else if (window.riskUI?.fortificationManager) {
          window.riskUI.fortificationManager.initializeFortificationPhase?.();
          console.log('[PhaseSynchronizer] Fortification initialized via window.riskUI');
        }
        console.log('[PhaseSynchronizer] Fortification phase initialized');
        break;
    }
  }

  /**
   * Execute cleanup when exiting a phase
   */
  executePhaseExit(phase) {
    console.log(`[PhaseSynchronizer] Exiting ${phase} phase`);
    
    switch(phase) {
      case 'attack':
        // Clean up attack phase
        if (this.phaseManager && typeof this.phaseManager.endAttackPhase === 'function') {
          this.phaseManager.endAttackPhase();
        }
        console.log('[PhaseSynchronizer] Attack phase cleanup complete');
        break;
        
      case 'fortification':
        // ✅ CRITICAL: Complete fortification phase
        if (this.fortificationManager) {
          // Don't mark as used if skipping, just clear state
          console.log('[PhaseSynchronizer] Fortification phase exiting');
        }
        break;
    }
  }

  /**
   * Validate if a phase transition is allowed
   */
  isValidTransition(fromPhase, toPhase) {
    const validTransitions = this.validTransitions[fromPhase];
    if (!validTransitions) {
      return false;
    }
    return validTransitions.includes(toPhase);
  }

  /**
   * Register phase change listener
   */
  onPhaseChange(callback) {
    this.listeners.push(callback);
  }

  /**
   * Unregister phase change listener
   */
  offPhaseChange(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of phase change
   */
  notifyListeners(newPhase, oldPhase) {
    this.listeners.forEach(listener => {
      try {
        listener(newPhase, oldPhase);
      } catch (error) {
        console.error('[PhaseSynchronizer] Error in phase change listener:', error);
      }
    });
  }

  /**
   * Get phase transition history
   */
  getPhaseHistory(limit = 10) {
    return this.phaseHistory.slice(-limit);
  }

  /**
   * Check if phase transition is valid
   */
  isValidPhaseTransition(fromPhase, toPhase) {
    const validNext = this.validTransitions[fromPhase] || [];
    return validNext.includes(toPhase);
  }

  /**
   * Get phase configuration
   */
  getPhaseConfig(phase) {
    return this.phaseConfig[phase] || null;
  }

  /**
   * Get all phase configurations
   */
  getAllPhaseConfigs() {
    return this.phaseConfig;
  }

  /**
   * Connect managers
   */
  connectManager(managerType, manager) {
    this.managers[managerType] = manager;
    console.log(`[PhaseSynchronizer] ✅ Connected ${managerType}`);
  }

  /**
   * Debug state information
   */
  debugState() {
    return {
      currentPhase: this.currentPhase,
      gameStatePhase: this.gameState?.phase,
      turnManagerPhase: this.turnManager?.currentPhase,
      phaseManagerPhase: this.phaseManager?.currentPhase,
      turnNumber: this.gameState?.turnNumber,
      currentPlayer: this.gameState?.getCurrentPlayer(),
      historySize: this.phaseHistory.length
    };
  }

  /**
   * Reset synchronizer (for testing)
   */
  reset() {
    this.currentPhase = 'startup';
    this.phaseHistory = [];
    this.listeners = [];
    console.log('[PhaseSynchronizer] Reset to startup phase');
  }
}

// Make available globally
// Make available globally
if (typeof window !== 'undefined') {
  window.PhaseSynchronizer = PhaseSynchronizer;
}
