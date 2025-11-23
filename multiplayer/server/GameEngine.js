/**
 * Server-Side Game Engine for Risk
 * Authoritative source of truth for all game logic
 * Validates and executes all player actions
 */

const ServerGameState = require('./game-logic/ServerGameState');
const mapData = require('./game-logic/mapData');

class GameEngine {
    constructor() {
        this.sessions = new Map(); // sessionId -> { gameState, players, createdAt }
        this.mapData = mapData;
        console.log('🎮 GameEngine initialized');
    }

    /**
     * Initialize a new game session with deterministic territory assignment
     */
    initializeGame(sessionId, players, playerColors, clientPlayerMapping = {}, seed = null) {
        console.log(`🎮 Server: Initializing game for session ${sessionId}`);
        console.log(`   👥 Players: ${players.join(', ')}`);
        console.log(`   🎲 Seed: ${seed || 'auto-generated'}`);
        
        try {
            // Create server-side game state with client-player mapping
            const gameState = new ServerGameState(players, playerColors, clientPlayerMapping);
            
            // Deterministic territory assignment using seed
            const initSeed = seed || Date.now();
            gameState.initializeTerritoriesForPlayers(initSeed);
            
            // Store session
            this.sessions.set(sessionId, {
                gameState,
                players,
                clientPlayerMapping,
                createdAt: Date.now(),
                lastUpdate: Date.now(),
                initializationSeed: initSeed
            });
            
            console.log(`✅ Server: Game initialized for session ${sessionId}`);
            console.log(`   📍 Territory assignment complete (deterministic)`);
            console.log(`   🔗 Client-Player mapping:`, clientPlayerMapping);
            
            return {
                success: true,
                initialState: gameState.serialize(),
                message: 'Game initialized on server with deterministic assignment'
            };
        } catch (error) {
            console.error('❌ Server: Game initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate if a client can perform actions for a specific player
     */
    validateClientAction(sessionId, clientId, playerName = null) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { valid: false, error: 'Session not found' };
        }
        
        const { gameState } = session;
        
        // If no player specified, check current player
        const targetPlayer = playerName || gameState.getCurrentPlayer();
        
        // Check if client controls this player
        if (!gameState.isClientPlayer(clientId, targetPlayer)) {
            return { 
                valid: false, 
                error: `Client ${clientId} does not control player ${targetPlayer}` 
            };
        }
        
        // Check if it's this player's turn
        if (targetPlayer !== gameState.getCurrentPlayer()) {
            return { 
                valid: false, 
                error: `Not ${targetPlayer}'s turn. Current player: ${gameState.getCurrentPlayer()}` 
            };
        }
        
        return { valid: true };
    }

    /**
     * Deploy armies to a territory (with client validation)
     */
    deployArmies(sessionId, clientId, userId, territoryId, armyCount) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }
        
        const { gameState } = session;
        
        // VALIDATION 0: Client authorization (NEW)
        const clientValidation = this.validateClientAction(sessionId, clientId, userId);
        if (!clientValidation.valid) {
            console.warn(`❌ Deploy rejected: ${clientValidation.error}`);
            return { success: false, error: clientValidation.error };
        }
        
        const currentPlayer = gameState.getCurrentPlayer();
        
        // VALIDATION 1: Is it this player's turn?
        if (currentPlayer !== userId) {
            console.warn(`❌ Deploy rejected: Not ${userId}'s turn (current: ${currentPlayer})`);
            return { 
                success: false, 
                error: `Not your turn. Current player: ${currentPlayer}` 
            };
        }
        
        // VALIDATION 2: Is deployment phase active?
        if (gameState.phase !== 'startup' && gameState.phase !== 'reinforcement') {
            console.warn(`❌ Deploy rejected: Wrong phase (${gameState.phase})`);
            return { 
                success: false, 
                error: `Cannot deploy during ${gameState.phase} phase` 
            };
        }
        
        // VALIDATION 3: Does territory exist?
        const territory = gameState.territories[territoryId];
        if (!territory) {
            console.warn(`❌ Deploy rejected: Territory ${territoryId} not found`);
            return { 
                success: false, 
                error: 'Territory not found' 
            };
        }
        
        // VALIDATION 4: Does player own territory?
        if (territory.owner !== currentPlayer) {
            console.warn(`❌ Deploy rejected: ${currentPlayer} doesn't own ${territoryId}`);
            return { 
                success: false, 
                error: 'You do not own this territory' 
            };
        }
        
        // VALIDATION 5: Does player have armies available?
        const available = gameState.remainingArmies[currentPlayer] || 0;
        if (armyCount > available) {
            console.warn(`❌ Deploy rejected: Only ${available} armies available`);
            return { 
                success: false, 
                error: `Only ${available} armies available` 
            };
        }
        
        // VALIDATION 6: Is army count valid?
        if (armyCount < 1 || isNaN(armyCount)) {
            console.warn(`❌ Deploy rejected: Invalid army count ${armyCount}`);
            return { 
                success: false, 
                error: 'Invalid army count' 
            };
        }
        
        // EXECUTE: Deploy armies (server is source of truth)
        territory.armies += armyCount;
        gameState.remainingArmies[currentPlayer] -= armyCount;
        session.lastUpdate = Date.now();
        
        console.log(`✅ Server: ${currentPlayer} deployed ${armyCount} to ${territoryId}`);
        console.log(`   Territory now has ${territory.armies} armies`);
        console.log(`   Player has ${gameState.remainingArmies[currentPlayer]} armies remaining`);
        
        return {
            success: true,
            gameState: gameState.serialize(),
            action: {
                type: 'deploy',
                player: currentPlayer,
                territory: territoryId,
                armies: armyCount,
                territoryArmies: territory.armies,
                remainingArmies: gameState.remainingArmies[currentPlayer]
            }
        };
    }

    /**
     * Execute attack between territories (with client validation)
     */
    executeAttack(sessionId, clientId, userId, attackingTerritory, defendingTerritory, attackerArmies) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }
        
        const { gameState } = session;
        
        // VALIDATION 0: Client authorization
        const clientValidation = this.validateClientAction(sessionId, clientId, userId);
        if (!clientValidation.valid) {
            console.warn(`❌ Attack rejected: ${clientValidation.error}`);
            return { success: false, error: clientValidation.error };
        }
        
        // VALIDATION 1: Turn check
        if (gameState.getCurrentPlayer() !== userId) {
            console.warn(`❌ Attack rejected: Not ${userId}'s turn`);
            return { success: false, error: 'Not your turn' };
        }
        
        // VALIDATION 2: Phase check
        if (gameState.phase !== 'attack') {
            console.warn(`❌ Attack rejected: Wrong phase (${gameState.phase})`);
            return { success: false, error: 'Not in attack phase' };
        }
        
        // VALIDATION 3: Territory existence
        const attackTerr = gameState.territories[attackingTerritory];
        const defendTerr = gameState.territories[defendingTerritory];
        
        if (!attackTerr || !defendTerr) {
            console.warn(`❌ Attack rejected: Territory not found`);
            return { success: false, error: 'Territory not found' };
        }
        
        // VALIDATION 4: Territory ownership
        if (attackTerr.owner !== userId) {
            console.warn(`❌ Attack rejected: ${userId} doesn't own ${attackingTerritory}`);
            return { success: false, error: 'You do not own attacking territory' };
        }
        
        if (defendTerr.owner === userId) {
            console.warn(`❌ Attack rejected: Cannot attack own territory`);
            return { success: false, error: 'Cannot attack your own territory' };
        }
        
        // VALIDATION 5: Adjacency check
        if (!this.areAdjacent(attackingTerritory, defendingTerritory)) {
            console.warn(`❌ Attack rejected: ${attackingTerritory} and ${defendingTerritory} not adjacent`);
            return { success: false, error: 'Territories not adjacent' };
        }
        
        // VALIDATION 6: Sufficient armies
        if (attackTerr.armies < 2) {
            console.warn(`❌ Attack rejected: Need at least 2 armies to attack`);
            return { success: false, error: 'Need at least 2 armies to attack (1 must stay)' };
        }
        
        if (attackerArmies < 1 || attackerArmies > Math.min(3, attackTerr.armies - 1)) {
            console.warn(`❌ Attack rejected: Invalid attacker army count ${attackerArmies}`);
            return { 
                success: false, 
                error: `Can attack with 1-${Math.min(3, attackTerr.armies - 1)} armies` 
            };
        }
        
        // EXECUTE: Battle resolution on server
        const defenderArmies = Math.min(2, defendTerr.armies);
        
        const attackerDice = this.rollDice(attackerArmies);
        const defenderDice = this.rollDice(defenderArmies);
        
        const battleResult = this.resolveBattle(attackerDice, defenderDice);
        
        // Apply battle results
        attackTerr.armies -= battleResult.attackerLosses;
        defendTerr.armies -= battleResult.defenderLosses;
        
        const conquered = defendTerr.armies === 0;
        
        if (conquered) {
            const previousOwner = defendTerr.owner;
            defendTerr.owner = userId;
            defendTerr.armies = attackerArmies; // Move attacking armies
            attackTerr.armies -= attackerArmies;
            
            console.log(`🏴 Server: ${userId} conquered ${defendingTerritory}!`);
            
            // Check for player elimination
            const eliminationResult = gameState.checkPlayerElimination(previousOwner);
            
            session.lastUpdate = Date.now();
            
            return {
                success: true,
                gameState: gameState.serialize(),
                battleResult: {
                    attackerDice,
                    defenderDice,
                    attackerLosses: battleResult.attackerLosses,
                    defenderLosses: battleResult.defenderLosses,
                    conquered: true,
                    attackerArmies: attackTerr.armies,
                    defenderArmies: defendTerr.armies,
                    eliminationResult
                }
            };
        }
        
        console.log(`⚔️ Server: Battle resolved - Attacker loses ${battleResult.attackerLosses}, Defender loses ${battleResult.defenderLosses}`);
        
        session.lastUpdate = Date.now();
        
        return {
            success: true,
            gameState: gameState.serialize(),
            battleResult: {
                attackerDice,
                defenderDice,
                attackerLosses: battleResult.attackerLosses,
                defenderLosses: battleResult.defenderLosses,
                conquered: false,
                attackerArmies: attackTerr.armies,
                defenderArmies: defendTerr.armies
            }
        };
    }

    /**
     * Fortify territory (move armies between owned territories) (with client validation)
     */
    fortifyTerritory(sessionId, clientId, userId, sourceTerritory, targetTerritory, armyCount) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }
        
        const { gameState } = session;
        
        // VALIDATION 0: Client authorization
        const clientValidation = this.validateClientAction(sessionId, clientId, userId);
        if (!clientValidation.valid) {
            console.warn(`❌ Fortify rejected: ${clientValidation.error}`);
            return { success: false, error: clientValidation.error };
        }
        
        // VALIDATION 1: Turn check
        if (gameState.getCurrentPlayer() !== userId) {
            return { success: false, error: 'Not your turn' };
        }
        
        // VALIDATION 2: Phase check
        if (gameState.phase !== 'fortification') {
            return { success: false, error: 'Not in fortification phase' };
        }
        
        // VALIDATION 3: Territory ownership
        const sourceTerr = gameState.territories[sourceTerritory];
        const targetTerr = gameState.territories[targetTerritory];
        
        if (!sourceTerr || !targetTerr) {
            return { success: false, error: 'Territory not found' };
        }
        
        if (sourceTerr.owner !== userId || targetTerr.owner !== userId) {
            return { success: false, error: 'You must own both territories' };
        }
        
        // VALIDATION 4: Army count
        if (armyCount < 1 || armyCount >= sourceTerr.armies) {
            return { 
                success: false, 
                error: 'Must leave at least 1 army in source territory' 
            };
        }
        
        // VALIDATION 5: Path connectivity (simplified - check if connected via owned territories)
        if (!this.areConnectedThroughOwned(gameState, sourceTerritory, targetTerritory, userId)) {
            return { 
                success: false, 
                error: 'Territories not connected through your territories' 
            };
        }
        
        // EXECUTE: Move armies
        sourceTerr.armies -= armyCount;
        targetTerr.armies += armyCount;
        
        console.log(`🔄 Server: ${userId} fortified ${targetTerritory} with ${armyCount} from ${sourceTerritory}`);
        
        session.lastUpdate = Date.now();
        
        return {
            success: true,
            gameState: gameState.serialize(),
            action: {
                type: 'fortify',
                player: userId,
                source: sourceTerritory,
                target: targetTerritory,
                armies: armyCount
            }
        };
    }

    /**
     * Advance game phase (with client validation)
     */
    advancePhase(sessionId, clientId, userId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }
        
        const { gameState } = session;
        
        // Validate client authorization
        const clientValidation = this.validateClientAction(sessionId, clientId, userId);
        if (!clientValidation.valid) {
            console.warn(`❌ Phase advance rejected: ${clientValidation.error}`);
            return { success: false, error: clientValidation.error };
        }
        
        const result = gameState.advancePhase();
        session.lastUpdate = Date.now();
        
        console.log(`🔄 Server: ${userId} advanced phase from ${result.oldPhase} to ${result.newPhase}`);
        console.log(`   Next player: ${gameState.getCurrentPlayer()}`);
        
        return {
            success: true,
            oldPhase: result.oldPhase,
            newPhase: result.newPhase,
            gameState: gameState.serialize()
        };
    }

    /**
     * Server-side dice rolling (secure random)
     */
    rollDice(count) {
        const rolls = [];
        for (let i = 0; i < count; i++) {
            rolls.push(Math.floor(Math.random() * 6) + 1);
        }
        return rolls.sort((a, b) => b - a); // Sort descending
    }

    /**
     * Resolve battle between attacker and defender dice
     */
    resolveBattle(attackerDice, defenderDice) {
        let attackerLosses = 0;
        let defenderLosses = 0;
        
        const comparisons = Math.min(attackerDice.length, defenderDice.length);
        
        for (let i = 0; i < comparisons; i++) {
            if (attackerDice[i] > defenderDice[i]) {
                defenderLosses++;
            } else {
                attackerLosses++;
            }
        }
        
        return { attackerLosses, defenderLosses };
    }

    /**
     * Check if two territories are adjacent
     */
    areAdjacent(territory1, territory2) {
        const terr1Data = this.mapData.territories[territory1];
        if (!terr1Data || !terr1Data.neighbors) {
            return false;
        }
        return terr1Data.neighbors.includes(territory2);
    }

    /**
     * Check if territories are connected through owned territories (BFS)
     */
    areConnectedThroughOwned(gameState, start, end, owner) {
        if (start === end) return true;
        
        const visited = new Set();
        const queue = [start];
        visited.add(start);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            const neighbors = this.mapData.territories[current]?.neighbors || [];
            
            for (const neighbor of neighbors) {
                if (neighbor === end) {
                    return true;
                }
                
                if (!visited.has(neighbor) && 
                    gameState.territories[neighbor]?.owner === owner) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        
        return false;
    }

    /**
     * Get session info
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    /**
     * Clean up old sessions
     */
    cleanupOldSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastUpdate > maxAgeMs) {
                this.sessions.delete(sessionId);
                cleaned++;
                console.log(`🗑️ Server: Cleaned up old session ${sessionId}`);
            }
        }
        
        if (cleaned > 0) {
            console.log(`🗑️ Server: Cleaned up ${cleaned} old sessions`);
        }
    }
}

module.exports = GameEngine;
