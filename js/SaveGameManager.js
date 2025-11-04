/**
 * SaveGameManager.js
 * Manages saving and loading game states for both single-player and multiplayer modes
 */

class SaveGameManager {
  constructor() {
    this.storageKey = 'risk_saved_games';
    this.maxSaves = 10; // Maximum number of saved games to keep
  }

  /**
   * Save current game state
   * @param {string} saveName - User-provided name for the save
   * @param {object} gameState - Current game state to save
   * @param {boolean} isMultiplayer - Whether this is a multiplayer game
   * @returns {object} - Save metadata
   */
  saveGame(saveName, gameState, isMultiplayer = false) {
    try {
      console.log('💾 Saving game:', saveName);

      // Validate that we can save (must be at beginning of turn, reinforcement phase)
      if (!this.canSaveNow(gameState)) {
        throw new Error('Can only save at the beginning of turn before deploying units');
      }

      // Create save metadata
      const saveData = {
        id: this.generateSaveId(),
        name: saveName,
        timestamp: Date.now(),
        date: new Date().toISOString(),
        isMultiplayer: isMultiplayer,
        sessionCode: isMultiplayer ? (window.multiplayerSession?.code || null) : null,
        players: this.extractPlayerData(gameState),
        territories: this.extractTerritoryData(gameState),
        currentPlayer: gameState.currentPlayer || 0,
        currentPhase: gameState.currentPhase || 'reinforce',
        turnNumber: gameState.turnNumber || 1,
        startTime: gameState.startTime || Date.now(),
        duration: this.calculateDuration(gameState.startTime)
      };

      // Get existing saves
      const saves = this.getAllSaves();

      // Add new save
      saves.push(saveData);

      // Sort by timestamp (newest first)
      saves.sort((a, b) => b.timestamp - a.timestamp);

      // Keep only the most recent saves
      const trimmedSaves = saves.slice(0, this.maxSaves);

      // Store in localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(trimmedSaves));

      console.log('✅ Game saved successfully:', saveData.name);
      return saveData;

    } catch (error) {
      console.error('❌ Error saving game:', error);
      throw error;
    }
  }

  /**
   * Load a saved game
   * @param {string} saveId - ID of the save to load
   * @returns {object} - Saved game data
   */
  loadGame(saveId) {
    try {
      console.log('📂 Loading game:', saveId);

      const saves = this.getAllSaves();
      const saveData = saves.find(save => save.id === saveId);

      if (!saveData) {
        throw new Error('Save not found');
      }

      console.log('✅ Game loaded successfully:', saveData.name);
      return saveData;

    } catch (error) {
      console.error('❌ Error loading game:', error);
      throw error;
    }
  }

  /**
   * Delete a saved game
   * @param {string} saveId - ID of the save to delete
   */
  deleteSave(saveId) {
    try {
      const saves = this.getAllSaves();
      const filtered = saves.filter(save => save.id !== saveId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      console.log('🗑️ Save deleted:', saveId);
    } catch (error) {
      console.error('❌ Error deleting save:', error);
      throw error;
    }
  }

  /**
   * Get all saved games
   * @returns {array} - Array of save metadata
   */
  getAllSaves() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error loading saves:', error);
      return [];
    }
  }

  /**
   * Check if game can be saved now
   * @param {object} gameState - Current game state
   * @returns {boolean}
   */
  canSaveNow(gameState) {
    // Can only save at beginning of turn in reinforcement phase before deployment
    const phase = gameState.currentPhase || (window.riskGame?.phase) || 'reinforce';
    
    // Check if in reinforcement phase
    if (phase !== 'reinforce') {
      console.warn('⚠️ Can only save during reinforcement phase');
      return false;
    }

    // Check if any units have been deployed this turn
    const unitsDeployed = gameState.unitsDeployedThisTurn || 
                         (window.riskGame?.unitsDeployedThisTurn) || 0;
    
    if (unitsDeployed > 0) {
      console.warn('⚠️ Cannot save after deploying units');
      return false;
    }

    return true;
  }

  /**
   * Extract player data from game state
   * @param {object} gameState
   * @returns {array}
   */
  extractPlayerData(gameState) {
    const players = [];

    // Try to get players from different sources
    if (window.riskGame && window.riskGame.players) {
      window.riskGame.players.forEach((player, index) => {
        players.push({
          index: index,
          name: player.name || `Player ${index + 1}`,
          color: player.color || this.getDefaultColor(index),
          territories: this.countPlayerTerritories(index),
          totalArmies: this.countPlayerArmies(index),
          isEliminated: player.isEliminated || false
        });
      });
    } else if (window.multiplayerSession && window.multiplayerSession.players) {
      // Multiplayer mode
      window.multiplayerSession.players.forEach((player, index) => {
        players.push({
          index: index,
          name: player.name,
          color: player.color,
          territories: this.countPlayerTerritories(index),
          totalArmies: this.countPlayerArmies(index),
          isEliminated: false
        });
      });
    }

    return players;
  }

  /**
   * Extract territory data from game state
   * @param {object} gameState
   * @returns {object}
   */
  extractTerritoryData(gameState) {
    const territories = {};

    if (window.riskGame && window.riskGame.territories) {
      Object.entries(window.riskGame.territories).forEach(([id, territory]) => {
        territories[id] = {
          owner: territory.owner,
          armies: territory.armies || 0
        };
      });
    }

    return territories;
  }

  /**
   * Count territories owned by a player
   * @param {number} playerIndex
   * @returns {number}
   */
  countPlayerTerritories(playerIndex) {
    if (!window.riskGame || !window.riskGame.territories) return 0;

    return Object.values(window.riskGame.territories).filter(
      t => t.owner === playerIndex
    ).length;
  }

  /**
   * Count total armies for a player
   * @param {number} playerIndex
   * @returns {number}
   */
  countPlayerArmies(playerIndex) {
    if (!window.riskGame || !window.riskGame.territories) return 0;

    return Object.values(window.riskGame.territories)
      .filter(t => t.owner === playerIndex)
      .reduce((total, t) => total + (t.armies || 0), 0);
  }

  /**
   * Calculate game duration
   * @param {number} startTime - Game start timestamp
   * @returns {string} - Formatted duration
   */
  calculateDuration(startTime) {
    if (!startTime) return '0m';

    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Generate unique save ID
   * @returns {string}
   */
  generateSaveId() {
    return `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default player color
   * @param {number} index
   * @returns {string}
   */
  getDefaultColor(index) {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    return colors[index % colors.length];
  }

  /**
   * Format date for display
   * @param {number} timestamp
   * @returns {string}
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Get formatted date and time
   * @param {number} timestamp
   * @returns {object}
   */
  getFormattedDateTime(timestamp) {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      relative: this.formatDate(timestamp)
    };
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.SaveGameManager = new SaveGameManager();
  console.log('✅ SaveGameManager initialized');
}
