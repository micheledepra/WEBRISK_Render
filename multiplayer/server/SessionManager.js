/**
 * SessionManager - Manages game sessions for multiplayer Risk
 */

const { 
  SESSION_STATES, 
  PLAYER_STATES, 
  MAX_PLAYERS, 
  MIN_PLAYERS,
  SESSION_ID_LENGTH 
} = require('../shared/constants');

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let sessionId;
    
    do {
      sessionId = '';
      for (let i = 0; i < SESSION_ID_LENGTH; i++) {
        sessionId += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (this.sessions.has(sessionId));
    
    return sessionId;
  }

  /**
   * Create a new game session
   */
  createSession(hostUserId, hostPlayerName, playerCount = 2) {
    if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
      throw new Error(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
    }

    const sessionId = this.generateSessionId();
    const session = {
      sessionId,
      hostUserId,
      maxPlayers: playerCount,
      state: SESSION_STATES.WAITING,
      createdAt: Date.now(),
      players: new Map(),
      gameState: null,
      currentPlayerIndex: 0,
      turnNumber: 0
    };

    // Add host as first player
    session.players.set(hostUserId, {
      userId: hostUserId,
      playerName: hostPlayerName,
      socketId: null,
      playerIndex: 0,
      state: PLAYER_STATES.NOT_READY,
      joinedAt: Date.now()
    });

    this.sessions.set(sessionId, session);
    
    console.log(`✅ Session created: ${sessionId} by ${hostPlayerName}`);
    return session;
  }

  /**
   * Join an existing session
   */
  joinSession(sessionId, userId, playerName, socketId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.state !== SESSION_STATES.WAITING && session.state !== SESSION_STATES.READY) {
      throw new Error('Game already in progress');
    }

    if (session.players.size >= session.maxPlayers) {
      throw new Error('Session is full');
    }

    // Check if player is rejoining
    if (session.players.has(userId)) {
      const player = session.players.get(userId);
      player.socketId = socketId;
      player.state = PLAYER_STATES.CONNECTED;
      console.log(`🔄 Player rejoined: ${playerName} to session ${sessionId}`);
      return session;
    }

    // Add new player
    const playerIndex = session.players.size;
    session.players.set(userId, {
      userId,
      playerName,
      socketId,
      playerIndex,
      state: PLAYER_STATES.NOT_READY,
      joinedAt: Date.now()
    });

    console.log(`✅ Player joined: ${playerName} to session ${sessionId} (${session.players.size}/${session.maxPlayers})`);
    return session;
  }

  /**
   * Leave a session
   */
  leaveSession(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const player = session.players.get(userId);
    if (!player) {
      return false;
    }

    // If game hasn't started, remove player completely
    if (session.state === SESSION_STATES.WAITING || session.state === SESSION_STATES.READY) {
      session.players.delete(userId);
      console.log(`👋 Player left: ${player.playerName} from session ${sessionId}`);

      // If host left and session is empty, delete session
      if (userId === session.hostUserId && session.players.size === 0) {
        this.sessions.delete(sessionId);
        console.log(`🗑️ Session deleted: ${sessionId} (empty)`);
      } else if (userId === session.hostUserId && session.players.size > 0) {
        // Transfer host to next player
        const newHost = Array.from(session.players.values())[0];
        session.hostUserId = newHost.userId;
        console.log(`👑 Host transferred to: ${newHost.playerName}`);
      }
    } else {
      // Game in progress - mark as disconnected
      player.state = PLAYER_STATES.DISCONNECTED;
      player.socketId = null;
      console.log(`⚠️ Player disconnected mid-game: ${player.playerName}`);
    }

    return true;
  }

  /**
   * Mark player as ready
   */
  setPlayerReady(sessionId, userId, ready = true) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const player = session.players.get(userId);
    if (!player) {
      throw new Error('Player not in session');
    }

    player.state = ready ? PLAYER_STATES.READY : PLAYER_STATES.NOT_READY;

    // Check if all players are ready
    const allReady = Array.from(session.players.values()).every(
      p => p.state === PLAYER_STATES.READY
    );

    if (allReady && session.players.size >= MIN_PLAYERS) {
      session.state = SESSION_STATES.READY;
    }

    return session;
  }

  /**
   * Start a game session
   */
  startSession(sessionId, initialGameState) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.players.size < MIN_PLAYERS) {
      throw new Error(`Need at least ${MIN_PLAYERS} players to start`);
    }

    session.state = SESSION_STATES.IN_PROGRESS;
    session.gameState = initialGameState;
    session.startedAt = Date.now();
    
    console.log(`🎮 Game started: ${sessionId} with ${session.players.size} players`);
    return session;
  }

  /**
   * Update game state
   */
  updateGameState(sessionId, gameState) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    session.gameState = gameState;
    session.lastUpdated = Date.now();
    return session;
  }

  /**
   * Get current player for a session
   */
  getCurrentPlayer(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.gameState) {
      return null;
    }

    const players = Array.from(session.players.values());
    return players[session.currentPlayerIndex];
  }

  /**
   * Validate if user can perform action (is it their turn?)
   */
  canPlayerAct(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (session.state !== SESSION_STATES.IN_PROGRESS) {
      return { valid: false, reason: 'Game not in progress' };
    }

    const player = session.players.get(userId);
    if (!player) {
      return { valid: false, reason: 'Player not in session' };
    }

    if (player.state === PLAYER_STATES.DISCONNECTED) {
      return { valid: false, reason: 'Player disconnected' };
    }

    const currentPlayer = this.getCurrentPlayer(sessionId);
    if (!currentPlayer || currentPlayer.userId !== userId) {
      return { 
        valid: false, 
        reason: `Not your turn. Current player: ${currentPlayer?.playerName || 'Unknown'}` 
      };
    }

    return { valid: true };
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions (for admin/debug)
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Update player socket ID (for reconnection)
   */
  updatePlayerSocket(sessionId, userId, socketId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const player = session.players.get(userId);
    if (!player) {
      return false;
    }

    player.socketId = socketId;
    player.state = PLAYER_STATES.CONNECTED;
    return true;
  }

  /**
   * Clean up old sessions (call periodically)
   */
  cleanupOldSessions(maxAgeHours = 24) {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const [sessionId, session] of this.sessions) {
      const age = now - session.createdAt;
      if (age > maxAge && session.state !== SESSION_STATES.IN_PROGRESS) {
        this.sessions.delete(sessionId);
        console.log(`🗑️ Cleaned up old session: ${sessionId}`);
      }
    }
  }
}

module.exports = SessionManager;
