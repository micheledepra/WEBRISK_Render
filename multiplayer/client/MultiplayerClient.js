/**
 * MultiplayerClient - Client-side multiplayer handler for Risk Game
 * Manages WebSocket connection and synchronization with server
 */

class MultiplayerClient {
  constructor(serverUrl = null) {
    // Auto-detect server URL based on environment
    if (!serverUrl) {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const isLocalhost = hostname === 'localhost' || 
                          hostname === '127.0.0.1' ||
                          hostname === '';
      
      // Check if on Render.com
      const isRender = hostname.includes('onrender.com');
      
      console.log('🌐 Hostname:', hostname);
      console.log('🌐 Protocol:', protocol);
      console.log('🌐 isLocalhost:', isLocalhost);
      console.log('🌐 isRender:', isRender);
      
      if (isRender || (!isLocalhost && hostname !== '')) {
        // Production: use current domain
        this.serverUrl = window.location.origin;
        console.log('✅ Production mode - Server URL:', this.serverUrl);
      } else {
        // Development: use localhost
        this.serverUrl = 'http://localhost:3000';
        console.log('🔧 Development mode - Server URL:', this.serverUrl);
      }
    } else {
      this.serverUrl = serverUrl;
      console.log('🎯 Using provided Server URL:', this.serverUrl);
    }
    
    this.socket = null;
    this.sessionId = null;
    this.userId = this.generateUserId();
    this.playerName = null;
    this.isConnected = false;
    this.isMyTurn = false;
    this.currentPlayerName = null;
    
    // Reconnection management
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.isReconnecting = false;
    
    // Event callbacks
    this.callbacks = {
      onConnect: [],
      onDisconnect: [],
      onSessionUpdate: [],
      onPlayersUpdate: [],
      onGameStateUpdate: [],
      onTurnStart: [],
      onError: [],
      onSessionError: [],
      onTurnValidationError: []
    };

    console.log('🎮 MultiplayerClient initialized');
    console.log('🌐 Server URL:', this.serverUrl);
  }

  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Connect to the multiplayer server
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        console.log('Already connected');
        return resolve();
      }

      console.log(`🔌 Connecting to server: ${this.serverUrl}`);
      
      // Check if Socket.IO is loaded
      if (typeof io === 'undefined') {
        reject(new Error('Socket.IO library not loaded. Make sure socket.io.js is included before MultiplayerClient.js'));
        return;
      }

      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        // Connection established
        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('✅ Connected to server:', this.socket.id);
          this.trigger('onConnect');
          resolve();
        });

        // Connection error
        this.socket.on('connect_error', (error) => {
          console.error('❌ Connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Disconnection
        this.socket.on('disconnect', (reason) => {
          this.isConnected = false;
          console.log('🔌 Disconnected from server:', reason);
          this.trigger('onDisconnect');
        });

        // Reconnection
        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected after', attemptNumber, 'attempts');
          this.isConnected = true;
        });

      } catch (error) {
        console.error('❌ Failed to create socket:', error);
        reject(error);
      }

      // Session updates
      this.socket.on('session:update', (session) => {
        console.log('📥 Session update:', session);
        this.trigger('onSessionUpdate', session);
      });

      // Player list updates
      this.socket.on('session:playersUpdate', (data) => {
        console.log('👥 Players update:', data);
        this.trigger('onPlayersUpdate', data);
      });

      // Game state updates
      this.socket.on('gameState:update', (gameState) => {
        console.log('🎮 Game state update received');
        this.trigger('onGameStateUpdate', gameState);
      });

      // Turn notifications
      this.socket.on('turn:start', (data) => {
        console.log('🔄 Turn start:', data);
        this.isMyTurn = data.currentPlayerId === this.userId;
        this.currentPlayerName = data.currentPlayerName;
        this.trigger('onTurnStart', data);
      });

      // Turn validation errors
      this.socket.on('turn:validationError', (data) => {
        console.warn('⚠️ Turn validation error:', data.message);
        this.trigger('onTurnValidationError', data);
      });

      // Session errors
      this.socket.on('session:error', (data) => {
        console.error('❌ Session error:', data.message);
        this.trigger('onSessionError', data);
      });

      // General errors
      this.socket.on('error', (data) => {
        console.error('❌ Error:', data.message);
        this.trigger('onError', data);
      });
    });
  }

  /**
   * Create a new game session
   */
  async createSession(hostPlayerName, playerCount = 2) {
    try {
      const userId = this.generateUserId();
      
      const response = await fetch(`${this.serverUrl}/api/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: userId,
          hostPlayerName,
          playerCount
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create session');
      }

      console.log('✅ Session created:', data.sessionId);
      return {
        sessionId: data.sessionId,
        userId: userId,
        session: data.session
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Join an existing game session
   */
  async joinSession(sessionId, playerName) {
    try {
      if (!this.socket || !this.isConnected) {
        await this.connect();
      }

      // Generate or retrieve user ID
      const userId = this.getUserId();
      
      this.sessionId = sessionId;
      this.userId = userId;
      this.playerName = playerName;

      // Send join request
      return new Promise((resolve, reject) => {
        // Listen for session update confirmation
        const timeout = setTimeout(() => {
          reject(new Error('Join timeout'));
        }, 5000);

        this.on('onSessionUpdate', (session) => {
          clearTimeout(timeout);
          resolve(session);
        });

        this.on('onSessionError', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message));
        });

        this.socket.emit('session:join', {
          sessionId,
          userId,
          playerName
        });
      });
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  }

  /**
   * Mark player as ready
   */
  setReady(ready = true) {
    if (!this.socket || !this.sessionId) {
      console.error('Not connected to a session');
      return;
    }

    this.socket.emit('player:ready', {
      sessionId: this.sessionId,
      userId: this.userId,
      ready
    });
  }

  /**
   * Start the game (host only)
   */
  startGame(initialGameState) {
    if (!this.socket || !this.sessionId) {
      console.error('Not connected to a session');
      return;
    }

    this.socket.emit('session:start', {
      sessionId: this.sessionId,
      userId: this.userId,
      initialGameState
    });
  }

  /**
   * Send player action to server
   */
  sendAction(actionType, gameState = null, additionalData = {}) {
    if (!this.socket || !this.sessionId) {
      console.error('Not connected to a session');
      return;
    }

    const action = {
      type: actionType,
      gameState: gameState,
      timestamp: Date.now(),
      ...additionalData
    };

    console.log(`📤 Sending action: ${actionType}`);

    this.socket.emit('player:action', {
      sessionId: this.sessionId,
      userId: this.userId,
      action
    });
  }

  /**
   * Request game state synchronization
   */
  syncGameState() {
    if (!this.socket || !this.sessionId) {
      console.error('Not connected to a session');
      return;
    }

    this.socket.emit('gameState:sync', {
      sessionId: this.sessionId
    });
  }

  /**
   * Leave current session
   */
  leaveSession() {
    if (!this.socket || !this.sessionId) {
      return;
    }

    this.socket.emit('session:leave', {
      sessionId: this.sessionId,
      userId: this.userId
    });

    this.sessionId = null;
    this.userId = null;
    this.playerName = null;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.leaveSession();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Register event callback
   */
  on(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].push(callback);
    }
  }

  /**
   * Remove event callback
   */
  off(eventName, callback) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName] = this.callbacks[eventName].filter(cb => cb !== callback);
    }
  }

  /**
   * Trigger event callbacks
   */
  trigger(eventName, data) {
    if (this.callbacks[eventName]) {
      this.callbacks[eventName].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventName} callback:`, error);
        }
      });
    }
  }

  /**
   * Generate unique user ID
   */
  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Get or create user ID (persisted in localStorage)
   */
  getUserId() {
    let userId = localStorage.getItem('risk_multiplayer_userId');
    
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('risk_multiplayer_userId', userId);
    }

    return userId;
  }

  /**
   * Check if it's currently this player's turn
   */
  checkIsMyTurn() {
    return this.isMyTurn;
  }

  /**
   * Get current player name
   */
  getCurrentPlayerName() {
    return this.currentPlayerName;
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      playerName: this.playerName,
      isConnected: this.isConnected,
      isMyTurn: this.isMyTurn
    };
  }

  // ============================================
  // RECONNECTION & PERSISTENCE EXTENSIONS
  // ============================================

  /**
   * 🔄 Attempt to reconnect to session
   */
  async attemptReconnection() {
    if (this.isReconnecting) {
      console.log('⚠️ Reconnection already in progress');
      return;
    }

    this.isReconnecting = true;
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);

    try {
      // Try to restore session from localStorage
      const savedSession = this.loadSessionFromLocalStorage();

      if (!savedSession) {
        throw new Error('No saved session found');
      }

      // Reconnect to server
      await this.connect();

      // Rejoin session
      await this.rejoinSession(
        savedSession.sessionId,
        savedSession.userId,
        savedSession.playerName
      );

      // Restore game state if available
      if (window.GameStateManager && savedSession.gameState) {
        window.GameStateManager.restoreFromPersistence(savedSession.gameState);
      }

      console.log('✅ Reconnection successful');
      this.reconnectAttempts = 0;
      this.isReconnecting = false;

      // Trigger reconnection success callback
      this.trigger('onReconnect', savedSession);

      return true;
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Exponential backoff
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        console.log(`⏳ Retrying in ${delay / 1000}s...`);

        setTimeout(() => {
          this.isReconnecting = false;
          this.attemptReconnection();
        }, delay);

        return false;
      } else {
        console.error('❌ Max reconnection attempts reached');
        this.isReconnecting = false;
        this.trigger('onReconnectFailed');
        return false;
      }
    }
  }

  /**
   * 🔄 Rejoin an existing session (for reconnection)
   */
  async rejoinSession(sessionId, userId, playerName) {
    try {
      if (!this.socket || !this.isConnected) {
        await this.connect();
      }

      this.sessionId = sessionId;
      this.userId = userId;
      this.playerName = playerName;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Rejoin timeout'));
        }, 5000);

        this.on('onSessionUpdate', (session) => {
          clearTimeout(timeout);
          resolve(session);
        });

        this.on('onSessionError', (error) => {
          clearTimeout(timeout);
          reject(new Error(error.message));
        });

        // Emit rejoin request
        this.socket.emit('session:rejoin', {
          sessionId,
          userId,
          playerName
        });
      });
    } catch (error) {
      console.error('Failed to rejoin session:', error);
      throw error;
    }
  }

  /**
   * 💾 Save session data to localStorage
   */
  saveSessionToLocalStorage(additionalData = {}) {
    try {
      const sessionData = {
        sessionId: this.sessionId,
        userId: this.userId,
        playerName: this.playerName,
        timestamp: Date.now(),
        savedAt: new Date().toISOString(),
        ...additionalData
      };

      // Save game state if available
      if (window.GameStateManager) {
        sessionData.gameState = window.GameStateManager.serializeForPersistence(this.sessionId);
      }

      localStorage.setItem('risk_multiplayer_currentSession', JSON.stringify(sessionData));
      console.log('💾 Session saved to localStorage');
      return true;
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      return false;
    }
  }

  /**
   * 📂 Load session data from localStorage
   */
  loadSessionFromLocalStorage() {
    try {
      const data = localStorage.getItem('risk_multiplayer_currentSession');

      if (!data) {
        console.log('📭 No saved session in localStorage');
        return null;
      }

      const sessionData = JSON.parse(data);

      // Check if data is too old (24 hours)
      const age = Date.now() - (sessionData.timestamp || 0);
      if (age > 24 * 60 * 60 * 1000) {
        console.warn('⚠️ Saved session is too old (>24h)');
        this.clearSessionFromLocalStorage();
        return null;
      }

      console.log('✅ Session loaded from localStorage');
      return sessionData;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      return null;
    }
  }

  /**
   * 🗑️ Clear session data from localStorage
   */
  clearSessionFromLocalStorage() {
    try {
      localStorage.removeItem('risk_multiplayer_currentSession');
      console.log('🗑️ Session cleared from localStorage');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
      return false;
    }
  }

  /**
   * 🔌 Handle disconnect event with reconnection
   */
  setupAutoReconnect() {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('🔌 Disconnected:', reason);

      // Save current session before attempting reconnection
      this.saveSessionToLocalStorage();

      // Trigger disconnect callback
      this.trigger('onDisconnect', { reason });

      // Attempt automatic reconnection for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server disconnected the client - don't auto-reconnect
        console.log('⚠️ Server disconnected client - manual reconnection required');
        this.trigger('onManualReconnectRequired');
      } else {
        // Network issue or other reason - auto-reconnect
        console.log('🔄 Attempting auto-reconnection...');
        this.attemptReconnection();
      }
    });

    // Add reconnection event callback support
    if (!this.callbacks.onReconnect) {
      this.callbacks.onReconnect = [];
    }
    if (!this.callbacks.onReconnectFailed) {
      this.callbacks.onReconnectFailed = [];
    }
    if (!this.callbacks.onManualReconnectRequired) {
      this.callbacks.onManualReconnectRequired = [];
    }
  }

  /**
   * 🔄 Sync game state with server (for reconnection)
   */
  syncGameState() {
    if (!this.socket || !this.sessionId) {
      console.warn('⚠️ Cannot sync - not connected or no session');
      return;
    }

    this.socket.emit('game:syncRequest', {
      sessionId: this.sessionId,
      userId: this.userId
    });

    console.log('🔄 Game state sync requested');
  }
}

// Make available globally
window.MultiplayerClient = MultiplayerClient;
