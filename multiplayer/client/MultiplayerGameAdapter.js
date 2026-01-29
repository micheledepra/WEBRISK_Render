/**
 * MultiplayerGameAdapter.js
 * 
 * Adapts the single-player Risk game for multiplayer functionality.
 * Intercepts game actions and synchronizes state with the multiplayer server.
 */

class MultiplayerGameAdapter {
    constructor(multiplayerClient, sessionId) {
        this.client = multiplayerClient;
        this.sessionId = sessionId;
        this.isMyTurn = false;
        this.myPlayerId = null;
        this.currentPlayerId = null;
        this.isInitialized = false;
        
        console.log('🎮 MultiplayerGameAdapter initialized');
        
        // Set up event listeners from server
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for game state updates from server
        this.client.on('onGameStateUpdate', (data) => {
            console.log('📥 Received game state update:', data);
            this.handleStateUpdate(data);
        });
        
        // Listen for turn changes
        this.client.on('onTurnStart', (data) => {
            console.log('🔄 Turn changed:', data);
            this.handleTurnChange(data);
        });
        
        // Listen for session updates
        this.client.on('onSessionUpdate', (data) => {
            console.log('📊 Session update:', data);
            if (data.state === 'playing') {
                this.handleGameStart(data);
            }
        });
        
        // Listen for errors
        this.client.on('onError', (error) => {
            console.error('❌ Game error:', error);
            this.showNotification(error.message, 'error');
        });
        
        this.client.on('onTurnValidationError', (error) => {
            console.error('❌ Turn validation error:', error);
            this.showNotification(error.message, 'error');
        });
        
        // Listen for connection status
        this.client.on('onConnect', () => {
            console.log('✅ Connected to multiplayer server');
            this.updateConnectionStatus(true);
        });
        
        this.client.on('onDisconnect', () => {
            console.log('⚠️ Disconnected from multiplayer server');
            this.updateConnectionStatus(false);
            this.showNotification('Disconnected from server', 'warning');
        });
    }
    
    // Initialize the adapter once the game is ready
    initialize(gameInstance) {
        this.game = gameInstance;
        this.myPlayerId = this.client.userId;
        
        // Store original methods to intercept
        this.interceptGameMethods();
        
        // Add multiplayer UI elements
        this.addMultiplayerUI();
        
        this.isInitialized = true;
        console.log('✅ MultiplayerGameAdapter fully initialized');
    }
    
    interceptGameMethods() {
        // Intercept TurnManager methods
        if (window.turnManager) {
            const originalEndTurn = window.turnManager.endTurn.bind(window.turnManager);
            window.turnManager.endTurn = () => {
                if (!this.isMyTurn) {
                    console.warn('⚠️ Not your turn!');
                    this.showNotification('Wait for your turn!', 'warning');
                    return;
                }
                
                // Send end turn action to server
                this.sendAction('endTurn', {});
                originalEndTurn();
            };
        }
        
        // Intercept attack actions
        if (window.attackManager) {
            const originalAttack = window.attackManager.attack.bind(window.attackManager);
            window.attackManager.attack = (from, to, armies) => {
                if (!this.isMyTurn) {
                    this.showNotification('Wait for your turn!', 'warning');
                    return;
                }
                
                // Send attack action to server
                this.sendAction('attack', { from, to, armies });
                return originalAttack(from, to, armies);
            };
        }
        
        // Intercept reinforcement/deployment
        if (window.gameState && window.gameState.placeArmy) {
            const originalPlaceArmy = window.gameState.placeArmy.bind(window.gameState);
            window.gameState.placeArmy = (territoryId, count) => {
                if (!this.isMyTurn) {
                    this.showNotification('Wait for your turn!', 'warning');
                    return false;
                }
                
                // Send place army action to server
                this.sendAction('placeArmy', { territoryId, count });
                return originalPlaceArmy(territoryId, count);
            };
        }
        
        // Intercept fortification
        if (window.fortificationManager) {
            const originalFortify = window.fortificationManager.fortify.bind(window.fortificationManager);
            window.fortificationManager.fortify = (from, to, armies) => {
                if (!this.isMyTurn) {
                    this.showNotification('Wait for your turn!', 'warning');
                    return;
                }
                
                // Send fortify action to server
                this.sendAction('fortify', { from, to, armies });
                return originalFortify(from, to, armies);
            };
        }
    }
    
    sendAction(type, data) {
        console.log(`📤 Sending action: ${type}`, data);
        
        // Use the client's sendAction method with proper parameters
        this.client.sendAction(type, window.gameState, {
            ...data,
            playerId: this.myPlayerId,
            sessionId: this.sessionId,
            timestamp: Date.now()
        });
    }
    
    handleStateUpdate(stateData) {
        // Update local game state from server
        if (this.game && window.gameState) {
            // Merge server state into local state
            if (stateData.territories) {
                Object.assign(window.gameState.territories, stateData.territories);
            }
            
            if (stateData.players) {
                window.gameState.players = stateData.players;
            }
            
            // Update UI
            if (window.riskUI && window.riskUI.updateDisplay) {
                window.riskUI.updateDisplay();
            }
        }
    }
    
    handleTurnChange(data) {
        this.currentPlayerId = data.currentPlayerId;
        this.isMyTurn = (this.currentPlayerId === this.myPlayerId);
        
        console.log(`🎯 Turn changed. My turn: ${this.isMyTurn}`);
        
        // Update UI to show whose turn it is
        this.updateTurnIndicator(data.currentPlayerName);
        
        // Show/hide waiting overlay
        if (this.isMyTurn) {
            this.hideWaitingOverlay();
            this.showNotification("It's your turn!", 'success');
        } else {
            this.showWaitingOverlay(data.currentPlayerName);
        }
        
        // Enable/disable controls
        this.setControlsEnabled(this.isMyTurn);
    }
    
    handleGameStart(data) {
        console.log('🎮 Multiplayer game starting...');
        
        // Get current player info from session data
        if (data.players) {
            const playersArray = Array.from(Object.values(data.players));
            const currentPlayerIndex = data.currentPlayerIndex || 0;
            const currentPlayer = playersArray[currentPlayerIndex];
            
            if (currentPlayer) {
                this.currentPlayerId = currentPlayer.id || currentPlayer.socketId;
                this.isMyTurn = (this.currentPlayerId === this.myPlayerId);
                
                if (!this.isMyTurn) {
                    this.showWaitingOverlay(currentPlayer.playerName || 'Opponent');
                }
                
                this.updateTurnIndicator(currentPlayer.playerName || 'Player');
            }
        }
    }
    
    // UI Methods
    addMultiplayerUI() {
        // Add waiting overlay
        const overlay = document.createElement('div');
        overlay.id = 'multiplayer-waiting-overlay';
        overlay.className = 'waiting-overlay hidden';
        overlay.innerHTML = `
            <div class="waiting-content">
                <div class="waiting-spinner"></div>
                <h2>Waiting for opponent...</h2>
                <p id="waiting-player-name"></p>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Add turn indicator
        const turnIndicator = document.createElement('div');
        turnIndicator.id = 'multiplayer-turn-indicator';
        turnIndicator.className = 'turn-indicator';
        turnIndicator.innerHTML = `
            <span class="turn-badge">Current Turn: <strong id="current-turn-player"></strong></span>
        `;
        document.body.appendChild(turnIndicator);
        
        // Add connection status
        const connectionStatus = document.createElement('div');
        connectionStatus.id = 'multiplayer-connection-status';
        connectionStatus.className = 'connection-status connected';
        connectionStatus.innerHTML = `
            <span class="status-dot"></span>
            <span class="status-text">Connected</span>
        `;
        document.body.appendChild(connectionStatus);
        
        // Add styles
        this.addMultiplayerStyles();
    }
    
    addMultiplayerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .waiting-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
            }
            
            .waiting-overlay.hidden {
                display: none;
            }
            
            .waiting-content {
                text-align: center;
                color: white;
            }
            
            .waiting-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .turn-indicator {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 16px;
            }
            
            .turn-badge strong {
                color: #ffd700;
            }
            
            .connection-status {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 15px;
                border-radius: 8px;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #0f0;
                animation: pulse 2s infinite;
            }
            
            .connection-status.disconnected .status-dot {
                background: #f00;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .notification {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10001;
                padding: 15px 25px;
                border-radius: 8px;
                font-size: 16px;
                animation: slideDown 0.3s ease-out;
            }
            
            .notification.success {
                background: #4caf50;
                color: white;
            }
            
            .notification.error {
                background: #f44336;
                color: white;
            }
            
            .notification.warning {
                background: #ff9800;
                color: white;
            }
            
            @keyframes slideDown {
                from {
                    transform: translate(-50%, -100%);
                    opacity: 0;
                }
                to {
                    transform: translate(-50%, 0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    showWaitingOverlay(playerName) {
        const overlay = document.getElementById('multiplayer-waiting-overlay');
        const nameElement = document.getElementById('waiting-player-name');
        if (overlay) {
            nameElement.textContent = `${playerName}'s turn`;
            overlay.classList.remove('hidden');
        }
    }
    
    hideWaitingOverlay() {
        const overlay = document.getElementById('multiplayer-waiting-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
    
    updateTurnIndicator(playerName) {
        const indicator = document.getElementById('current-turn-player');
        if (indicator) {
            indicator.textContent = playerName;
            
            // Highlight if it's my turn
            const badge = document.querySelector('.turn-badge');
            if (badge) {
                if (this.isMyTurn) {
                    badge.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
                } else {
                    badge.style.background = 'rgba(0, 0, 0, 0.8)';
                }
            }
        }
    }
    
    setControlsEnabled(enabled) {
        // Enable or disable game controls based on turn
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            if (enabled) {
                gameContainer.classList.remove('controls-disabled');
            } else {
                gameContainer.classList.add('controls-disabled');
            }
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    updateConnectionStatus(connected) {
        const status = document.getElementById('multiplayer-connection-status');
        const text = status?.querySelector('.status-text');
        
        if (status) {
            if (connected) {
                status.classList.remove('disconnected');
                status.classList.add('connected');
                if (text) text.textContent = 'Connected';
            } else {
                status.classList.remove('connected');
                status.classList.add('disconnected');
                if (text) text.textContent = 'Disconnected';
            }
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerGameAdapter;
}
