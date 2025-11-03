/**
 * RISK GAME STATE MANAGER
 * 
 * Single source of truth for all game state access
 * Eliminates inconsistent data access patterns across the codebase
 */

class GameStateManager {
    /**
     * Get the primary game state object
     * @returns {Object} - The game state
     */
    static getGameState() {
        // Priority order: riskUI > window.gameState > combatSystem
        return window.riskUI?.gameState || 
               window.gameState || 
               window.combatSystem?.gameState || 
               null;
    }

    /**
     * Get a territory by ID
     * @param {string} territoryId - Territory identifier
     * @returns {Object|null} - Territory object or null if not found
     */
    static getTerritory(territoryId) {
        const gameState = this.getGameState();
        return gameState?.territories?.[territoryId] || null;
    }

    /**
     * Update a territory's data
     * @param {string} territoryId - Territory identifier
     * @param {Object} updates - Properties to update
     * @returns {boolean} - Success status
     */
    static updateTerritory(territoryId, updates) {
        const gameState = this.getGameState();
        const territory = gameState?.territories?.[territoryId];
        
        if (!territory) {
            console.error(`Territory not found: ${territoryId}`);
            return false;
        }

        // Apply updates
        Object.assign(territory, updates);
        
        // Trigger UI updates
        this.notifyTerritoryChanged(territoryId, territory);
        
        return true;
    }

    /**
     * Get current player
     * @returns {string|null} - Current player ID
     */
    static getCurrentPlayer() {
        const gameState = this.getGameState();
        return gameState?.getCurrentPlayer?.() || gameState?.currentPlayer || null;
    }

    /**
     * Get current game phase
     * @returns {string|null} - Current phase
     */
    static getCurrentPhase() {
        const gameState = this.getGameState();
        return gameState?.phase || null;
    }

    /**
     * Validate territory ownership
     * @param {string} territoryId - Territory to check
     * @param {string} playerId - Player to check against (optional, defaults to current player)
     * @returns {boolean} - Whether player owns territory
     */
    static validateOwnership(territoryId, playerId = null) {
        const territory = this.getTerritory(territoryId);
        const player = playerId || this.getCurrentPlayer();
        return territory?.owner === player;
    }

    /**
     * Get all territories owned by a player
     * @param {string} playerId - Player ID (optional, defaults to current player)
     * @returns {Array} - Array of territory objects
     */
    static getPlayerTerritories(playerId = null) {
        const gameState = this.getGameState();
        const player = playerId || this.getCurrentPlayer();
        
        if (!gameState?.territories || !player) return [];
        
        return Object.values(gameState.territories).filter(territory => territory.owner === player);
    }

    /**
     * Get neighbors of a territory
     * @param {string} territoryId - Territory ID
     * @returns {Array} - Array of neighbor territory IDs
     */
    static getTerritoryNeighbors(territoryId) {
        const territory = this.getTerritory(territoryId);
        return territory?.neighbors || [];
    }

    /**
     * Check if two territories are adjacent
     * @param {string} territory1Id - First territory
     * @param {string} territory2Id - Second territory
     * @returns {boolean} - Whether territories are neighbors
     */
    static areTerritoriesAdjacent(territory1Id, territory2Id) {
        const neighbors = this.getTerritoryNeighbors(territory1Id);
        return neighbors.includes(territory2Id);
    }

    /**
     * Update territory army count
     * @param {string} territoryId - Territory ID
     * @param {number} newArmyCount - New army count
     * @returns {boolean} - Success status
     */
    static updateTerritoryArmies(territoryId, newArmyCount) {
        if (newArmyCount < 0) {
            console.error(`Invalid army count: ${newArmyCount}`);
            return false;
        }
        
        return this.updateTerritory(territoryId, { armies: newArmyCount });
    }

    /**
     * Transfer territory ownership
     * @param {string} territoryId - Territory ID
     * @param {string} newOwner - New owner player ID
     * @param {number} armies - Army count for new owner
     * @returns {boolean} - Success status
     */
    static transferTerritoryOwnership(territoryId, newOwner, armies = 1) {
        const result = this.updateTerritory(territoryId, { 
            owner: newOwner, 
            armies: armies 
        });
        
        if (result) {
            console.log(`Territory ${territoryId} transferred to ${newOwner} with ${armies} armies`);
        }
        
        return result;
    }

    /**
     * Notify UI systems of territory changes
     * @param {string} territoryId - Changed territory
     * @param {Object} territory - Territory data
     */
    static notifyTerritoryChanged(territoryId, territory) {
        // Update visual elements
        this.updateTerritoryVisuals(territoryId, territory);
        
        // Trigger any registered callbacks
        if (window.onTerritoryChanged) {
            window.onTerritoryChanged(territoryId, territory);
        }
    }

    /**
     * Update territory visual elements
     * @param {string} territoryId - Territory ID
     * @param {Object} territory - Territory data
     */
    static updateTerritoryVisuals(territoryId, territory) {
        // Update army count display
        const armyElement = document.getElementById(`${territoryId}-armies`);
        if (armyElement) {
            armyElement.textContent = `${territory.armies} armies`;
        }

        // Update territory color using ColorManager's official dynamic opacity system
        if (window.riskUI && window.riskUI.colorManager && territory.owner) {
            const gameState = this.getGameState();
            if (gameState) {
                window.riskUI.colorManager.updateTerritoryColorWithOpacity(
                    territoryId, 
                    territory.owner, 
                    gameState
                );
                console.log(`✅ Updated ${territoryId} visuals using dynamic opacity system`);
            }
        } else if (territory.owner) {
            // FALLBACK: Direct DOM manipulation (should rarely be used)
            console.warn('⚠️ GameStateManager using fallback - ColorManager not available');
            const territoryElement = document.getElementById(territoryId);
            if (territoryElement && window.playerColors) {
                const playerIndex = parseInt(territory.owner.replace('Player ', '')) - 1;
                const color = window.playerColors[playerIndex];
                if (color) {
                    // Use 25% minimum opacity even in fallback
                    const hex = color.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    const rgbaColor = `rgba(${r}, ${g}, ${b}, 0.25)`;
                    territoryElement.style.fill = rgbaColor;
                }
            }
        }
    }

    /**
     * Debug: Log current game state
     */
    static debugGameState() {
        const gameState = this.getGameState();
        console.log('GameStateManager Debug:', {
            gameStateSource: gameState === window.riskUI?.gameState ? 'riskUI' : 
                           gameState === window.gameState ? 'window' : 
                           gameState === window.combatSystem?.gameState ? 'combatSystem' : 'unknown',
            currentPlayer: this.getCurrentPlayer(),
            currentPhase: this.getCurrentPhase(),
            territoryCount: gameState?.territories ? Object.keys(gameState.territories).length : 0
        });
    }

    // ============================================
    // MULTIPLAYER PERSISTENCE EXTENSIONS
    // ============================================

    /**
     * 💾 Save complete game state for multiplayer persistence
     * @param {string} sessionCode - Multiplayer session identifier
     * @returns {Object} - Serialized game state
     */
    static serializeForPersistence(sessionCode = null) {
        const gameState = this.getGameState();
        if (!gameState) {
            console.warn('⚠️ No game state to serialize');
            return null;
        }

        const serialized = {
            sessionCode: sessionCode,
            timestamp: Date.now(),
            savedAt: new Date().toISOString(),
            version: '1.0',
            
            // Core game data
            territories: gameState.territories,
            players: gameState.players || [],
            currentPlayer: this.getCurrentPlayer(),
            currentPhase: this.getCurrentPhase(),
            
            // Turn management
            turnNumber: gameState.turnNumber || window.turnManager?.currentTurnNumber || 0,
            turnOrder: gameState.turnOrder || window.turnManager?.turnOrder || [],
            
            // Phase-specific data
            reinforcementsRemaining: gameState.reinforcementsRemaining || 0,
            
            // Additional context
            gameStartedAt: gameState.gameStartedAt || null,
            lastActionTimestamp: Date.now()
        };

        console.log('💾 Game state serialized for persistence');
        return serialized;
    }

    /**
     * 📂 Restore game state from persistence
     * @param {Object} savedState - Previously serialized game state
     * @returns {boolean} - Success status
     */
    static restoreFromPersistence(savedState) {
        if (!savedState) {
            console.error('❌ No saved state provided');
            return false;
        }

        try {
            const gameState = this.getGameState();
            if (!gameState) {
                console.error('❌ No game state object to restore into');
                return false;
            }

            // Restore territories
            if (savedState.territories) {
                Object.assign(gameState.territories, savedState.territories);
            }

            // Restore players
            if (savedState.players) {
                gameState.players = savedState.players;
            }

            // Restore current player
            if (savedState.currentPlayer) {
                gameState.currentPlayer = savedState.currentPlayer;
            }

            // Restore phase
            if (savedState.currentPhase) {
                gameState.phase = savedState.currentPhase;
            }

            // Restore turn management
            if (window.turnManager) {
                if (savedState.turnNumber !== undefined) {
                    window.turnManager.currentTurnNumber = savedState.turnNumber;
                }
                if (savedState.turnOrder) {
                    window.turnManager.turnOrder = savedState.turnOrder;
                }
            }

            // Restore phase-specific data
            if (savedState.reinforcementsRemaining !== undefined) {
                gameState.reinforcementsRemaining = savedState.reinforcementsRemaining;
            }

            // Update all visuals
            this.refreshAllVisuals();

            console.log('✅ Game state restored from persistence');
            return true;
        } catch (error) {
            console.error('❌ Failed to restore game state:', error);
            return false;
        }
    }

    /**
     * 🔄 Refresh all territory visuals after state restoration
     */
    static refreshAllVisuals() {
        const gameState = this.getGameState();
        if (!gameState || !gameState.territories) {
            return;
        }

        Object.entries(gameState.territories).forEach(([territoryId, territory]) => {
            this.updateTerritoryVisuals(territoryId, territory);
        });

        console.log('🔄 All visuals refreshed');
    }

    /**
     * 💾 Save to localStorage (client-side backup)
     * @param {string} sessionCode - Session identifier
     * @returns {boolean} - Success status
     */
    static saveToLocalStorage(sessionCode) {
        try {
            const serialized = this.serializeForPersistence(sessionCode);
            if (!serialized) {
                return false;
            }

            const storageKey = `riskMultiplayer_${sessionCode}`;
            localStorage.setItem(storageKey, JSON.stringify(serialized));

            console.log('💾 Game state saved to localStorage:', sessionCode);
            return true;
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
            return false;
        }
    }

    /**
     * 📂 Load from localStorage (client-side backup)
     * @param {string} sessionCode - Session identifier
     * @returns {Object|null} - Saved state or null
     */
    static loadFromLocalStorage(sessionCode) {
        try {
            const storageKey = `riskMultiplayer_${sessionCode}`;
            const data = localStorage.getItem(storageKey);

            if (!data) {
                console.log('📭 No saved state in localStorage for:', sessionCode);
                return null;
            }

            const savedState = JSON.parse(data);

            // Check age (24 hours max)
            const age = Date.now() - savedState.timestamp;
            if (age > 24 * 60 * 60 * 1000) {
                console.warn('⚠️ Saved state is too old (>24h)');
                this.clearLocalStorage(sessionCode);
                return null;
            }

            console.log('✅ Game state loaded from localStorage:', sessionCode);
            return savedState;
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
            return null;
        }
    }

    /**
     * 🗑️ Clear localStorage for session
     * @param {string} sessionCode - Session identifier
     */
    static clearLocalStorage(sessionCode) {
        try {
            const storageKey = `riskMultiplayer_${sessionCode}`;
            localStorage.removeItem(storageKey);
            console.log('🗑️ localStorage cleared for:', sessionCode);
        } catch (error) {
            console.error('❌ Failed to clear localStorage:', error);
        }
    }

    /**
     * 🔄 Auto-save handler (call after significant game actions)
     * @param {string} sessionCode - Session identifier
     */
    static autoSave(sessionCode) {
        if (!sessionCode) {
            return;
        }

        // Throttle auto-saves (max once per 5 seconds)
        const now = Date.now();
        if (this._lastAutoSave && (now - this._lastAutoSave) < 5000) {
            return;
        }

        this._lastAutoSave = now;
        this.saveToLocalStorage(sessionCode);

        // Also sync to Firebase if available
        if (window.firebaseManager && window.firebaseManager.initialized) {
            const serialized = this.serializeForPersistence(sessionCode);
            window.firebaseManager.updateGameState(sessionCode, serialized);
        }
    }
}

// Initialize auto-save timestamp
GameStateManager._lastAutoSave = 0;

// Make available globally
if (typeof window !== 'undefined') {
    window.GameStateManager = GameStateManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameStateManager;
}