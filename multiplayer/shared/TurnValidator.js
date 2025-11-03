/**
 * 🎮 Turn Validation System
 * Server-authoritative turn validation to prevent cheating
 */

class TurnValidator {
    constructor() {
        this.validPhases = ['reinforcement', 'attack', 'fortification'];
        this.validActions = {
            reinforcement: ['placeArmy', 'endPhase'],
            attack: ['selectAttacker', 'selectDefender', 'rollDice', 'endPhase'],
            fortification: ['selectSource', 'selectTarget', 'moveArmies', 'endPhase']
        };
    }

    /**
     * Validate if player can take action
     * @param {Object} params - Validation parameters
     * @returns {Object} - Validation result
     */
    validateAction(params) {
        const {
            sessionData,
            playerId,
            action,
            territoryId,
            targetTerritoryId,
            armies
        } = params;

        const result = {
            valid: false,
            error: null,
            timestamp: Date.now()
        };

        // 1. Check if game has started
        if (!sessionData.started) {
            result.error = 'Game has not started';
            return result;
        }

        // 2. Check if it's player's turn
        if (sessionData.gameState.currentPlayer !== playerId) {
            result.error = `Not your turn. Current player: ${sessionData.gameState.currentPlayer}`;
            return result;
        }

        // 3. Validate phase
        const currentPhase = sessionData.gameState.currentPhase;
        if (!this.validPhases.includes(currentPhase)) {
            result.error = `Invalid phase: ${currentPhase}`;
            return result;
        }

        // 4. Validate action for current phase
        const allowedActions = this.validActions[currentPhase];
        if (!allowedActions.includes(action)) {
            result.error = `Action '${action}' not allowed in '${currentPhase}' phase`;
            return result;
        }

        // 5. Phase-specific validation
        switch (currentPhase) {
            case 'reinforcement':
                return this.validateReinforcementAction(params, sessionData, result);
            case 'attack':
                return this.validateAttackAction(params, sessionData, result);
            case 'fortification':
                return this.validateFortificationAction(params, sessionData, result);
            default:
                result.error = 'Unknown phase';
                return result;
        }
    }

    /**
     * Validate reinforcement phase action
     */
    validateReinforcementAction(params, sessionData, result) {
        const { action, territoryId, armies, playerId } = params;

        if (action === 'placeArmy') {
            // Check territory ownership
            const territory = sessionData.gameState.territories[territoryId];
            if (!territory) {
                result.error = `Territory not found: ${territoryId}`;
                return result;
            }

            if (territory.owner !== playerId) {
                result.error = `You don't own territory: ${territoryId}`;
                return result;
            }

            // Check reinforcements remaining
            const remaining = sessionData.gameState.reinforcementsRemaining || 0;
            if (remaining <= 0) {
                result.error = 'No reinforcements remaining';
                return result;
            }

            // Check army count
            if (armies && armies > remaining) {
                result.error = `Cannot place ${armies} armies. Only ${remaining} remaining.`;
                return result;
            }

            result.valid = true;
            return result;
        }

        if (action === 'endPhase') {
            // Check if all reinforcements placed
            const remaining = sessionData.gameState.reinforcementsRemaining || 0;
            if (remaining > 0) {
                result.error = `Must place all ${remaining} reinforcements before ending phase`;
                return result;
            }

            result.valid = true;
            return result;
        }

        result.error = 'Invalid reinforcement action';
        return result;
    }

    /**
     * Validate attack phase action
     */
    validateAttackAction(params, sessionData, result) {
        const { action, territoryId, targetTerritoryId, playerId } = params;

        if (action === 'selectAttacker') {
            const territory = sessionData.gameState.territories[territoryId];
            if (!territory) {
                result.error = `Territory not found: ${territoryId}`;
                return result;
            }

            if (territory.owner !== playerId) {
                result.error = `You don't own territory: ${territoryId}`;
                return result;
            }

            if (territory.armies < 2) {
                result.error = 'Need at least 2 armies to attack';
                return result;
            }

            result.valid = true;
            return result;
        }

        if (action === 'selectDefender') {
            const attacker = sessionData.gameState.territories[territoryId];
            const defender = sessionData.gameState.territories[targetTerritoryId];

            if (!attacker || !defender) {
                result.error = 'Invalid territories';
                return result;
            }

            // Check adjacency
            if (!attacker.neighbors.includes(targetTerritoryId)) {
                result.error = 'Territories not adjacent';
                return result;
            }

            // Check ownership
            if (attacker.owner !== playerId) {
                result.error = 'You don\'t own attacking territory';
                return result;
            }

            if (defender.owner === playerId) {
                result.error = 'Cannot attack your own territory';
                return result;
            }

            result.valid = true;
            return result;
        }

        if (action === 'endPhase') {
            result.valid = true;
            return result;
        }

        result.error = 'Invalid attack action';
        return result;
    }

    /**
     * Validate fortification phase action
     */
    validateFortificationAction(params, sessionData, result) {
        const { action, territoryId, targetTerritoryId, armies, playerId } = params;

        if (action === 'selectSource') {
            const territory = sessionData.gameState.territories[territoryId];
            if (!territory) {
                result.error = `Territory not found: ${territoryId}`;
                return result;
            }

            if (territory.owner !== playerId) {
                result.error = `You don't own territory: ${territoryId}`;
                return result;
            }

            if (territory.armies < 2) {
                result.error = 'Need at least 2 armies to fortify from';
                return result;
            }

            result.valid = true;
            return result;
        }

        if (action === 'moveArmies') {
            const source = sessionData.gameState.territories[territoryId];
            const target = sessionData.gameState.territories[targetTerritoryId];

            if (!source || !target) {
                result.error = 'Invalid territories';
                return result;
            }

            // Check ownership
            if (source.owner !== playerId || target.owner !== playerId) {
                result.error = 'Must own both territories';
                return result;
            }

            // Check adjacency (or connected path - simplified here)
            if (!source.neighbors.includes(targetTerritoryId)) {
                result.error = 'Territories not adjacent';
                return result;
            }

            // Check armies
            if (!armies || armies < 1) {
                result.error = 'Must move at least 1 army';
                return result;
            }

            if (armies >= source.armies) {
                result.error = `Cannot move all armies. Must leave at least 1 in ${territoryId}`;
                return result;
            }

            result.valid = true;
            return result;
        }

        if (action === 'endPhase') {
            result.valid = true;
            return result;
        }

        result.error = 'Invalid fortification action';
        return result;
    }

    /**
     * Validate game state integrity
     * @param {Object} gameState - Game state to validate
     * @returns {Object} - Validation result
     */
    validateGameState(gameState) {
        const result = {
            valid: true,
            errors: []
        };

        // Check required fields
        if (!gameState.territories) {
            result.valid = false;
            result.errors.push('Missing territories');
        }

        if (!gameState.currentPlayer) {
            result.valid = false;
            result.errors.push('Missing current player');
        }

        if (!gameState.currentPhase) {
            result.valid = false;
            result.errors.push('Missing current phase');
        }

        // Validate all territories have valid data
        if (gameState.territories) {
            Object.entries(gameState.territories).forEach(([id, territory]) => {
                if (!territory.owner) {
                    result.valid = false;
                    result.errors.push(`Territory ${id} has no owner`);
                }

                if (typeof territory.armies !== 'number' || territory.armies < 1) {
                    result.valid = false;
                    result.errors.push(`Territory ${id} has invalid army count`);
                }

                if (!Array.isArray(territory.neighbors)) {
                    result.valid = false;
                    result.errors.push(`Territory ${id} has invalid neighbors`);
                }
            });
        }

        return result;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TurnValidator;
}
if (typeof window !== 'undefined') {
    window.TurnValidator = TurnValidator;
}
