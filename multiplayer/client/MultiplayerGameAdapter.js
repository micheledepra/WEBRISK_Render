/**
 * MultiplayerGameAdapter - Adapts single-player Risk game for multiplayer
 * Bridges multiplayer session data to existing single-player game structures
 * WITHOUT duplicating UI functions - leverages existing turn management
 */

class MultiplayerGameAdapter {
  constructor(client, sessionId, userId, playerName, userToPlayerMap) {
    this.client = client;
    this.sessionId = sessionId;
    this.userId = userId;
    this.playerName = playerName;
    this.userToPlayerMap = userToPlayerMap || {};
    
    // Will be set in initialize()
    this.gameState = null;
    this.riskUI = null;
    this.turnManager = null;
    this.phaseManager = null;
    
    this.isInitialized = false;
    this.originalMethods = {};
    this.playerToUserMap = {};
    
    // Create reverse mapping
    Object.entries(this.userToPlayerMap).forEach(([userId, playerName]) => {
      this.playerToUserMap[playerName] = userId;
    });
    
    console.log('🎮 MultiplayerGameAdapter initialized');
  }
  
  /**
   * Initialize the adapter with game references
   * FIXED: Accepts pre-initialized gameState and proper player mapping
   */
  async initialize(gameRefs) {
    console.log('🚀 Initializing multiplayer game with session:', {
      sessionId: this.sessionId,
      userId: this.userId,
      playerName: this.playerName,
      userToPlayerMap: this.userToPlayerMap
    });
    
    // Store references
    this.gameState = gameRefs.gameState;
    this.riskUI = gameRefs.riskUI;
    this.turnManager = gameRefs.turnManager;
    this.phaseManager = gameRefs.phaseManager;
    
    // Verify critical references
    if (!this.gameState) {
      console.error('❌ GameState not provided to adapter!');
      throw new Error('GameState is required for multiplayer adapter');
    }
    
    console.log('✅ Game references stored:', {
      gameState: !!this.gameState,
      riskUI: !!this.riskUI,
      turnManager: !!this.turnManager,
      phaseManager: !!this.phaseManager
    });
    
    // Verify player name mapping
    if (!this.playerName || this.playerName === 'undefined') {
      console.error('❌ Invalid player name!', {
        playerName: this.playerName,
        userId: this.userId,
        mapping: this.userToPlayerMap
      });
      throw new Error('Player name not properly mapped');
    }
    
    console.log('✅ Player mapping verified:', {
      myPlayer: this.playerName,
      currentPlayer: this.gameState.getCurrentPlayer(),
      allPlayers: this.gameState.players
    });
    
    // Setup turn management
    this.setupMultiplayerTurnManagement();
    console.log('✅ Game initialized with player mapping');
    
    // Intercept game actions
    this.interceptGameActions();
    console.log('✅ Game action interceptors active');
    
    // Register multiplayer event listeners
    this.registerMultiplayerListeners();
    console.log('✅ Multiplayer listeners registered');
    
    this.isInitialized = true;
    return true;
  }

  /**
   * DEPRECATED - Kept for backward compatibility
   */
  async initializeGame(sessionData) {
    console.warn('⚠️ initializeGame() is deprecated, use initialize() instead');
    return this.initialize({
      gameState: window.gameState,
      riskUI: window.riskUI,
      turnManager: window.turnManager,
      phaseManager: window.riskUI?.phaseManager
    });
  }

  
  /**
   * Setup multiplayer-specific turn management
   * Extends existing single-player turn system
   * FIXED: Only runs when GameState is available
   */
  setupMultiplayerTurnManagement() {
    if (!this.gameState) {
      console.error('❌ GameState not available for turn management');
      return;
    }
    
    console.log('🎮 Setting up multiplayer turn management');
    
    // Store original advancePhase if available
    if (this.turnManager && typeof this.turnManager.advancePhase === 'function') {
      const originalAdvancePhase = this.turnManager.advancePhase.bind(this.turnManager);
      
      // Intercept phase advancement
      this.turnManager.advancePhase = () => {
        console.log('🔄 Intercepting phase advance');
        
        // Check if it's current player's turn
        const currentPlayer = this.gameState.getCurrentPlayer();
        if (currentPlayer !== this.playerName) {
          console.warn('⚠️ Not your turn! Current:', currentPlayer, 'You:', this.playerName);
          return;
        }
        
        // Execute original phase advance
        originalAdvancePhase();
        
        // Broadcast state change
        this.broadcastGameState('phaseAdvance');
      };
      
      console.log('✅ Phase advancement intercepted');
    }
    
    // Intercept existing turn advancement
    if (this.gameState.advanceToNextPlayer) {
      const originalAdvanceTurn = this.gameState.advanceToNextPlayer.bind(this.gameState);
      
      this.gameState.advanceToNextPlayer = () => {
        if (!this.checkIsMyTurn()) {
          console.log('⏭️ Not my turn, blocking local advance');
          this.showNotification("It's not your turn!", 'warning');
          return;
        }
        
        // Allow local advance, then sync to server
        originalAdvanceTurn();
        this.client.emitEndTurn(this.sessionId);
      };
    }
    
    // Intercept phase transitions
    if (this.phaseManager && this.phaseManager.endCurrentPhase) {
      const originalEndPhase = this.phaseManager.endCurrentPhase.bind(this.phaseManager);
      
      this.phaseManager.endCurrentPhase = (options) => {
        if (!this.checkIsMyTurn()) {
          this.showNotification("It's not your turn!", 'warning');
          return;
        }
        
        // Allow local phase end, then sync
        originalEndPhase(options);
        this.client.emitPhaseComplete(this.sessionId, this.gameState.phase);
      };
    }
    
    // Update turn controls to show user names (already done via initGame)
    this.updateTurnControls();
    
    console.log('✅ Multiplayer turn management active');
  }
  
  /**
   * Check if current turn belongs to this user
   */
  checkIsMyTurn() {
    if (!this.gameState) return false;
    
    const currentPlayerName = this.gameState.getCurrentPlayer();
    const currentUserId = this.playerToUserMap.get(currentPlayerName);
    const isMyTurn = currentUserId === this.userId;
    
    // Sync to global state for UI
    window.multiplayerState.isMyTurn = isMyTurn;
    window.multiplayerState.currentPlayerName = currentPlayerName;
    
    return isMyTurn;
  }
  
  /**
   * Update turn controls based on whose turn it is
   * Disables/enables existing UI without duplicating it
   */
  updateTurnControls() {
    const isMyTurn = this.checkIsMyTurn();
    
    // Disable/enable phase buttons for spectators
    const phaseButtons = document.querySelectorAll(
      '.end-turn-btn, .skip-phase-btn, .end-phase-btn, [data-phase-action], button[onclick*="endTurn"], button[onclick*="skipPhase"]'
    );
    
    phaseButtons.forEach(btn => {
      btn.disabled = !isMyTurn;
      btn.style.opacity = isMyTurn ? '1' : '0.5';
      btn.style.cursor = isMyTurn ? 'pointer' : 'not-allowed';
      
      if (!isMyTurn) {
        btn.title = `Wait for ${window.multiplayerState.currentPlayerName}'s turn`;
      } else {
        btn.title = '';
      }
    });
    
    // Update waiting overlay (existing multiplayer HUD)
    this.updateWaitingOverlay(!isMyTurn);
    
    // Update turn indicator (reuse existing single-player UI)
    this.updateTurnIndicator();
    
    console.log(isMyTurn ? '✅ Your turn - controls enabled' : '⏳ Spectating - controls disabled');
  }
  
  /**
   * Update existing turn indicator (single-player UI)
   * No duplication - just updates existing elements
   */
  updateTurnIndicator() {
    if (!this.gameState) return;
    
    const currentPlayerName = this.gameState.getCurrentPlayer();
    const isMyTurn = this.checkIsMyTurn();
    
    // Update player name display (existing element from game.html)
    const playerNameEl = document.querySelector('.current-player-name, .turn-player-name, #current-player-name');
    if (playerNameEl) {
      playerNameEl.textContent = currentPlayerName;
      playerNameEl.style.color = isMyTurn ? '#4caf50' : '#ffd700';
      playerNameEl.style.fontWeight = isMyTurn ? 'bold' : 'normal';
    }
    
    // Update turn status message (existing element)
    const turnStatusEl = document.querySelector('.turn-status, .phase-indicator, #turn-status');
    if (turnStatusEl) {
      turnStatusEl.textContent = isMyTurn ? '🟢 YOUR TURN' : `⏳ ${currentPlayerName}'s Turn`;
    }
    
    // Update player list highlighting (existing element from game.html)
    const playerItems = document.querySelectorAll('.player-turn-item, [data-player-name]');
    playerItems.forEach(item => {
      const playerName = item.dataset.playerName || item.textContent.trim();
      item.classList.toggle('current-turn', playerName === currentPlayerName);
      item.classList.toggle('my-turn', playerName === window.multiplayerState.myPlayerName);
    });
    
    // Update multiplayer HUD player name
    const hudPlayerEl = document.getElementById('hud-current-player');
    if (hudPlayerEl) {
      hudPlayerEl.textContent = currentPlayerName;
      hudPlayerEl.style.color = isMyTurn ? '#4caf50' : '#ffd700';
    }
  }
  
  /**
   * Update waiting overlay (multiplayer HUD)
   */
  updateWaitingOverlay(isWaiting) {
    const overlay = document.getElementById('waiting-overlay');
    if (overlay) {
      overlay.classList.toggle('active', isWaiting);
      
      const playerNameEl = document.getElementById('waiting-player-name');
      if (playerNameEl && isWaiting) {
        playerNameEl.textContent = `${window.multiplayerState.currentPlayerName} is playing...`;
      }
    }
  }
  
  /**
   * Sync game state from server
   * Updates existing game structures (no duplication)
   */
  async syncGameState(gameState) {
    console.log('🔄 Syncing game state from server:', gameState);
    
    if (!this.gameState) {
      console.error('❌ GameState not available for sync');
      return;
    }
    
    // Update territories (existing GameState structure)
    if (gameState.territories) {
      Object.entries(gameState.territories).forEach(([territoryId, data]) => {
        const territory = this.gameState.territories.get(territoryId);
        if (territory) {
          // Map owner userId → playerName
          const ownerName = this.userToPlayerMap.get(data.owner) || data.owner;
          territory.owner = ownerName;
          territory.armies = data.armies;
        }
      });
    }
    
    // Update current player (existing GameState)
    if (gameState.currentPlayer !== undefined) {
      const currentPlayerName = this.userToPlayerMap.get(gameState.currentPlayer) || 
                                 this.gameState.players[gameState.currentPlayer];
      
      // Find player index by name
      const playerIndex = this.gameState.players.indexOf(currentPlayerName);
      if (playerIndex !== -1) {
        this.gameState.currentPlayerIndex = playerIndex;
      }
    }
    
    // Update phase (existing PhaseManager)
    if (gameState.phase && this.phaseManager) {
      this.phaseManager.currentPhase = gameState.phase;
    }
    
    // Update turn number (use round counter for multiplayer)
    if (gameState.turnNumber !== undefined) {
      const playerCount = this.gameState.players.length;
      const roundNumber = Math.floor(gameState.turnNumber / playerCount) + 1;
      
      this.gameState.turnNumber = gameState.turnNumber;
      
      // Update turn counter display (existing UI element)
      const turnCounterEl = document.querySelector('.turn-counter, [data-turn-number], #turn-number');
      if (turnCounterEl) {
        turnCounterEl.textContent = `Round ${roundNumber}`;
        turnCounterEl.title = `Turn ${gameState.turnNumber} (Round ${roundNumber} of gameplay)`;
      }
    }
    
    // Re-render map with updated state (existing RiskMap)
    if (this.game.riskMap && this.game.riskMap.updateAllTerritories) {
      this.game.riskMap.updateAllTerritories();
    }
    
    // Update turn controls for new state
    this.updateTurnControls();
    
    console.log('✅ Game state synced');
  }
  
  /**
   * Broadcast game state to other players
   */
  broadcastGameState(action) {
    if (!this.client || !this.client.socket) {
      console.error('❌ Client not available for broadcast');
      return;
    }
    
    if (!this.gameState) {
      console.error('❌ GameState not available for broadcast');
      return;
    }
    
    const stateData = {
      action: action,
      sessionId: this.sessionId,
      currentPlayer: this.gameState.getCurrentPlayer(),
      phase: this.gameState.phase,
      turnNumber: this.gameState.turnNumber,
      timestamp: Date.now()
    };
    
    console.log('📤 Broadcasting game state:', stateData);
    this.client.socket.emit('gameStateUpdate', stateData);
  }
  
  /**
   * Handle turn change from server
   */
  handleTurnChange(data) {
    console.log('🔄 Turn changed:', data);
    
    if (!this.gameState) return;
    
    // Map userId → playerName
    const newPlayerName = this.userToPlayerMap.get(data.currentPlayerId) || data.currentPlayerName;
    
    // Update game state (existing structure)
    const playerIndex = this.gameState.players.indexOf(newPlayerName);
    if (playerIndex !== -1) {
      this.gameState.currentPlayerIndex = playerIndex;
    }
    
    // Update phase if provided
    if (data.phase && this.phaseManager) {
      this.phaseManager.currentPhase = data.phase;
    }
    
    // Update turn number (round counter)
    if (data.turnNumber !== undefined) {
      this.gameState.turnNumber = data.turnNumber;
      
      const playerCount = this.gameState.players.length;
      const roundNumber = Math.floor(data.turnNumber / playerCount) + 1;
      
      const turnCounterEl = document.querySelector('.turn-counter, [data-turn-number], #turn-number');
      if (turnCounterEl) {
        turnCounterEl.textContent = `Round ${roundNumber}`;
        turnCounterEl.title = `Turn ${data.turnNumber} (Round ${roundNumber} of gameplay)`;
      }
    }
    
    // Update UI controls (existing functions)
    this.updateTurnControls();
    
    // Show notification
    const isMyTurn = this.checkIsMyTurn();
    if (isMyTurn) {
      this.showNotification(`Your turn! Phase: ${data.phase || 'Deploy'}`, 'success');
    } else {
      this.showNotification(`${newPlayerName}'s turn`, 'info');
    }
  }
  
  /**
   * Handle player disconnection
   * Auto-skip with notification
   */
  handlePlayerDisconnected(data) {
    console.log('🔌 Player disconnected:', data);
    
    const playerName = this.userToPlayerMap.get(data.userId) || data.playerName;
    
    // Show notification
    this.showNotification(`${playerName} disconnected - skipping their turn`, 'warning');
    
    // Mark player as disconnected (existing GameState structure)
    if (this.gameState) {
      const playerIndex = this.gameState.players.indexOf(playerName);
      if (playerIndex !== -1) {
        // Add disconnected flag to player
        if (!this.gameState.playerStates) {
          this.gameState.playerStates = {};
        }
        this.gameState.playerStates[playerName] = { disconnected: true };
      }
    }
    
    // If it was their turn, server will advance automatically
    // Just update UI
    this.updateTurnControls();
  }
  
  /**
   * Handle player reconnection
   */
  handlePlayerReconnected(data) {
    const playerName = this.userToPlayerMap.get(data.userId) || data.playerName;
    this.showNotification(`${playerName} reconnected`, 'success');
    
    // Remove disconnected flag
    if (this.gameState && this.gameState.playerStates?.[playerName]) {
      this.gameState.playerStates[playerName].disconnected = false;
    }
  }
  
  /**
   * Show notification (reuse existing notification system)
   */
  showNotification(message, type = 'info') {
    // Try existing notification systems
    if (this.riskUI && this.riskUI.showNotification) {
      this.riskUI.showNotification(message, type);
    } else if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      // Fallback: console log
      const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️';
      console.log(`${icon} ${message}`);
    }
  }
  
  /**
   * Intercept game actions for validation
   * Alias for setupActionInterceptors()
   */
  interceptGameActions() {
    return this.setupActionInterceptors();
  }
  
  /**
   * Intercept game actions for validation
   */
  setupActionInterceptors() {
    if (!this.game) return;
    
    // Attack action
    if (this.game.handleAttack) {
      const originalAttack = this.game.handleAttack.bind(this.game);
      this.game.handleAttack = (...args) => {
        if (!this.checkIsMyTurn()) {
          this.showNotification("It's not your turn!", 'warning');
          return;
        }
        return originalAttack(...args);
      };
    }

    // Reinforce action
    if (this.game.handleReinforce) {
      const originalReinforce = this.game.handleReinforce.bind(this.game);
      this.game.handleReinforce = (...args) => {
        if (!this.checkIsMyTurn()) {
          this.showNotification("It's not your turn!", 'warning');
          return;
        }
        return originalReinforce(...args);
      };
    }

    // Fortify action
    if (this.game.handleFortify) {
      const originalFortify = this.game.handleFortify.bind(this.game);
      this.game.handleFortify = (...args) => {
        if (!this.checkIsMyTurn()) {
          this.showNotification("It's not your turn!", 'warning');
          return;
        }
        return originalFortify(...args);
      };
    }

    console.log('✅ Game action interceptors active');
  }
  
  /**
   * Register all multiplayer event listeners
   * Alias for registerListeners()
   */
  registerMultiplayerListeners() {
    return this.registerListeners();
  }
  
  /**
   * Register all multiplayer event listeners
   */
  registerListeners() {
    if (!this.client || !this.client.socket) {
      console.error('❌ MultiplayerClient not available');
      return;
    }

    // Turn change
    this.client.socket.on('turnStart', (data) => {
      this.handleTurnChange(data);
    });

    // Game state sync
    this.client.socket.on('gameStateUpdate', (data) => {
      this.syncGameState(data.gameState || data);
    });

    // Player disconnection
    this.client.socket.on('playerDisconnected', (data) => {
      this.handlePlayerDisconnected(data);
    });

    // Player reconnection
    this.client.socket.on('playerReconnected', (data) => {
      this.handlePlayerReconnected(data);
    });

    console.log('✅ Multiplayer listeners registered');
  }

  /**
   * Initialize multiplayer hooks (legacy compatibility)
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Setup event listeners (legacy)
    this.setupEventListeners();
    
    // Intercept game methods (legacy)
    this.interceptGameMethods();
    
    // Register new listeners
    this.registerListeners();
    
    // Setup action interceptors
    this.setupActionInterceptors();
    
    // Request initial sync (only if connected and session exists)
    if (this.client.socket && this.client.sessionId) {
      this.client.syncGameState();
    } else {
      console.log('⏳ Skipping initial sync - will sync when session is established');
    }
    
    this.isInitialized = true;
    console.log('✅ Multiplayer adapter ready (legacy mode)');
  }

  /**
   * Setup multiplayer event listeners
   */
  setupEventListeners() {
    // Game state updates from server
    this.client.on('onGameStateUpdate', (serverState) => {
      console.log('📥 Applying server game state');
      this.applyServerGameState(serverState);
    });

    // Turn start notifications
    this.client.on('onTurnStart', (data) => {
      console.log(`🔄 Turn: ${data.currentPlayerName} (${data.turnNumber})`);
      this.updateTurnUI(data);
    });

    // Turn validation errors
    this.client.on('onTurnValidationError', (error) => {
      this.showNotification(error.message, 'error');
    });

    // Connection status
    this.client.on('onDisconnect', () => {
      this.showWaitingOverlay('Disconnected from server', 'Reconnecting...');
    });

    this.client.on('onConnect', () => {
      this.hideWaitingOverlay();
      this.client.syncGameState();
    });
  }

  /**
   * Intercept game methods to sync with server
   */
  interceptGameMethods() {
    // Intercept turn advancement
    if (window.handleEndTurn) {
      this.originalMethods.handleEndTurn = window.handleEndTurn;
      window.handleEndTurn = () => this.handleEndTurnMultiplayer();
    }

    // Intercept phase advancement
    if (window.turnManager && window.turnManager.advancePhase) {
      this.originalMethods.advancePhase = window.turnManager.advancePhase.bind(window.turnManager);
      window.turnManager.advancePhase = () => this.advancePhaseMultiplayer();
    }

    // Intercept army deployment
    if (window.handleTerritoryClickForDeploy) {
      this.originalMethods.handleTerritoryClickForDeploy = window.handleTerritoryClickForDeploy;
      window.handleTerritoryClickForDeploy = (territoryId) => 
        this.handleDeployMultiplayer(territoryId);
    }

    console.log('✅ Game methods intercepted for multiplayer');
  }

  /**
   * Handle end turn in multiplayer
   */
  handleEndTurnMultiplayer() {
    if (!this.client.checkIsMyTurn()) {
      this.showNotification("It's not your turn!", 'warning');
      return;
    }

    console.log('📤 Ending turn...');

    // Execute local turn end
    if (this.originalMethods.handleEndTurn) {
      this.originalMethods.handleEndTurn();
    }

    // Send to server
    const currentState = this.captureGameState();
    this.client.sendAction('endTurn', currentState);

    // Show waiting overlay
    this.showWaitingOverlay('Turn ended', 'Waiting for other players...');
  }

  /**
   * Handle phase advancement in multiplayer
   */
  advancePhaseMultiplayer() {
    if (!this.client.checkIsMyTurn()) {
      this.showNotification("It's not your turn!", 'warning');
      return;
    }

    console.log('📤 Advancing phase...');

    // Execute local phase advance
    if (this.originalMethods.advancePhase) {
      this.originalMethods.advancePhase();
    }

    // Send to server
    const currentState = this.captureGameState();
    this.client.sendAction('endPhase', currentState);
  }

  /**
   * Handle army deployment in multiplayer
   */
  handleDeployMultiplayer(territoryId) {
    if (!this.client.checkIsMyTurn()) {
      this.showNotification("It's not your turn!", 'warning');
      return;
    }

    // Execute local deployment
    if (this.originalMethods.handleTerritoryClickForDeploy) {
      this.originalMethods.handleTerritoryClickForDeploy(territoryId);
    }

    // Send to server
    setTimeout(() => {
      const currentState = this.captureGameState();
      this.client.sendAction('deployArmy', currentState, { territoryId });
    }, 100);
  }

  /**
   * Capture current game state
   */
  captureGameState() {
    if (!this.gameState) {
      return null;
    }

    return {
      territories: this.gameState.territories,
      currentPlayerIndex: this.gameState.currentPlayerIndex,
      phase: this.gameState.phase,
      turnNumber: this.gameState.turnNumber,
      reinforcementsLeft: this.gameState.reinforcementsLeft || 0,
      players: this.gameState.players.map(p => ({
        name: p.name,
        color: p.color,
        territories: p.territories || [],
        armies: p.armies || 0
      }))
    };
  }

  /**
   * Apply server game state to local game
   */
  applyServerGameState(serverState) {
    if (!this.gameState || !serverState) {
      return;
    }

    // Update territories
    if (serverState.territories) {
      this.gameState.territories = serverState.territories;
    }

    // Update turn info
    if (serverState.currentPlayerIndex !== undefined) {
      this.gameState.currentPlayerIndex = serverState.currentPlayerIndex;
    }

    if (serverState.phase) {
      this.gameState.phase = serverState.phase;
    }

    if (serverState.turnNumber !== undefined) {
      this.gameState.turnNumber = serverState.turnNumber;
    }

    // Update reinforcements
    if (serverState.reinforcementsLeft !== undefined) {
      this.gameState.reinforcementsLeft = serverState.reinforcementsLeft;
    }

    // Trigger UI update
    if (window.updateTurnManagementUI) {
      window.updateTurnManagementUI();
    }

    if (window.riskUI && window.riskUI.updateTerritoryDisplay) {
      window.riskUI.updateTerritoryDisplay();
    }

    console.log('✅ Game state synchronized');
  }

  /**
   * Update turn UI based on current player
   */
  updateTurnUI(data) {
    const isMyTurn = this.client.checkIsMyTurn();
    
    // Update body class for CSS styling
    if (isMyTurn) {
      document.body.classList.remove('not-my-turn');
      this.hideWaitingOverlay();
      this.showNotification("It's your turn!", 'success');
    } else {
      document.body.classList.add('not-my-turn');
      this.showWaitingOverlay(
        `${data.currentPlayerName}'s Turn`,
        'Waiting for their move...'
      );
    }

    // Update turn indicator
    this.updateTurnIndicator(data.currentPlayerName, isMyTurn);
  }

  /**
   * Update turn indicator badge
   */
  updateTurnIndicator(playerName, isMyTurn) {
    let indicator = document.getElementById('mp-turn-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'mp-turn-indicator';
      indicator.className = 'turn-indicator';
      document.body.appendChild(indicator);
    }

    indicator.className = isMyTurn ? 'turn-indicator your-turn' : 'turn-indicator';
    indicator.innerHTML = `
      <span class="turn-indicator-icon">${isMyTurn ? '🎯' : '⏳'}</span>
      <span class="turn-indicator-text">
        ${isMyTurn ? 'YOUR TURN' : `${playerName}'s Turn`}
      </span>
    `;
  }

  /**
   * Show waiting overlay
   */
  showWaitingOverlay(title, message) {
    let overlay = document.getElementById('mp-waiting-overlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mp-waiting-overlay';
      overlay.className = 'multiplayer-overlay';
      overlay.innerHTML = `
        <div class="overlay-content">
          <h2 id="overlay-title">Waiting</h2>
          <div class="waiting-spinner"></div>
          <p id="overlay-message">Please wait...</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-message').textContent = message;
    overlay.classList.add('active');
  }

  /**
   * Hide waiting overlay
   */
  hideWaitingOverlay() {
    const overlay = document.getElementById('mp-waiting-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `mp-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Update connection status badge
   */
  updateConnectionStatus(connected) {
    let badge = document.getElementById('mp-connection-status');
    
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'mp-connection-status';
      badge.className = 'connection-status';
      badge.innerHTML = `
        <div class="connection-dot"></div>
        <span>Connected</span>
      `;
      document.body.appendChild(badge);
    }

    badge.className = connected ? 'connection-status' : 'connection-status disconnected';
    badge.querySelector('span').textContent = connected ? 'Connected' : 'Disconnected';
  }

  /**
   * Create player list panel
   */
  createPlayerListPanel(players) {
    let panel = document.getElementById('mp-players-panel');
    
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'mp-players-panel';
      panel.className = 'multiplayer-players';
      document.body.appendChild(panel);
    }

    const currentPlayerIndex = this.gameState?.currentPlayerIndex || 0;

    panel.innerHTML = `
      <h3>👥 Players</h3>
      ${players.map((player, index) => `
        <div class="player-list-item ${index === currentPlayerIndex ? 'active-turn' : ''} ${player.userId === this.client.userId ? 'you' : ''}">
          <div class="player-info-compact">
            <div class="player-color-indicator" style="background: ${player.color || '#999'};"></div>
            <div>
              <div class="player-name-compact">
                ${player.name}${player.userId === this.client.userId ? ' (You)' : ''}
              </div>
              <div class="player-status-compact connected">Online</div>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  }

  /**
   * Add leave game button
   */
  addLeaveGameButton() {
    if (document.getElementById('mp-leave-btn')) {
      return;
    }

    const button = document.createElement('button');
    button.id = 'mp-leave-btn';
    button.className = 'leave-game-btn';
    button.textContent = '🚪 Leave Game';
    button.onclick = () => {
      if (confirm('Are you sure you want to leave the game?')) {
        this.client.leaveSession();
        window.location.href = '../../index.html';
      }
    };
    document.body.appendChild(button);
  }
}

// Make available globally
window.MultiplayerGameAdapter = MultiplayerGameAdapter;
