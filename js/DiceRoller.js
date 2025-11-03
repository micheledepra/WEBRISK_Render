/**
 * Combat Validation Utilities
 *
 * This file provides validation utilities for the RISK combat system.
 * NOTE: This game uses USER INPUT for battle results, not dice rolling.
 * All dice rolling and automatic battle resolution has been removed.
 */
class CombatValidator {
  constructor() {
    // No dice-related constants needed - user input system only
  }

  /**
   * Validate army counts for combat
   * @param {number} attackerArmies - Attacker armies
   * @param {number} defenderArmies - Defender armies
   * @returns {object} - Validation result
   */
  validateArmiesForCombat(attackerArmies, defenderArmies) {
    const errors = [];

    if (attackerArmies < 2) {
      errors.push("Attacker must have at least 2 armies to attack");
    }

    if (defenderArmies < 1) {
      errors.push("Defender must have at least 1 army to defend");
    }

    if (
      !Number.isInteger(attackerArmies) ||
      !Number.isInteger(defenderArmies)
    ) {
      errors.push("Army counts must be whole numbers");
    }

    if (attackerArmies < 0 || defenderArmies < 0) {
      errors.push("Army counts cannot be negative");
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      // Removed: maxAttackerDice and maxDefenderDice (not needed for user input system)
    };
  }

  /**
   * Validate battle result input from user
   * @param {number} attackerStartArmies - Attacker armies before battle
   * @param {number} defenderStartArmies - Defender armies before battle
   * @param {number} attackerEndArmies - Attacker armies after battle (user input)
   * @param {number} defenderEndArmies - Defender armies after battle (user input)
   * @returns {object} - Validation result
   */
  validateBattleResult(
    attackerStartArmies,
    defenderStartArmies,
    attackerEndArmies,
    defenderEndArmies
  ) {
    const errors = [];

    // Validate that end armies are not greater than start armies
    if (attackerEndArmies > attackerStartArmies) {
      errors.push("Attacker cannot gain armies during combat");
    }

    if (defenderEndArmies > defenderStartArmies) {
      errors.push("Defender cannot gain armies during combat");
    }

    // Validate attacker must leave at least 1 army
    if (attackerEndArmies < 1) {
      errors.push("Attacker must have at least 1 army remaining in territory");
    }

    // Validate defender can be reduced to 0 (conquest)
    if (defenderEndArmies < 0) {
      errors.push("Defender armies cannot be negative");
    }

    // Validate numbers are integers
    if (
      !Number.isInteger(attackerEndArmies) ||
      !Number.isInteger(defenderEndArmies)
    ) {
      errors.push("Army counts must be whole numbers");
    }

    // Calculate losses
    const attackerLosses = attackerStartArmies - attackerEndArmies;
    const defenderLosses = defenderStartArmies - defenderEndArmies;

    // Validate losses are non-negative
    if (attackerLosses < 0) {
      errors.push("Attacker losses cannot be negative");
    }

    if (defenderLosses < 0) {
      errors.push("Defender losses cannot be negative");
    }

    // Check for conquest
    const isConquest = defenderEndArmies === 0;

    return {
      valid: errors.length === 0,
      errors: errors,
      attackerLosses: attackerLosses,
      defenderLosses: defenderLosses,
      isConquest: isConquest,
      attackerRemaining: attackerEndArmies,
      defenderRemaining: defenderEndArmies,
    };
  }

  // Removed: getMaxDiceCount method (not needed for user input system)
}

// Export for use in other modules - maintaining backward compatibility
if (typeof module !== "undefined" && module.exports) {
  module.exports = CombatValidator;
}

// Also expose as DiceRoller for backward compatibility (legacy code may reference it)
if (typeof window !== "undefined") {
  window.CombatValidator = CombatValidator;
  // Alias for legacy code
  window.DiceRoller = CombatValidator;
}
