/**
 * GameDataStore - Historical Game Data Persistence
 * Stores game snapshots for analytics and historical tracking
 */

const fs = require('fs');
const path = require('path');

class GameDataStore {
  constructor(dataDir = path.join(__dirname, '../../data/game-history')) {
    this.dataDir = dataDir;
    this.currentGames = new Map(); // In-memory storage for active games
    this.maxHistoricalGames = 100; // Maximum games to keep in history
    
    // Ensure data directory exists
    this.ensureDataDirectory();
    
    console.log('📊 GameDataStore initialized - Data directory:', this.dataDir);
  }

  /**
   * Ensure the data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log('✅ Created game history directory:', this.dataDir);
    }
  }

  /**
   * Save or update game data snapshot
   * @param {string} gameId - Unique game identifier
   * @param {Object} gameData - Game state data
   */
  saveGameData(gameId, gameData) {
    try {
      // Validate data
      if (!gameData || typeof gameData !== 'object') {
        throw new Error('Invalid game data');
      }

      // Add metadata
      const snapshot = {
        gameId: gameId,
        timestamp: Date.now(),
        savedAt: new Date().toISOString(),
        ...gameData
      };

      // Store in memory
      this.currentGames.set(gameId, snapshot);

      // Save to disk
      const filename = `game_${gameId}_${Date.now()}.json`;
      const filepath = path.join(this.dataDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
      
      console.log(`✅ Game data saved: ${gameId} (${filename})`);
      
      // Cleanup old files if necessary
      this.cleanupOldFiles();
      
      return { success: true, gameId, timestamp: snapshot.timestamp };
    } catch (error) {
      console.error('❌ Error saving game data:', error);
      throw error;
    }
  }

  /**
   * Get the latest snapshot for a specific game
   * @param {string} gameId - Game identifier
   */
  getLatestGameData(gameId) {
    // Check in-memory first
    if (this.currentGames.has(gameId)) {
      return this.currentGames.get(gameId);
    }

    // Load from disk
    try {
      const files = this.getGameFiles(gameId);
      if (files.length === 0) {
        return null;
      }

      // Get most recent file
      const latestFile = files[files.length - 1];
      const filepath = path.join(this.dataDir, latestFile);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      
      return data;
    } catch (error) {
      console.error('❌ Error loading game data:', error);
      return null;
    }
  }

  /**
   * Get all historical snapshots for a game
   * @param {string} gameId - Game identifier
   * @param {number} limit - Maximum number of snapshots to return
   */
  getGameHistory(gameId, limit = 50) {
    try {
      const files = this.getGameFiles(gameId);
      const snapshots = [];

      // Load files (most recent first)
      const filesToLoad = files.slice(-limit).reverse();
      
      for (const file of filesToLoad) {
        try {
          const filepath = path.join(this.dataDir, file);
          const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          snapshots.push(data);
        } catch (error) {
          console.warn(`⚠️ Could not load file ${file}:`, error.message);
        }
      }

      return snapshots;
    } catch (error) {
      console.error('❌ Error loading game history:', error);
      return [];
    }
  }

  /**
   * Get all historical game data (all games)
   * @param {number} limit - Maximum number of games to return
   */
  getAllGamesHistory(limit = 100) {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(f => f.startsWith('game_') && f.endsWith('.json'))
        .sort()
        .slice(-limit);

      const games = [];

      for (const file of files) {
        try {
          const filepath = path.join(this.dataDir, file);
          const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
          games.push(data);
        } catch (error) {
          console.warn(`⚠️ Could not load file ${file}:`, error.message);
        }
      }

      console.log(`📊 Loaded ${games.length} historical game snapshots`);
      return games;
    } catch (error) {
      console.error('❌ Error loading all games history:', error);
      return [];
    }
  }

  /**
   * Get files for a specific game, sorted by timestamp
   * @param {string} gameId - Game identifier
   */
  getGameFiles(gameId) {
    try {
      const allFiles = fs.readdirSync(this.dataDir);
      const gameFiles = allFiles
        .filter(f => f.startsWith(`game_${gameId}_`) && f.endsWith('.json'))
        .sort(); // Files are naturally sorted by timestamp
      
      return gameFiles;
    } catch (error) {
      console.error('❌ Error reading game files:', error);
      return [];
    }
  }

  /**
   * Delete old game files to prevent unlimited growth
   */
  cleanupOldFiles() {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(f => f.startsWith('game_') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(this.dataDir, f),
          time: fs.statSync(path.join(this.dataDir, f)).mtime.getTime()
        }))
        .sort((a, b) => a.time - b.time); // Oldest first

      // Delete oldest files if we exceed the limit
      const filesToDelete = files.length - this.maxHistoricalGames;
      
      if (filesToDelete > 0) {
        console.log(`🗑️ Cleaning up ${filesToDelete} old game files...`);
        
        for (let i = 0; i < filesToDelete; i++) {
          fs.unlinkSync(files[i].path);
          console.log(`   Deleted: ${files[i].name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up old files:', error);
    }
  }

  /**
   * Get statistics about stored games
   */
  getStats() {
    try {
      const files = fs.readdirSync(this.dataDir)
        .filter(f => f.startsWith('game_') && f.endsWith('.json'));
      
      const gameIds = new Set();
      files.forEach(f => {
        const match = f.match(/game_([^_]+)_/);
        if (match) gameIds.add(match[1]);
      });

      return {
        totalSnapshots: files.length,
        uniqueGames: gameIds.size,
        activeGamesInMemory: this.currentGames.size,
        dataDirectory: this.dataDir
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return {
        totalSnapshots: 0,
        uniqueGames: 0,
        activeGamesInMemory: this.currentGames.size,
        dataDirectory: this.dataDir,
        error: error.message
      };
    }
  }

  /**
   * Clear all game data (use with caution!)
   */
  clearAllData() {
    try {
      this.currentGames.clear();
      
      const files = fs.readdirSync(this.dataDir)
        .filter(f => f.startsWith('game_') && f.endsWith('.json'));
      
      files.forEach(f => {
        fs.unlinkSync(path.join(this.dataDir, f));
      });
      
      console.log(`🗑️ Cleared ${files.length} game data files`);
      return { success: true, filesDeleted: files.length };
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }
}

module.exports = GameDataStore;
