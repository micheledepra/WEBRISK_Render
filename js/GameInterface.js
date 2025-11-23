/**
 * Unified Game Interface
 * Provides consistent API for both single-player and multiplayer modes
 * 
 * Single-player: Executes game logic locally
 * Multiplayer: Sends actions to server and receives authoritative results
 */

class GameInterface {
    constructor(isMultiplayer, gameState, multiplayerClient = null, sessionCode = null) {
        this.isMultiplayer = isMultiplayer;
        this.gameState = gameState;
        this.client = multiplayerClient;
        this.sessionCode = sessionCode;
        this.pendingActions = new Map(); // Track pending server responses
        
        console.log(`🎮 GameInterface: ${isMultiplayer ? 'MULTIPLAYER' : 'SINGLE-PLAYER'} mode`);
        
        if (isMultiplayer && !multiplayerClient) {
            console.warn('⚠️ Multiplayer mode enabled but no client provided');
        }
        
        if (isMultiplayer && sessionCode) {
            console.log(`   📍 Session: ${sessionCode}`);
            this.setupMultiplayerListeners();
        }
    }

    /**
     * Setup server event listeners for multiplayer
     */
    setupMultiplayerListeners() {
        if (!this.client) return;
        
        // Listen for state updates from server
        this.client.on('game:stateUpdate', (data) => {
            console.log('📡 Server: State update received');
            if (this.gameState.updateFromServer) {
                this.gameState.updateFromServer(data.gameState);
            }
            
            // Resolve pending action
            const actionId = data.action?.type;
            if (actionId && this.pendingActions.has(actionId)) {
                const { resolve } = this.pendingActions.get(actionId);
                resolve(data);
                this.pendingActions.delete(actionId);
            }
        });
        
        // Listen for battle results
        this.client.on('game:battleResult', (data) => {
            console.log('⚔️ Server: Battle result received');
            if (this.gameState.updateFromServer) {
                this.gameState.updateFromServer(data.gameState);
            }
            
            // Resolve pending attack
            if (this.pendingActions.has('attack')) {
                const { resolve } = this.pendingActions.get('attack');
                resolve(data.battleResult);
                this.pendingActions.delete('attack');
            }
        });
        
        // Listen for phase changes
        this.client.on('game:phaseChanged', (data) => {
            console.log(`🔄 Server: Phase changed ${data.oldPhase} → ${data.newPhase}`);
            if (this.gameState.updateFromServer) {
                this.gameState.updateFromServer(data.gameState);
            }
            
            // Resolve pending phase advance
            if (this.pendingActions.has('advancePhase')) {
                const { resolve } = this.pendingActions.get('advancePhase');
                resolve(data);
                this.pendingActions.delete('advancePhase');
            }
        });
        
        // Listen for action failures
        this.client.on('game:actionFailed', (data) => {
            console.error('❌ Server: Action failed:', data.error);
            
            // Reject pending action
            const actionType = data.action;
            if (actionType && this.pendingActions.has(actionType)) {
                const { reject } = this.pendingActions.get(actionType);
                reject(new Error(data.error));
                this.pendingActions.delete(actionType);
            }
        });
        
        console.log('✅ GameInterface: Multiplayer listeners configured');
    }

    /**
     * Get current player
     */
    getCurrentPlayer() {
        return this.gameState.getCurrentPlayer();
    }

    /**
     * Deploy armies to a territory
     * @param {string} territoryId - Territory to deploy to
     * @param {number} armyCount - Number of armies to deploy
     * @returns {Promise<object>} - Result of deployment
     */
    async deployArmies(territoryId, armyCount) {
        if (this.isMultiplayer) {
            // MULTIPLAYER: Send to server, wait for response
            return new Promise((resolve, reject) => {
                this.pendingActions.set('deploy', { resolve, reject });
                
                this.client.emit('game:deploy', {
                    sessionCode: this.sessionCode,
                    userId: this.getCurrentPlayer(),
                    territoryId,
                    armyCount
                });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.pendingActions.has('deploy')) {
                        this.pendingActions.delete('deploy');
                        reject(new Error('Deploy action timed out'));
                    }
                }, 10000);
            });
        } else {
            // SINGLE-PLAYER: Execute locally
            const territory = this.gameState.territories[territoryId];
            const currentPlayer = this.gameState.getCurrentPlayer();
            
            // Local validation (same as server)
            if (territory.owner !== currentPlayer) {
                throw new Error('You do not own this territory');
            }
            
            const available = this.gameState.remainingArmies[currentPlayer] || 0;
            if (armyCount > available) {
                throw new Error(`Only ${available} armies available`);
            }
            
            if (armyCount < 1) {
                throw new Error('Must deploy at least 1 army');
            }
            
            // Execute locally
            territory.armies += armyCount;
            this.gameState.remainingArmies[currentPlayer] -= armyCount;
            
            // Save state
            if (this.gameState.saveToSession) {
                this.gameState.saveToSession();
            }
            
            return { 
                success: true,
                territoryArmies: territory.armies,
                remainingArmies: this.gameState.remainingArmies[currentPlayer]
            };
        }
    }

    /**
     * Execute attack between territories
     * @param {string} attackingTerritory - Attacking territory ID
     * @param {string} defendingTerritory - Defending territory ID
     * @param {number} attackerArmies - Number of armies to attack with (1-3)
     * @returns {Promise<object>} - Battle result
     */
    async executeAttack(attackingTerritory, defendingTerritory, attackerArmies) {
        if (this.isMultiplayer) {
            // MULTIPLAYER: Server resolves battle
            return new Promise((resolve, reject) => {
                this.pendingActions.set('attack', { resolve, reject });
                
                this.client.emit('game:attack', {
                    sessionCode: this.sessionCode,
                    userId: this.getCurrentPlayer(),
                    attackingTerritory,
                    defendingTerritory,
                    attackerArmies
                });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.pendingActions.has('attack')) {
                        this.pendingActions.delete('attack');
                        reject(new Error('Attack action timed out'));
                    }
                }, 10000);
            });
        } else {
            // SINGLE-PLAYER: Use local combat system
            const attackTerr = this.gameState.territories[attackingTerritory];
            const defendTerr = this.gameState.territories[defendingTerritory];
            
            // Validation
            if (!attackTerr || !defendTerr) {
                throw new Error('Territory not found');
            }
            
            if (attackTerr.armies < 2) {
                throw new Error('Need at least 2 armies to attack');
            }
            
            // Use existing CombatSystem if available
            if (this.gameState.combatSystem) {
                const result = await this.gameState.combatSystem.executeBattle(
                    attackingTerritory,
                    defendingTerritory,
                    attackerArmies
                );
                
                // Save state
                if (this.gameState.saveToSession) {
                    this.gameState.saveToSession();
                }
                
                return result;
            } else {
                throw new Error('Combat system not available');
            }
        }
    }

    /**
     * Fortify territory - move armies between connected territories
     * @param {string} sourceTerritory - Source territory ID
     * @param {string} targetTerritory - Target territory ID
     * @param {number} armyCount - Number of armies to move
     * @returns {Promise<object>} - Result of fortification
     */
    async fortifyTerritory(sourceTerritory, targetTerritory, armyCount) {
        if (this.isMultiplayer) {
            // MULTIPLAYER: Send to server
            return new Promise((resolve, reject) => {
                this.pendingActions.set('fortify', { resolve, reject });
                
                this.client.emit('game:fortify', {
                    sessionCode: this.sessionCode,
                    userId: this.getCurrentPlayer(),
                    sourceTerritory,
                    targetTerritory,
                    armyCount
                });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.pendingActions.has('fortify')) {
                        this.pendingActions.delete('fortify');
                        reject(new Error('Fortify action timed out'));
                    }
                }, 10000);
            });
        } else {
            // SINGLE-PLAYER: Execute locally
            const sourceTerr = this.gameState.territories[sourceTerritory];
            const targetTerr = this.gameState.territories[targetTerritory];
            
            // Validation
            if (!sourceTerr || !targetTerr) {
                throw new Error('Territory not found');
            }
            
            const currentPlayer = this.gameState.getCurrentPlayer();
            if (sourceTerr.owner !== currentPlayer || targetTerr.owner !== currentPlayer) {
                throw new Error('You must own both territories');
            }
            
            if (armyCount < 1 || armyCount >= sourceTerr.armies) {
                throw new Error('Must leave at least 1 army in source territory');
            }
            
            // Execute
            sourceTerr.armies -= armyCount;
            targetTerr.armies += armyCount;
            
            // Save state
            if (this.gameState.saveToSession) {
                this.gameState.saveToSession();
            }
            
            return { 
                success: true,
                sourceArmies: sourceTerr.armies,
                targetArmies: targetTerr.armies
            };
        }
    }

    /**
     * Advance to next phase
     * @returns {Promise<object>} - Result with old and new phase
     */
    async advancePhase() {
        if (this.isMultiplayer) {
            // MULTIPLAYER: Request phase advance from server
            return new Promise((resolve, reject) => {
                this.pendingActions.set('advancePhase', { resolve, reject });
                
                this.client.emit('game:advancePhase', {
                    sessionCode: this.sessionCode,
                    userId: this.getCurrentPlayer()
                });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    if (this.pendingActions.has('advancePhase')) {
                        this.pendingActions.delete('advancePhase');
                        reject(new Error('Phase advance timed out'));
                    }
                }, 10000);
            });
        } else {
            // SINGLE-PLAYER: Use existing TurnManager or GameState
            const oldPhase = this.gameState.phase;
            
            if (this.gameState.advancePhase) {
                const result = this.gameState.advancePhase();
                
                // Save state
                if (this.gameState.saveToSession) {
                    this.gameState.saveToSession();
                }
                
                return result || { 
                    oldPhase, 
                    newPhase: this.gameState.phase 
                };
            } else {
                throw new Error('Phase advancement not available');
            }
        }
    }

    /**
     * Initialize game (multiplayer only)
     * @param {Array<string>} players - Player names
     * @param {Object} playerColors - Player colors mapping
     * @returns {Promise<object>} - Initial game state
     */
    async initializeGame(players, playerColors) {
        if (!this.isMultiplayer) {
            console.warn('⚠️ initializeGame called in single-player mode');
            return { success: false, error: 'Not in multiplayer mode' };
        }
        
        return new Promise((resolve, reject) => {
            // Listen for initialization response
            const handler = (data) => {
                this.client.off('game:initialized', handler);
                
                if (data.success && this.gameState.updateFromServer) {
                    this.gameState.updateFromServer(data.gameState);
                    resolve(data);
                } else {
                    reject(new Error(data.error || 'Game initialization failed'));
                }
            };
            
            this.client.on('game:initialized', handler);
            
            // Send initialization request
            this.client.emit('game:initialize', {
                sessionCode: this.sessionCode,
                players,
                playerColors
            });
            
            // Timeout after 15 seconds
            setTimeout(() => {
                this.client.off('game:initialized', handler);
                reject(new Error('Game initialization timed out'));
            }, 15000);
        });
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.pendingActions.clear();
        console.log('🧹 GameInterface destroyed');
    }
}

// Export for use in game.html
if (typeof window !== 'undefined') {
    window.GameInterface = GameInterface;
}
