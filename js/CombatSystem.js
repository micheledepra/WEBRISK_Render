/**
 * RISK COMBAT SYSTEM ARCHITECTURE
 *
 * CLEAN, UNIFIED COMBAT SYSTEM FOR RISK GAME
 * Modified to use direct army input instead of dice rolling
 */

/**
 * Core Combat System - Single Source of Truth
 * Handles all attack logic, direct army input, and combat resolution
 */
class CombatSystem {
  constructor(gameState) {
    this.gameState = gameState;
    this.currentCombat = null;
    this.directCombat = new DirectCombat(); // Use direct army input system

    // Core Rules Constants
    this.RULES = {
      MIN_ATTACKING_ARMIES: 2, // Need 2+ armies to attack (1 must stay)
      MIN_ARMIES_TO_LEAVE: 1, // Must leave 1 army in attacking territory
    };
  }

  /**
   * Complete conquest by moving armies
   * @param {number} armiesToMove - Armies to move to conquered territory
   * @returns {object} - Transfer result
   */
  completeConquest(armiesToMove) {
    try {
      // Validate we have an active combat with a conquest
      if (!this.currentCombat) {
        console.warn(
          "⚠️ CombatSystem: No current combat instance for conquest"
        );

        // RECOVERY: Try to use window.transferState as fallback
        if (
          window.transferState &&
          window.transferState.sourceTerritory &&
          window.transferState.destinationTerritory
        ) {
          console.log("🔄 Using transferState as fallback for conquest");

          const sourceId = window.transferState.sourceTerritory;
          const destId = window.transferState.destinationTerritory;

          // Create temporary combat instance for this transfer
          const tempCombat = new CombatInstance(
            this.gameState,
            sourceId,
            destId,
            this.RULES,
            this.directCombat
          );

          // Force conquest state
          tempCombat.setConquered(true);

          // Use this temporary combat to complete the conquest
          this.currentCombat = tempCombat;
          const result = tempCombat.completeConquest(armiesToMove);

          // Clean up
          this.currentCombat = null;

          return result;
        }

        return { success: false, error: "No conquest to complete" };
      }

      // Validate conquest state
      if (typeof this.currentCombat.isConquered !== "function") {
        console.warn(
          "⚠️ CombatSystem: Invalid combat instance (missing isConquered method)"
        );
        return { success: false, error: "Invalid combat instance" };
      }

      const isConquered = this.currentCombat.isConquered();
      if (!isConquered) {
        console.warn("⚠️ CombatSystem: Territory not conquered");
        return { success: false, error: "No conquest to complete" };
      }

      // Validate army count is a number
      if (isNaN(armiesToMove) || armiesToMove === null) {
        console.warn(
          "⚠️ CombatSystem: Invalid army count for transfer, using 1"
        );
        armiesToMove = 1;
      }

      // Proceed with conquest completion
      console.log(
        "✅ CombatSystem: Completing conquest with",
        armiesToMove,
        "armies"
      );
      return this.currentCombat.completeConquest(armiesToMove);
    } catch (error) {
      console.error("❌ CombatSystem: Error completing conquest:", error);
      return {
        success: false,
        error: "Error completing conquest: " + error.message,
      };
    }
  }

  /**
   * Alias for getAttackableTerritoriesFrom - this name is used in some parts of the code
   * @param {string} territoryId - Territory to check from
   * @returns {array} - List of attackable territories
   */
  getPossibleAttackTargets(territoryId) {
    return this.getAttackableTerritoriesFrom(territoryId);
  }

  /**
   * Start a new combat instance
   * @param {string} attackingTerritoryId - Attacking territory
   * @param {string} defendingTerritoryId - Defending territory
   * @returns {object} - Combat instance or error
   */
  initiateCombat(attackingTerritoryId, defendingTerritoryId) {
    // Validate attack
    const validation = this.validateAttack(
      attackingTerritoryId,
      defendingTerritoryId
    );
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    // Create combat instance
    this.currentCombat = new CombatInstance(
      this.gameState,
      attackingTerritoryId,
      defendingTerritoryId,
      this.RULES,
      this.directCombat
    );

    return {
      success: true,
      combat: this.currentCombat.getState(),
    };
  }

  /**
   * Start combat between two territories (alias for initiateCombat for API consistency)
   * @param {string} attackingTerritoryId - Attacking territory
   * @param {string} defendingTerritoryId - Defending territory
   * @returns {object} - Combat instance or error
   */
  startCombat(attackingTerritoryId, defendingTerritoryId) {
    return this.initiateCombat(attackingTerritoryId, defendingTerritoryId);
  }

  /**
   * Validate if an attack is valid
   * @param {string} attackingTerritoryId - Territory initiating attack
   * @param {string} defendingTerritoryId - Target territory
   * @returns {object} - {valid: boolean, reason: string}
   */
  validateAttack(attackingTerritoryId, defendingTerritoryId) {
    // Check if territories exist
    const attackingTerritory = this.gameState.territories[attackingTerritoryId];
    const defendingTerritory = this.gameState.territories[defendingTerritoryId];

    if (!attackingTerritory) {
      return { valid: false, reason: "Attacking territory does not exist" };
    }

    if (!defendingTerritory) {
      return { valid: false, reason: "Defending territory does not exist" };
    }

    // Check if attacker has enough armies
    if (attackingTerritory.armies < this.RULES.MIN_ATTACKING_ARMIES) {
      return {
        valid: false,
        reason: `Attacking territory must have at least ${this.RULES.MIN_ATTACKING_ARMIES} armies`,
      };
    }

    // Check if defender is a neighbor
    if (
      !attackingTerritory.neighbors ||
      !attackingTerritory.neighbors.includes(defendingTerritoryId)
    ) {
      return { valid: false, reason: "Territories are not adjacent" };
    }

    // Check if territories have different owners
    if (attackingTerritory.owner === defendingTerritory.owner) {
      return { valid: false, reason: "Cannot attack your own territory" };
    }

    return { valid: true };
  }

  /**
   * Validate if a territory can attack (i.e., is a valid attacker)
   * @param {string} territoryId - Territory to validate
   * @returns {object} - {valid: boolean, reason: string}
   */
  validateAttacker(territoryId) {
    // Get the territory object
    const territory = this.gameState.territories[territoryId];

    // Check if territory exists
    if (!territory) {
      return { valid: false, reason: "Territory does not exist" };
    }

    // Check if territory belongs to current player
    if (territory.owner !== this.gameState.getCurrentPlayer()) {
      return {
        valid: false,
        reason: "You can only attack from your own territories",
      };
    }

    // Check if territory has enough armies
    if (territory.armies < this.RULES.MIN_ATTACKING_ARMIES) {
      return {
        valid: false,
        reason: `Territory must have at least ${this.RULES.MIN_ATTACKING_ARMIES} armies to attack`,
      };
    }

    // Check if territory has any valid targets
    const possibleTargets = this.getAttackableTerritoriesFrom(territoryId);
    if (!possibleTargets || possibleTargets.length === 0) {
      return {
        valid: false,
        reason: "No valid attack targets from this territory",
      };
    }

    return { valid: true };
  }

  /**
   * Get a list of territories that can be attacked from the given territory
   * @param {string} territoryId - Source territory
   * @returns {array} - List of attackable territory IDs
   */
  getAttackableTerritoriesFrom(territoryId) {
    // Get the territory object
    const territory = this.gameState.territories[territoryId];

    // Validate territory can attack
    if (!territory || territory.armies <= 1 || !territory.neighbors) {
      return [];
    }

    // Filter neighbors to only include those with different owners
    return territory.neighbors.filter((neighbor) => {
      const neighborTerritory = this.gameState.territories[neighbor];
      return neighborTerritory && neighborTerritory.owner !== territory.owner;
    });
  }

  /**
   * Process combat with direct army inputs
   * @param {number} attackerRemaining - Attacker armies after battle
   * @param {number} defenderRemaining - Defender armies after battle
   * @returns {object} - Combat result
   */
  processDirectCombat(attackerRemaining, defenderRemaining) {
    // Validate we have an active combat
    if (!this.currentCombat) {
      return { success: false, error: "No active combat" };
    }

    return this.currentCombat.processCombat(
      attackerRemaining,
      defenderRemaining
    );
  }

  /**
   * End the current combat
   * @returns {object} - Result with success flag
   */
  endCombat() {
    // Clean up combat state
    const result = { success: true };

    if (this.currentCombat) {
      result.wasConquered = this.currentCombat.isConquered();
      this.currentCombat = null;
    }

    return result;
  }

  /**
   * Check if combat requires conquest completion
   * @returns {boolean} - True if conquest is needed
   */
  requiresConquest() {
    // Check direct combat instance
    if (
      this.currentCombat &&
      typeof this.currentCombat.isConquered === "function"
    ) {
      return this.currentCombat.isConquered();
    }

    // Fallback: Check window.transferState for conquest in progress
    if (
      window.transferState &&
      window.transferState.sourceTerritory &&
      window.transferState.destinationTerritory
    ) {
      return true;
    }

    return false;
  }

  /**
   * Get current combat state
   * @returns {object|null} - Combat state or null
   */
  getCurrentCombat() {
    return this.currentCombat ? this.currentCombat.getState() : null;
  }
}

/**
 * Combat instance representing a single battle between territories
 */
class CombatInstance {
  constructor(
    gameState,
    attackingTerritoryId,
    defendingTerritoryId,
    rules,
    directCombat
  ) {
    this.gameState = gameState;
    this.attackingTerritoryId = attackingTerritoryId;
    this.defendingTerritoryId = defendingTerritoryId;
    this.rules = rules;
    this.directCombat = directCombat;
    this.conquered = false;

    // Get territory info
    this.attackingTerritory = gameState.territories[attackingTerritoryId];
    this.defendingTerritory = gameState.territories[defendingTerritoryId];

    // Store initial armies
    this.initialAttackerArmies = this.attackingTerritory.armies;
    this.initialDefenderArmies = this.defendingTerritory.armies;

    // Track results
    this.attackerLosses = 0;
    this.defenderLosses = 0;
  }

  /**
   * Process a combat round with direct army inputs
   * @param {number} attackerRemaining - Attacker armies after battle
   * @param {number} defenderRemaining - Defender armies after battle
   * @returns {object} - Combat result
   */
  processCombat(attackerRemaining, defenderRemaining) {
    try {
      // Validate inputs
      const validation = this.directCombat.validateInputs(
        this.attackingTerritory.armies,
        this.defendingTerritory.armies,
        attackerRemaining,
        defenderRemaining
      );

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Get battle outcome
      let outcome;
      try {
        outcome = this.directCombat.determineBattleOutcome(
          this.attackingTerritory.armies,
          this.defendingTerritory.armies,
          attackerRemaining,
          defenderRemaining
        );
      } catch (error) {
        console.error("❌ Error determining battle outcome:", error);
        return {
          success: false,
          error: "Battle outcome error: " + error.message,
        };
      }

      if (!outcome || !outcome.success) {
        return {
          success: false,
          error: outcome?.error || "Invalid battle outcome",
        };
      }

      // Update territory armies
      this.attackingTerritory.armies = outcome.remainingAttackerArmies;
      this.defendingTerritory.armies = outcome.remainingDefenderArmies;

      // Track results
      this.attackerLosses += outcome.attackerLosses;
      this.defenderLosses += outcome.defenderLosses;

      // Check if territory was conquered
      this.conquered = outcome.territoryConquered;

      // Return result
      return {
        success: true,
        attackerRemaining: outcome.remainingAttackerArmies,
        defenderRemaining: outcome.remainingDefenderArmies,
        attackerLosses: this.attackerLosses,
        defenderLosses: this.defenderLosses,
        territoryConquered: this.conquered,
        battleComplete: outcome.battleComplete,
      };
    } catch (error) {
      console.error("Combat error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete conquest by moving armies
   * @param {number} armiesToMove - Number of armies to move
   * @returns {object} - Result of conquest
   */
  completeConquest(armiesToMove) {
    try {
      // Validate conquest is possible
      if (!this.conquered) {
        return { success: false, error: "Territory not conquered" };
      }

      // Validate armies to move
      if (isNaN(armiesToMove) || armiesToMove < 1) {
        return { success: false, error: "Invalid army count" };
      }

      // Validate attacker has enough armies
      if (this.attackingTerritory.armies <= armiesToMove) {
        return {
          success: false,
          error: `Must leave at least ${this.rules.MIN_ARMIES_TO_LEAVE} army in attacking territory`,
        };
      }

      // Transfer armies and ownership
      this.attackingTerritory.armies -= armiesToMove;
      this.defendingTerritory.armies = armiesToMove;
      const conquerer = this.attackingTerritory.owner;
      this.defendingTerritory.owner = conquerer;

      // ✅ CRITICAL: Update territory color immediately
      this.updateTerritoryColor(this.defendingTerritoryId, conquerer);
      
      console.log(`🎯 Conquest complete! ${this.defendingTerritoryId} now owned by ${conquerer}`);

      // Return success
      return {
        success: true,
        attackingTerritory: {
          id: this.attackingTerritoryId,
          armies: this.attackingTerritory.armies,
        },
        defendingTerritory: {
          id: this.defendingTerritoryId,
          armies: this.defendingTerritory.armies,
          owner: this.defendingTerritory.owner,
        },
      };
    } catch (error) {
      console.error("Conquest error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if territory was conquered
   * @returns {boolean} - True if conquered
   */
  isConquered() {
    return this.conquered;
  }

  /**
   * Force conquest state (for recovery purposes)
   * @param {boolean} state - New conquest state
   */
  setConquered(state) {
    this.conquered = !!state;
  }

  /**
   * Get attacking territory ID
   * @returns {string} - Territory ID
   */
  getAttackingTerritory() {
    return this.attackingTerritoryId;
  }

  /**
   * Get defending territory ID
   * @returns {string} - Territory ID
   */
  getDefendingTerritory() {
    return this.defendingTerritoryId;
  }

  /**
   * Get current combat state
   * @returns {object} - State information
   */
  getState() {
    return {
      attackingTerritory: this.attackingTerritoryId,
      defendingTerritory: this.defendingTerritoryId,
      attackerArmies: this.attackingTerritory.armies,
      defenderArmies: this.defendingTerritory.armies,
      initialAttackerArmies: this.initialAttackerArmies,
      initialDefenderArmies: this.initialDefenderArmies,
      attackerLosses: this.attackerLosses,
      defenderLosses: this.defenderLosses,
      conquered: this.conquered,
    };
  }

  /**
   * Update territory color after ownership change
   * @param {string} territoryId - Territory to update
   * @param {string} newOwner - New owner
   */
  updateTerritoryColor(territoryId, newOwner) {
    const playerColor = this.gameState.playerColors[newOwner];
    if (!playerColor) {
      console.warn(`No color found for player: ${newOwner}`);
      return;
    }
    
    // Use ColorManager's official dynamic opacity system
    if (window.riskUI && window.riskUI.colorManager) {
      if (typeof window.riskUI.colorManager.updateTerritoryColorWithOpacity === 'function') {
        window.riskUI.colorManager.updateTerritoryColorWithOpacity(territoryId, newOwner, this.gameState);
        console.log(`✅ CombatSystem: Updated ${territoryId} using dynamic opacity system`);
        return;
      } else if (typeof window.riskUI.colorManager.updateTerritoryColor === 'function') {
        window.riskUI.colorManager.updateTerritoryColor(territoryId, newOwner, this.gameState);
        console.log(`✅ CombatSystem: Updated ${territoryId} using ColorManager`);
        return;
      }
    }
    
    // FALLBACK: Direct DOM manipulation (should rarely be used)
    console.warn('⚠️ CombatSystem using fallback color update - ColorManager not available');
    const territoryElement = document.getElementById(territoryId);
    if (!territoryElement) {
      console.warn(`Territory element not found: ${territoryId}`);
      return;
    }
    
    // Calculate dynamic opacity (25% min, 90% max)
    const territory = this.gameState.territories[territoryId];
    const armies = territory ? territory.armies : 1;
    const maxArmies = Math.max(
      ...Object.values(this.gameState.territories).map(t => t.armies || 1),
      1
    );
    const opacity = maxArmies === 1 ? 0.25 : 
      0.25 + ((armies - 1) / (maxArmies - 1)) * 0.65;
    
    // Convert to RGBA
    const hex = playerColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    
    // Darker border
    const factor = 0.8;
    const toHex = (value) => Math.round(value * factor).toString(16).padStart(2, '0');
    const darkerBorder = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    
    territoryElement.style.fill = rgbaColor;
    territoryElement.style.stroke = darkerBorder;
    territoryElement.style.strokeWidth = '0.5';
    console.log(`✅ CombatSystem fallback: Updated ${territoryId} with ${(opacity * 100).toFixed(0)}% opacity`);
  }
}

// Create a global instance if window is available
if (typeof window !== "undefined") {
  window.CombatSystem = CombatSystem;
}
