/**
 * MultiplayerGameAdapter - Adapts single-player Risk game for multiplayer
 * Intercepts game actions and syncs with server
 */

class MultiplayerGameAdapter {
  constructor(client, gameState, turnManager) {
    this.client = client;
    this.gameState = gameState;
    this.turnManager = turnManager;
    this.isInitialized = false;
    this.originalMethods = {};
    
    console.log('🎮 MultiplayerGameAdapter initialized');
  }

  /**
   * Initialize multiplayer hooks
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    // Setup event listeners
    this.setupEventListeners();
    
    // Intercept game methods
    this.interceptGameMethods();
    
    // Request initial sync
    this.client.syncGameState();
    
    this.isInitialized = true;
    console.log('✅ Multiplayer adapter ready');
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
