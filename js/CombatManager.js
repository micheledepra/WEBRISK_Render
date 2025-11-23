/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RISK COMBAT MANAGER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A comprehensive combat management system for Risk board game implementation
 * following official Risk rules with user-input battle resolution.
 *
 * @author Risk Digital Development Team
 * @version 2.0.0
 * @license MIT
 *
 * OFFICIAL RISK RULES IMPLEMENTED:
 * --------------------------------
 * - Attacker must leave at least 1 army in attacking territory
 * - Battle resolution via user input (replacing dice rolling)
 * - Combat continues until attacker chooses to stop or defender eliminated
 * - Winner occupies territory if defender is eliminated
 * - Territories must be adjacent to attack
 * - Cannot attack own territories
 *
 * COMBAT STATISTICS TRACKING:
 * --------------------------
 * This CombatManager automatically tracks detailed combat statistics for each player:
 * 
 * Per Player Tracking:
 * - unitsLost: Total units this player has lost in all combats
 * - unitsKilled: Total enemy units this player has destroyed
 * 
 * Integration with Dashboard:
 * - Statistics are automatically broadcast after each battle round
 * - Dashboard receives updates via three methods:
 *   1. Custom events (combatStatsUpdated)
 *   2. updateDashboardData() function call
 *   3. StatisticsManager integration
 * 
 * Usage Example:
 * ```javascript
 * // In processBattle, stats are automatically tracked:
 * // - Attacker loses 2 units, defender loses 3 units
 * // - attackerPlayer.unitsLost += 2
 * // - attackerPlayer.unitsKilled += 3 (defender's losses)
 * // - defenderPlayer.unitsLost += 3
 * // - defenderPlayer.unitsKilled += 2 (attacker's losses)
 * 
 * // Get stats for a specific player:
 * const stats = combatManager.getPlayerCombatStats("Alice");
 * console.log(`Alice lost ${stats.unitsLost}, killed ${stats.unitsKilled}`);
 * 
 * // Get all players' stats:
 * const allStats = combatManager.getAllPlayerCombatStats();
 * ```
 *
 * ARCHITECTURE:
 * ------------
 * This CombatManager acts as the orchestration layer, coordinating:
 * - CombatSystem: Core combat logic and state management
 * - CombatValidator: Input validation and rule enforcement
 * - DirectCombat: Battle outcome determination
 * - CombatUI: User interface and visual feedback
 * - Dashboard: Real-time statistics broadcasting
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * CombatManager - Central orchestrator for all combat operations
 *
 * This class provides a clean, unified API for managing combat in the Risk game.
 * It integrates with existing combat components while providing enhanced
 * functionality, validation, and error handling.
 *
 * @class CombatManager
 *
 * @example
 * // Initialize combat manager
 * const combatManager = new CombatManager(gameState, combatUI);
 *
 * // Initiate combat
 * const initResult = combatManager.initiateCombat('western-us', 'alberta');
 * if (initResult.success) {
 *   console.log('Combat started:', initResult.combatState);
 * }
 *
 * // Process battle with user input
 * const battleResult = combatManager.processBattle({
 *   attackerRemaining: 2,
 *   defenderRemaining: 1
 * });
 *
 * // Handle conquest
 * if (battleResult.isConquest) {
 *   const conquestResult = combatManager.completeConquest(3);
 * }
 */
class CombatManager {
  /**
   * Create a new CombatManager instance
   *
   * @param {Object} gameState - The global game state object containing territories
   * @param {CombatUI} combatUI - The combat UI instance for visual feedback
   * @param {Object} [options={}] - Optional configuration
   * @param {boolean} [options.enableLogging=true] - Enable detailed console logging
   * @param {boolean} [options.strictValidation=true] - Enable strict rule validation
   */
  constructor(gameState, combatUI, options = {}) {
    // Validate required dependencies
    if (!gameState || !gameState.territories) {
      throw new Error(
        "CombatManager: Valid gameState with territories required"
      );
    }

    if (!combatUI) {
      console.warn(
        "CombatManager: No CombatUI provided, visual feedback disabled"
      );
    }

    // Core dependencies
    this.gameState = gameState;
    this.combatUI = combatUI;

    // Initialize combat subsystems
    this.combatSystem = new CombatSystem(gameState);
    this.validator = new CombatValidator();
    this.directCombat = new DirectCombat();

    // Configuration
    this.config = {
      enableLogging: options.enableLogging !== false,
      strictValidation: options.strictValidation !== false,
      ...options,
    };

    // Combat state tracking
    this.currentBattle = null;
    this.battleHistory = [];
    this.combatStatistics = {
      totalBattles: 0,
      totalConquests: 0,
      totalArmiesLost: { attacker: 0, defender: 0 },
    };
    
    // Player-specific combat tracking for dashboard
    this.playerCombatStats = {}; // { playerName: { unitsLost: 0, unitsKilled: 0 } }

    // Official Risk Rules Constants
    this.RULES = {
      MIN_ATTACKING_ARMIES: 2, // Need 2+ to attack (1 must stay)
      MIN_ARMIES_TO_LEAVE: 1, // Must leave 1 in attacking territory
      MIN_DEFENDING_ARMIES: 1, // Defender needs at least 1 army
      MIN_CONQUEST_TRANSFER: 1, // Must move at least 1 army after conquest
      // Removed: MAX_ATTACKER_DICE and MAX_DEFENDER_DICE (not needed for user input system)
    };

    this._log("🎮 CombatManager initialized", {
      enableLogging: this.config.enableLogging,
      strictValidation: this.config.strictValidation,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBAT INITIATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initiate combat between two territories
   *
   * Validates the attack according to official Risk rules and initializes
   * combat state if valid. This is the primary entry point for starting combat.
   *
   * @param {string} attackingTerritoryId - ID of the attacking territory
   * @param {string} defendingTerritoryId - ID of the defending territory
   * @returns {Object} Result object
   * @returns {boolean} result.success - Whether combat was initiated successfully
   * @returns {Object} [result.combatState] - Current combat state if successful
   * @returns {string} [result.error] - Error message if unsuccessful
   * @returns {Object} [result.validation] - Detailed validation results
   *
   * @example
   * const result = combatManager.initiateCombat('alaska', 'kamchatka');
   * if (result.success) {
   *   console.log('Combat initiated between', result.combatState.attacker.name,
   *               'and', result.combatState.defender.name);
   * } else {
   *   console.error('Cannot attack:', result.error);
   * }
   */
  initiateCombat(attackingTerritoryId, defendingTerritoryId) {
    this._log("⚔️ Initiating combat", {
      attacker: attackingTerritoryId,
      defender: defendingTerritoryId,
    });

    try {
      // Validate attack is legal
      const validation = this.validateAttack(
        attackingTerritoryId,
        defendingTerritoryId
      );

      if (!validation.valid) {
        this._log("❌ Attack validation failed", validation);
        return {
          success: false,
          error: validation.reason,
          validation: validation,
        };
      }

      // Get territory data
      const attacker = this.gameState.territories[attackingTerritoryId];
      const defender = this.gameState.territories[defendingTerritoryId];

      // Start combat in combat system
      const combatResult = this.combatSystem.startCombat(
        attackingTerritoryId,
        defendingTerritoryId
      );

      if (!combatResult.success) {
        return {
          success: false,
          error: combatResult.error,
        };
      }

      // Initialize battle tracking
      this.currentBattle = {
        id: this._generateBattleId(),
        attackingTerritory: attackingTerritoryId,
        defendingTerritory: defendingTerritoryId,
        attackerOwner: attacker.owner,
        defenderOwner: defender.owner,
        initialAttackerArmies: attacker.armies,
        initialDefenderArmies: defender.armies,
        currentAttackerArmies: attacker.armies,
        currentDefenderArmies: defender.armies,
        rounds: [],
        startTime: Date.now(),
        status: "active",
      };

      // Update UI if available
      if (this.combatUI) {
        this.combatUI.startAttack(attackingTerritoryId, defendingTerritoryId);
      }

      this.combatStatistics.totalBattles++;

      this._log("✅ Combat initiated successfully", {
        battleId: this.currentBattle.id,
        attacker: { id: attackingTerritoryId, armies: attacker.armies },
        defender: { id: defendingTerritoryId, armies: defender.armies },
      });

      return {
        success: true,
        combatState: this.getCurrentCombatState(),
        battleId: this.currentBattle.id,
      };
    } catch (error) {
      this._log("❌ Error initiating combat", error);
      return {
        success: false,
        error: `Failed to initiate combat: ${error.message}`,
      };
    }
  }

  /**
   * Validate if an attack is legal according to Risk rules
   *
   * Performs comprehensive validation including:
   * - Territory existence
   * - Ownership rules
   * - Army count requirements
   * - Adjacency rules
   *
   * @param {string} attackingTerritoryId - ID of attacking territory
   * @param {string} defendingTerritoryId - ID of defending territory
   * @returns {Object} Validation result
   * @returns {boolean} result.valid - Whether attack is valid
   * @returns {string} [result.reason] - Reason if invalid
   * @returns {Object} [result.details] - Additional validation details
   *
   * @example
   * const validation = combatManager.validateAttack('alaska', 'kamchatka');
   * if (!validation.valid) {
   *   alert('Cannot attack: ' + validation.reason);
   * }
   */
  validateAttack(attackingTerritoryId, defendingTerritoryId) {
    // Check territory existence
    const attacker = this.gameState.territories[attackingTerritoryId];
    const defender = this.gameState.territories[defendingTerritoryId];

    if (!attacker) {
      return {
        valid: false,
        reason: `Attacking territory '${attackingTerritoryId}' does not exist`,
        code: "ATTACKER_NOT_FOUND",
      };
    }

    if (!defender) {
      return {
        valid: false,
        reason: `Defending territory '${defendingTerritoryId}' does not exist`,
        code: "DEFENDER_NOT_FOUND",
      };
    }

    // Check army requirements
    if (attacker.armies < this.RULES.MIN_ATTACKING_ARMIES) {
      return {
        valid: false,
        reason: `Attacking territory must have at least ${this.RULES.MIN_ATTACKING_ARMIES} armies (has ${attacker.armies})`,
        code: "INSUFFICIENT_ARMIES",
        details: {
          required: this.RULES.MIN_ATTACKING_ARMIES,
          actual: attacker.armies,
        },
      };
    }

    // Check ownership
    if (attacker.owner === defender.owner) {
      return {
        valid: false,
        reason: "Cannot attack your own territory",
        code: "SAME_OWNER",
      };
    }

    // Check adjacency
    if (
      !attacker.neighbors ||
      !attacker.neighbors.includes(defendingTerritoryId)
    ) {
      return {
        valid: false,
        reason: "Territories are not adjacent",
        code: "NOT_ADJACENT",
        details: {
          attackerNeighbors: attacker.neighbors || [],
        },
      };
    }

    // All validations passed
    return {
      valid: true,
      details: {
        attackerArmies: attacker.armies,
        defenderArmies: defender.armies,
        attackerOwner: attacker.owner,
        defenderOwner: defender.owner,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATTLE PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Process a battle round with user-specified outcome
   *
   * This is the core method for battle resolution. User specifies the remaining
   * armies after battle, and the system validates and applies the result.
   *
   * @param {Object} battleInput - User's battle outcome specification
   * @param {number} battleInput.attackerRemaining - Attacker armies after battle
   * @param {number} battleInput.defenderRemaining - Defender armies after battle
   * @returns {Object} Battle result
   * @returns {boolean} result.success - Whether battle was processed successfully
   * @returns {number} result.attackerLosses - Armies lost by attacker
   * @returns {number} result.defenderLosses - Armies lost by defender
   * @returns {boolean} result.isConquest - Whether defender was eliminated
   * @returns {boolean} result.canContinue - Whether attacker can continue attacking
   * @returns {Object} result.afterState - Territory states after battle
   * @returns {string} [result.error] - Error message if unsuccessful
   *
   * @example
   * // Attacker starts with 5 armies, defender with 3
   * const result = combatManager.processBattle({
   *   attackerRemaining: 4,  // Lost 1 army
   *   defenderRemaining: 2   // Lost 1 army
   * });
   *
   * if (result.isConquest) {
   *   console.log('Territory conquered!');
   * } else if (result.canContinue) {
   *   console.log('Battle can continue');
   * }
   */
  processBattle(battleInput) {
    this._log("🎲 Processing battle round", battleInput);

    try {
      // Validate we have an active combat
      if (!this.currentBattle || this.currentBattle.status !== "active") {
        return {
          success: false,
          error: "No active combat to process",
        };
      }

      // Get current territory states
      const attacker =
        this.gameState.territories[this.currentBattle.attackingTerritory];
      const defender =
        this.gameState.territories[this.currentBattle.defendingTerritory];

      const attackerStart = attacker.armies;
      const defenderStart = defender.armies;
      const { attackerRemaining, defenderRemaining } = battleInput;

      // Validate battle result using CombatValidator
      const validation = this.validator.validateBattleResult(
        attackerStart,
        defenderStart,
        attackerRemaining,
        defenderRemaining
      );

      if (!validation.valid) {
        this._log("❌ Battle validation failed", validation.errors);
        return {
          success: false,
          error: "Invalid battle result: " + validation.errors.join(", "),
          validationErrors: validation.errors,
        };
      }

      // Calculate losses
      const attackerLosses = attackerStart - attackerRemaining;
      const defenderLosses = defenderStart - defenderRemaining;

      // Update territory army counts
      attacker.armies = attackerRemaining;
      defender.armies = defenderRemaining;

      // Determine battle outcome
      const isConquest = defenderRemaining === 0;
      const canContinue =
        !isConquest && attackerRemaining > this.RULES.MIN_ARMIES_TO_LEAVE;

      // Record battle round
      const roundData = {
        roundNumber: this.currentBattle.rounds.length + 1,
        attackerStart,
        defenderStart,
        attackerRemaining,
        defenderRemaining,
        attackerLosses,
        defenderLosses,
        isConquest,
        timestamp: Date.now(),
      };

      this.currentBattle.rounds.push(roundData);
      this.currentBattle.currentAttackerArmies = attackerRemaining;
      this.currentBattle.currentDefenderArmies = defenderRemaining;

      // Update statistics
      this.combatStatistics.totalArmiesLost.attacker += attackerLosses;
      this.combatStatistics.totalArmiesLost.defender += defenderLosses;
      
      // Track player-specific combat stats
      const attackerPlayer = attacker.owner;
      const defenderPlayer = defender.owner;
      
      // Initialize player stats if not exists
      if (!this.playerCombatStats[attackerPlayer]) {
        this.playerCombatStats[attackerPlayer] = { unitsLost: 0, unitsKilled: 0 };
      }
      if (!this.playerCombatStats[defenderPlayer]) {
        this.playerCombatStats[defenderPlayer] = { unitsLost: 0, unitsKilled: 0 };
      }
      
      // Update attacker stats: their losses and their kills (defender's losses)
      this.playerCombatStats[attackerPlayer].unitsLost += attackerLosses;
      this.playerCombatStats[attackerPlayer].unitsKilled += defenderLosses;
      
      // Update defender stats: their losses and their kills (attacker's losses)
      this.playerCombatStats[defenderPlayer].unitsLost += defenderLosses;
      this.playerCombatStats[defenderPlayer].unitsKilled += attackerLosses;
      
      // Broadcast to dashboard
      this._broadcastCombatStats();

      if (isConquest) {
        this.currentBattle.status = "conquest";
        this.combatStatistics.totalConquests++;
        this._log("🏆 Territory conquered!");
      }

      // Build result object
      const result = {
        success: true,
        roundNumber: roundData.roundNumber,
        attackerLosses,
        defenderLosses,
        isConquest,
        canContinue,
        afterState: {
          attacker: {
            id: this.currentBattle.attackingTerritory,
            armies: attackerRemaining,
            owner: attacker.owner,
          },
          defender: {
            id: this.currentBattle.defendingTerritory,
            armies: defenderRemaining,
            owner: defender.owner,
          },
        },
        battleStatus: this.currentBattle.status,
      };

      this._log("✅ Battle round processed", result);

      // Update UI if available
      if (this.combatUI) {
        this.combatUI.showBattleResults({
          attackingTerritory: this.currentBattle.attackingTerritory,
          defendingTerritory: this.currentBattle.defendingTerritory,
          attackerStartingArmies: attackerStart,
          defenderStartingArmies: defenderStart,
          attackerRemainingArmies: attackerRemaining,
          defenderRemainingArmies: defenderRemaining,
          attackerLosses,
          defenderLosses,
          isConquest,
          conquered: isConquest,
        });
      }

      return result;
    } catch (error) {
      this._log("❌ Error processing battle", error);
      return {
        success: false,
        error: `Failed to process battle: ${error.message}`,
      };
    }
  }

  /**
   * Present battle options to the user
   *
   * Generates valid battle outcome options based on current army counts.
   * Useful for providing suggestions or constraints to the user interface.
   *
   * @returns {Object} Battle options
   * @returns {Object} result.currentState - Current battle state
   * @returns {Object} result.constraints - Valid ranges for outcomes
   * @returns {Array} result.suggestions - Suggested battle outcomes
   *
   * @example
   * const options = combatManager.getBattleOptions();
   * console.log('Attacker can have:', options.constraints.attackerRemaining);
   * // Display suggestions to user
   * options.suggestions.forEach(suggestion => {
   *   console.log(suggestion.description);
   * });
   */
  getBattleOptions() {
    if (!this.currentBattle || this.currentBattle.status !== "active") {
      return {
        error: "No active combat",
      };
    }

    const attacker =
      this.gameState.territories[this.currentBattle.attackingTerritory];
    const defender =
      this.gameState.territories[this.currentBattle.defendingTerritory];

    // Calculate valid ranges
    const constraints = {
      attackerRemaining: {
        min: this.RULES.MIN_ARMIES_TO_LEAVE,
        max: attacker.armies,
      },
      defenderRemaining: {
        min: 0, // Can be conquered
        max: defender.armies,
      },
    };

    // Generate suggested outcomes
    const suggestions = this._generateBattleSuggestions(
      attacker.armies,
      defender.armies
    );

    return {
      currentState: {
        attackerArmies: attacker.armies,
        defenderArmies: defender.armies,
        attackerTerritory: this.currentBattle.attackingTerritory,
        defenderTerritory: this.currentBattle.defendingTerritory,
      },
      constraints,
      suggestions,
    };
  }

  /**
   * Generate suggested battle outcomes
   * @private
   */
  _generateBattleSuggestions(attackerArmies, defenderArmies) {
    const suggestions = [];

    // Conquest outcome
    if (attackerArmies > 1) {
      suggestions.push({
        id: "conquest",
        description: "Conquer territory (defender eliminated)",
        attackerRemaining: attackerArmies - 1,
        defenderRemaining: 0,
        attackerLosses: 1,
        defenderLosses: defenderArmies,
        probability: "High casualties for defender",
      });
    }

    // Balanced outcome
    suggestions.push({
      id: "balanced",
      description: "Balanced battle (both sides lose armies)",
      attackerRemaining: Math.max(1, attackerArmies - 1),
      defenderRemaining: Math.max(0, defenderArmies - 1),
      attackerLosses: Math.min(1, attackerArmies - 1),
      defenderLosses: Math.min(1, defenderArmies),
      probability: "Even battle",
    });

    // Attacker advantage
    if (defenderArmies > 1) {
      suggestions.push({
        id: "attacker-wins",
        description: "Attacker advantage (defender loses more)",
        attackerRemaining: attackerArmies,
        defenderRemaining: defenderArmies - 2,
        attackerLosses: 0,
        defenderLosses: 2,
        probability: "Favorable for attacker",
      });
    }

    // Defender advantage
    if (attackerArmies > 2) {
      suggestions.push({
        id: "defender-wins",
        description: "Defender advantage (attacker loses more)",
        attackerRemaining: attackerArmies - 2,
        defenderRemaining: defenderArmies,
        attackerLosses: 2,
        defenderLosses: 0,
        probability: "Favorable for defender",
      });
    }

    return suggestions;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONQUEST HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Complete conquest by moving armies to conquered territory
   *
   * After a successful conquest (defender eliminated), the attacker must move
   * armies into the conquered territory. This method validates and processes
   * the army transfer.
   *
   * @param {number} armiesToMove - Number of armies to move (must be >= 1)
   * @returns {Object} Conquest result
   * @returns {boolean} result.success - Whether conquest was completed
   * @returns {Object} [result.conquestState] - Final state after conquest
   * @returns {string} [result.error] - Error message if unsuccessful
   *
   * @example
   * // After conquest, move 3 armies into conquered territory
   * const result = combatManager.completeConquest(3);
   * if (result.success) {
   *   console.log('Conquest complete!', result.conquestState);
   * }
   */
  completeConquest(armiesToMove) {
    this._log("🏆 Completing conquest", { armiesToMove });

    try {
      // Validate we have a conquest to complete
      if (!this.currentBattle || this.currentBattle.status !== "conquest") {
        return {
          success: false,
          error: "No conquest to complete",
        };
      }

      const attacker =
        this.gameState.territories[this.currentBattle.attackingTerritory];
      const defender =
        this.gameState.territories[this.currentBattle.defendingTerritory];

      // Validate army transfer
      const validation = this._validateConquestTransfer(
        attacker.armies,
        armiesToMove
      );

      if (!validation.valid) {
        return {
          success: false,
          error: validation.reason,
        };
      }

      // Transfer ownership
      const previousOwner = defender.owner;
      defender.owner = attacker.owner;

      // Move armies
      attacker.armies -= armiesToMove;
      defender.armies = armiesToMove;

      // Update battle record
      this.currentBattle.status = "completed";
      this.currentBattle.conquestArmiesTransferred = armiesToMove;
      this.currentBattle.endTime = Date.now();
      this.currentBattle.duration =
        this.currentBattle.endTime - this.currentBattle.startTime;

      // Add to history
      this.battleHistory.push({ ...this.currentBattle });

      const conquestState = {
        conqueror: attacker.owner,
        previousOwner,
        conqueredTerritory: this.currentBattle.defendingTerritory,
        attackingTerritory: this.currentBattle.attackingTerritory,
        armiesTransferred: armiesToMove,
        finalStates: {
          attacker: {
            id: this.currentBattle.attackingTerritory,
            armies: attacker.armies,
            owner: attacker.owner,
          },
          conquered: {
            id: this.currentBattle.defendingTerritory,
            armies: defender.armies,
            owner: defender.owner,
          },
        },
      };

      this._log("✅ Conquest completed", conquestState);

      // Clear current battle
      this.currentBattle = null;

      // Update UI if available
      if (this.combatUI && typeof this.combatUI.endAttack === "function") {
        this.combatUI.endAttack();
      }

      return {
        success: true,
        conquestState,
      };
    } catch (error) {
      this._log("❌ Error completing conquest", error);
      return {
        success: false,
        error: `Failed to complete conquest: ${error.message}`,
      };
    }
  }

  /**
   * Validate conquest army transfer
   * @private
   */
  _validateConquestTransfer(attackerArmies, armiesToMove) {
    // Must move at least minimum
    if (armiesToMove < this.RULES.MIN_CONQUEST_TRANSFER) {
      return {
        valid: false,
        reason: `Must move at least ${this.RULES.MIN_CONQUEST_TRANSFER} army to conquered territory`,
      };
    }

    // Cannot move more than available (minus 1 that must stay)
    const maxTransfer = attackerArmies - this.RULES.MIN_ARMIES_TO_LEAVE;
    if (armiesToMove > maxTransfer) {
      return {
        valid: false,
        reason: `Can only move ${maxTransfer} armies (must leave 1 behind)`,
        maxTransfer,
      };
    }

    // Must be a positive integer
    if (!Number.isInteger(armiesToMove) || armiesToMove < 1) {
      return {
        valid: false,
        reason: "Army transfer must be a positive integer",
      };
    }

    return { valid: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMBAT CONTROL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * End the current combat
   *
   * Terminates active combat without conquest. Used when attacker chooses
   * to stop attacking before defender is eliminated.
   *
   * @returns {Object} End combat result
   * @returns {boolean} result.success - Whether combat was ended successfully
   * @returns {Object} [result.finalState] - Final battle state
   *
   * @example
   * // Stop attacking
   * const result = combatManager.endCombat();
   * console.log('Combat ended after', result.finalState.rounds, 'rounds');
   */
  endCombat() {
    this._log("🛑 Ending combat");

    if (!this.currentBattle) {
      return {
        success: false,
        error: "No active combat to end",
      };
    }

    try {
      // Update battle record
      this.currentBattle.status = "ended";
      this.currentBattle.endTime = Date.now();
      this.currentBattle.duration =
        this.currentBattle.endTime - this.currentBattle.startTime;

      // Add to history
      this.battleHistory.push({ ...this.currentBattle });

      const finalState = {
        battleId: this.currentBattle.id,
        rounds: this.currentBattle.rounds.length,
        totalAttackerLosses:
          this.currentBattle.initialAttackerArmies -
          this.currentBattle.currentAttackerArmies,
        totalDefenderLosses:
          this.currentBattle.initialDefenderArmies -
          this.currentBattle.currentDefenderArmies,
        duration: this.currentBattle.duration,
      };

      this._log("✅ Combat ended", finalState);

      // Clear current battle
      this.currentBattle = null;

      // End combat in combat system
      if (this.combatSystem) {
        this.combatSystem.endCombat();
      }

      // Update UI if available
      if (this.combatUI && typeof this.combatUI.endAttack === "function") {
        this.combatUI.endAttack();
      }

      return {
        success: true,
        finalState,
      };
    } catch (error) {
      this._log("❌ Error ending combat", error);
      return {
        success: false,
        error: `Failed to end combat: ${error.message}`,
      };
    }
  }

  /**
   * Get current combat state
   *
   * Returns detailed information about the ongoing combat.
   *
   * @returns {Object|null} Current combat state or null if no active combat
   *
   * @example
   * const state = combatManager.getCurrentCombatState();
   * if (state) {
   *   console.log('Battle round:', state.rounds.length);
   *   console.log('Attacker armies:', state.currentAttackerArmies);
   * }
   */
  getCurrentCombatState() {
    if (!this.currentBattle) {
      return null;
    }

    const attacker =
      this.gameState.territories[this.currentBattle.attackingTerritory];
    const defender =
      this.gameState.territories[this.currentBattle.defendingTerritory];

    return {
      battleId: this.currentBattle.id,
      status: this.currentBattle.status,
      attacker: {
        id: this.currentBattle.attackingTerritory,
        name: attacker.name,
        owner: attacker.owner,
        initialArmies: this.currentBattle.initialAttackerArmies,
        currentArmies: attacker.armies,
      },
      defender: {
        id: this.currentBattle.defendingTerritory,
        name: defender.name,
        owner: defender.owner,
        initialArmies: this.currentBattle.initialDefenderArmies,
        currentArmies: defender.armies,
      },
      rounds: this.currentBattle.rounds.length,
      canContinue:
        attacker.armies > this.RULES.MIN_ARMIES_TO_LEAVE && defender.armies > 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get all territories that can be attacked from a given territory
   *
   * @param {string} territoryId - ID of the territory to attack from
   * @returns {Array<Object>} Array of attackable territories with details
   *
   * @example
   * const targets = combatManager.getAttackableTargets('alaska');
   * targets.forEach(target => {
   *   console.log(`Can attack ${target.name} (${target.armies} armies)`);
   * });
   */
  getAttackableTargets(territoryId) {
    const territory = this.gameState.territories[territoryId];

    if (!territory) {
      return [];
    }

    if (territory.armies < this.RULES.MIN_ATTACKING_ARMIES) {
      return [];
    }

    const targets = [];

    if (territory.neighbors) {
      territory.neighbors.forEach((neighborId) => {
        const neighbor = this.gameState.territories[neighborId];
        if (neighbor && neighbor.owner !== territory.owner) {
          targets.push({
            id: neighborId,
            name: neighbor.name,
            armies: neighbor.armies,
            owner: neighbor.owner,
          });
        }
      });
    }

    return targets;
  }

  /**
   * Get combat statistics
   *
   * @returns {Object} Combat statistics including battles, conquests, and losses
   *
   * @example
   * const stats = combatManager.getStatistics();
   * console.log(`Total battles: ${stats.totalBattles}`);
   * console.log(`Conquest rate: ${stats.conquestRate}%`);
   */
  getStatistics() {
    const conquestRate =
      this.combatStatistics.totalBattles > 0
        ? (
            (this.combatStatistics.totalConquests /
              this.combatStatistics.totalBattles) *
            100
          ).toFixed(1)
        : 0;

    return {
      ...this.combatStatistics,
      conquestRate: parseFloat(conquestRate),
      averageDuration: this._calculateAverageBattleDuration(),
      battleHistory: this.battleHistory.length,
    };
  }

  /**
   * Get battle history
   *
   * @param {number} [limit] - Maximum number of battles to return
   * @returns {Array<Object>} Array of completed battles
   */
  getBattleHistory(limit) {
    const history = [...this.battleHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Check if combat is currently active
   *
   * @returns {boolean} True if combat is active
   */
  isCombatActive() {
    return (
      this.currentBattle !== null && this.currentBattle.status === "active"
    );
  }

  /**
   * Check if there is a pending conquest
   *
   * @returns {boolean} True if conquest is pending
   */
  isConquestPending() {
    return (
      this.currentBattle !== null && this.currentBattle.status === "conquest"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Reset combat manager state
   *
   * Clears all combat state and statistics. Use with caution.
   */
  reset() {
    this._log("🔄 Resetting combat manager");

    this.currentBattle = null;
    this.battleHistory = [];
    this.combatStatistics = {
      totalBattles: 0,
      totalConquests: 0,
      totalArmiesLost: { attacker: 0, defender: 0 },
    };

    if (this.combatSystem) {
      this.combatSystem.endCombat();
    }
  }

  /**
   * Generate unique battle ID
   * @private
   */
  _generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate average battle duration
   * @private
   */
  _calculateAverageBattleDuration() {
    if (this.battleHistory.length === 0) {
      return 0;
    }

    const totalDuration = this.battleHistory.reduce((sum, battle) => {
      return sum + (battle.duration || 0);
    }, 0);

    return Math.round(totalDuration / this.battleHistory.length);
  }

  /**
   * Get combat statistics for a specific player
   * Used by dashboard to display kills and deaths
   * 
   * @param {string} playerName - Name of the player
   * @returns {Object} Player's combat stats { unitsLost, unitsKilled }
   */
  getPlayerCombatStats(playerName) {
    if (!this.playerCombatStats[playerName]) {
      return { unitsLost: 0, unitsKilled: 0 };
    }
    return { ...this.playerCombatStats[playerName] };
  }

  /**
   * Get all players' combat statistics
   * Returns object mapping player names to their combat stats
   * 
   * @returns {Object} All players' combat stats
   */
  getAllPlayerCombatStats() {
    return { ...this.playerCombatStats };
  }

  /**
   * Reset combat statistics for a specific player
   * 
   * @param {string} playerName - Name of the player
   */
  resetPlayerCombatStats(playerName) {
    if (this.playerCombatStats[playerName]) {
      this.playerCombatStats[playerName] = { unitsLost: 0, unitsKilled: 0 };
    }
  }

  /**
   * Reset all combat statistics
   */
  resetAllCombatStats() {
    this.playerCombatStats = {};
    this.combatStatistics = {
      totalBattles: 0,
      totalConquests: 0,
      totalArmiesLost: { attacker: 0, defender: 0 },
    };
    this._log("📊 Combat statistics reset");
  }

  /**
   * Broadcast combat statistics to dashboard
   * Triggers dashboard update with current player combat stats
   * 
   * @private
   */
  _broadcastCombatStats() {
    // Update StatisticsManager if available
    if (window.statisticsManager && typeof window.statisticsManager.updateCombatStats === 'function') {
      window.statisticsManager.updateCombatStats(this.playerCombatStats);
    }
    
    // Trigger dashboard update if function exists
    if (window.updateDashboardData && typeof window.updateDashboardData === 'function') {
      window.updateDashboardData();
    }
    
    // Broadcast via custom event for dashboard
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('combatStatsUpdated', {
        detail: {
          playerCombatStats: this.playerCombatStats,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    }
    
    this._log("📡 Combat stats broadcasted to dashboard", this.playerCombatStats);
  }

  /**
   * Internal logging method
   * @private
   */
  _log(message, data) {
    if (this.config.enableLogging) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL EXPORT
// ═══════════════════════════════════════════════════════════════════════════

// Make available globally for browser environments
if (typeof window !== "undefined") {
  window.CombatManager = CombatManager;
}

// Export for module environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = CombatManager;
}
