/**
 * MultiplayerClient - Client-side multiplayer handler for Risk Game
 * Manages WebSocket connection and synchronization with server
 */

class MultiplayerClient {
  constructor(serverUrl = null) {
    // FORCE PRODUCTION MODE - ALWAYS USE CURRENT HOST
    if (!serverUrl) {
      // Check if we're on Render
      const isRender = window.location.hostname.includes('onrender.com');
      const isProduction = window.location.protocol === 'https:';
      
      if (isRender || isProduction) {
        // Production: use the same origin as the page
        serverUrl = window.location.origin;
        console.log('🌐 Production mode detected - Render server');
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development
        serverUrl = 'http://localhost:3000';
        console.log('🌐 Development mode - localhost');
      } else {
        // Fallback: use current origin
        serverUrl = window.location.origin;
        console.log('🌐 Using current origin:', serverUrl);
      }
    }
    
    this.serverUrl = serverUrl;
    this.socket = null;
    this.sessionId = null;
    this.userId = this.generateUserId();
    this.isConnected = false;
    
    console.log('🎮 MultiplayerClient initialized');
    console.log('🌐 Server URL:', this.serverUrl);
    console.log('🌐 Hostname:', window.location.hostname);
    console.log('🌐 Protocol:', window.location.protocol);
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
}

// Make available globally
window.MultiplayerClient = MultiplayerClient;
