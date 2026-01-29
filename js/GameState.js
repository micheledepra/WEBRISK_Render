class GameState {
    static SESSION_KEY = 'risk_game_state';
    
    constructor(players, colors = []) {
        // ✅ STEP 1: Try to restore existing game state FIRST
        const savedState = GameState.loadFromSession();
        if (savedState && savedState.territories && Object.keys(savedState.territories).length > 0) {
            console.log('♻️ RESTORING saved game state from sessionStorage...');
            console.log(`   📍 ${Object.keys(savedState.territories).length} territories preserved`);
            console.log(`   🎯 Turn ${savedState.turnNumber}, Phase: ${savedState.phase}`);
            console.log(`   👥 Current player: ${savedState.players[savedState.currentPlayerIndex]}`);
            
            // ⚠️ CRITICAL FIX: Manually restore each property to maintain prototype chain
            this.players = savedState.players;
            this.territories = savedState.territories;
            this.currentPlayerIndex = savedState.currentPlayerIndex;
            this.phase = savedState.phase;
            this.turnNumber = savedState.turnNumber;
            this.armiesPerTurn = savedState.armiesPerTurn;
            this.reinforcements = savedState.reinforcements;
            this.remainingArmies = savedState.remainingArmies;
            this.playerColors = savedState.playerColors;
            this.continentBonuses = savedState.continentBonuses || {
                'north-america': 5,
                'south-america': 2,
                'europe': 5,
                'africa': 3,
                'asia': 7,
                'australia': 2
            };
            this.initialDeploymentComplete = savedState.initialDeploymentComplete || false;
            this.lastUpdate = savedState.lastUpdate || Date.now();
            
            // ✅ FIX 6: Restore session information
            this.sessionCode = savedState.sessionCode || null;
            this.isMultiplayer = savedState.isMultiplayer || false;
            this.multiplayerSession = savedState.multiplayerSession || null;
            
            // ✅ FIX: Mark as restored game (not new) - THIS PREVENTS RE-RANDOMIZATION
            this.isNewGame = false;
            
            // ⚠️ CRITICAL: Skip territory randomization - territories already assigned
            console.log('✅ Game state restored - territories NOT re-randomized');
            if (this.sessionCode) {
                console.log(`   📍 Session: ${this.sessionCode}`);
            }
            return;
        }

        // ❌ STEP 2: Only runs if NO saved state exists - FRESH GAME
        console.log('🎲 FIRST-TIME INITIALIZATION - Creating new game...');
        console.log(`   👥 ${players.length} players: ${players.join(', ')}`);

        // Initialize new game state
        this.players = players;
        this.territories = {};
        this.currentPlayerIndex = 0;
        this.phase = 'startup'; // Official Risk starts with startup phase
        this.turnNumber = 0; // Start at Turn 0 (startup phase)
        this.armiesPerTurn = 1;
        this.reinforcements = {}; // For regular turn reinforcements
        this.remainingArmies = {}; // For deployment armies (initial and turn-based)
        this.playerColors = {};
        this.lastUpdate = Date.now();
        this.initialDeploymentComplete = false; // Track initial deployment phase completion
        this.continentBonuses = {
            'north-america': 5,
            'south-america': 2,
            'europe': 5,
            'africa': 3,
            'asia': 7,
            'australia': 2
        };
        
        // ✅ FIX 6: Store session information in GameState
        if (window.isMultiplayerMode && window.sessionCode) {
            this.sessionCode = window.sessionCode;
            this.isMultiplayer = true;
            this.multiplayerSession = window.sessionCode;
            
            console.log(`   🎮 GameState initialized for multiplayer session: ${window.sessionCode}`);
        } else {
            this.sessionCode = null;
            this.isMultiplayer = false;
            this.multiplayerSession = null;
        }
        
        // Initialize player colors
        this.players.forEach((player, index) => {
            this.playerColors[player] = colors[index] || this.getDefaultColor(index);
        });
        
        // Initialize territory ownership and armies
        Object.keys(territoryPaths).forEach(territory => {
            this.territories[territory] = {
                owner: null,
                armies: 0,
                neighbors: [] // Neighbors will be initialized from territory paths
            };
        });
        
        // Initialize neighbors from territory paths
        Object.entries(territoryPaths).forEach(([territory, data]) => {
            if (data.neighbors) {
                this.territories[territory].neighbors = data.neighbors;
            }
        });

        // Initialize remaining armies with initial army counts according to official Risk rules
        const initialArmies = this.getInitialArmies(players.length);
        console.log(`   🎖️ Each player receives ${initialArmies} initial armies`);
        this.players.forEach(player => {
            this.remainingArmies[player] = initialArmies;
            this.reinforcements[player] = 0; // No reinforcements until regular turns begin
        });
        
        // ⚠️ CRITICAL: Mark this as a fresh initialization
        this.isNewGame = true;
    }

    getDefaultColor(index) {
        const defaultColors = [
            '#ff4444', // Red
            '#44ff44', // Green
            '#4444ff', // Blue
            '#ffff44', // Yellow
            '#ff44ff', // Magenta
            '#44ffff'  // Cyan
        ];
        return defaultColors[index % defaultColors.length];
    }

    getInitialArmies(numPlayers) {
        // Official Risk board game rules for initial army count based on player count:
        // - 2 players: 40 armies each
        // - 3 players: 35 armies each
        // - 4 players: 30 armies each
        // - 5 players: 25 armies each
        // - 6 players: 20 armies each
        switch(numPlayers) {
            case 2: return 40;
            case 3: return 35;
            case 4: return 30;
            case 5: return 25;
            case 6: return 20;
            default: return 30; // Default to 4-player rules
        }
    }

    calculateReinforcements(player) {
        // Official Risk rules for reinforcements:
        // 1. Base reinforcements: 1 army per 3 territories owned (rounded down), with a minimum of 1
        const territoriesOwned = Object.values(this.territories)
            .filter(t => t.owner === player).length;
        let reinforcements = Math.max(1, Math.floor(territoriesOwned / 3));

        // 2. Add continent bonuses if player controls entire continent
        reinforcements += this.calculateContinentBonuses(player);

        // 3. Card sets are handled separately in the game UI
        
        return reinforcements;
    }

    calculateContinentBonuses(player) {
        let bonus = 0;
        
        // Use mapData.continents for accurate territory lists
        if (typeof mapData !== 'undefined' && mapData.continents) {
            for (const [continent, continentData] of Object.entries(mapData.continents)) {
                const territories = continentData.territories || [];
                if (territories.every(territory => 
                    this.territories[territory] && 
                    this.territories[territory].owner === player
                )) {
                    bonus += this.continentBonuses[continent];
                }
            }
        }
        return bonus;
    }

    setPhase(newPhase) {
        this.phase = newPhase;
        if (newPhase === 'deploy') {
            this.reinforcements[this.getCurrentPlayer()] = 
                this.calculateReinforcements(this.getCurrentPlayer());
        }
    }

    assignTerritoriesRandomly() {
        // ⚠️ CRITICAL: Skip if this is a restored game
        if (this.isNewGame === false) {
            console.log('⏭️ Skipping territory assignment - game was restored from save');
            return;
        }
        
        // ⚠️ CRITICAL: Skip if territories already assigned
        const assignedTerritories = Object.values(this.territories).filter(t => t.owner !== null).length;
        if (assignedTerritories > 0) {
            console.log('⏭️ Skipping territory assignment - territories already assigned');
            return;
        }
        
        console.log('🎲 Randomizing territory assignments (first-time only)...');
        const territories = Object.keys(this.territories);
        const shuffled = [...territories].sort(() => Math.random() - 0.5);
        
        const initialArmies = this.getInitialArmies(this.players.length);
        const territoriesPerPlayer = Math.floor(shuffled.length / this.players.length);
        const extraTerritories = shuffled.length % this.players.length;
        
        let currentIndex = 0;
        
        // Assign territories to players
        this.players.forEach((player, playerIndex) => {
            // Calculate how many territories this player should get
            const playerTerritories = territoriesPerPlayer + (playerIndex < extraTerritories ? 1 : 0);
            
            // Assign territories to this player
            for (let i = 0; i < playerTerritories; i++) {
                const territory = shuffled[currentIndex++];
                this.territories[territory].owner = player;
                this.territories[territory].armies = 1; // Start with 1 army per territory
            }
            
            // ✅ FIX: Set remaining armies for initial placement
            // (total initial armies minus the one army already placed on each territory)
            this.remainingArmies[player] = initialArmies - playerTerritories;
        });
        
        // Set phase to initial placement for the remaining armies
        this.phase = 'startup';
        this.initialDeploymentComplete = false;
        
        // CRITICAL: Initialize phase tracking at the TRUE start of startup
        // This captures the army state BEFORE any additional deployments
        setTimeout(() => {
            if (window.resetPhaseTracking) {
                console.log('🔄 Startup phase starting - initializing tracking');
                window.resetPhaseTracking();
            }
        }, 100);
        
        console.log('✅ Territory assignment complete:');
        this.players.forEach(player => {
            const territories = this.getTerritoriesOwnedByPlayer(player).length;
            console.log(`   ${player}: ${territories} territories, ${this.remainingArmies[player]} armies to deploy`);
        });
        
        // 💾 AUTO-SAVE: Save state immediately after territory assignment
        this.saveToSession();
        console.log('💾 Initial game state saved to sessionStorage');
    }

    calculateInitialArmies(playerCount) {
        // This is a duplicate method that should use getInitialArmies instead
        // for consistency and to follow DRY principles
        return this.getInitialArmies(playerCount);
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    nextPlayer() {
        const oldPlayer = this.getCurrentPlayer();
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        const newPlayer = this.getCurrentPlayer();
        const turnComplete = this.currentPlayerIndex === 0;
        
        this.checkPhaseCompletion();
        
        // Dispatch event for dashboard system
        document.dispatchEvent(new CustomEvent('playerChanged', {
            detail: { oldPlayer, newPlayer, turnComplete, source: 'GameState.nextPlayer' }
        }));
        
        // 💾 AUTO-SAVE: Save state after player change
        this.saveToSession();
        
        // Return object with player and turn completion info
        return {
            player: newPlayer,
            turnComplete: turnComplete
        };
    }

    checkPhaseCompletion() {
        // This is now handled by TurnManager and PhaseSynchronizer
        // Keep method for backward compatibility but minimize logic
        if (this.phase === 'startup') {
            const allTroopsPlaced = this.players.every(player => 
                this.remainingArmies[player] === 0
            );
            
            if (allTroopsPlaced) {
                // Mark deployment as complete but DON'T set reinforcements
                // Let TurnManager handle the transition properly
                this.initialDeploymentComplete = true;
                console.log('[GameState] Initial deployment complete - TurnManager will handle transition');
                // Don't modify phase or calculate reinforcements here
                // TurnManager.advancePhase() will handle it
            }
        }
    }

    // Check if the initial deployment phase (where all players deploy starting armies) is complete
    isInitialDeploymentComplete() {
        return this.initialDeploymentComplete && 
               this.players.every(player => this.remainingArmies[player] === 0);
    }

    // Start regular turn for current player
    startRegularTurn() {
        this.phase = 'reinforcement';
        this.remainingArmies[this.getCurrentPlayer()] = this.calculateReinforcements(this.getCurrentPlayer());
    }

    getTerritoriesOwnedByPlayer(player) {
        return Object.entries(this.territories)
            .filter(([_, data]) => data.owner === player)
            .map(([name]) => name);
    }

    // Duplicate methods removed - using the implementations above

    isValidAttack(fromTerritory, toTerritory) {
        const from = this.territories[fromTerritory];
        const to = this.territories[toTerritory];

        return from && to && 
               from.owner === this.getCurrentPlayer() &&
               from.owner !== to.owner &&
               from.armies > 1 &&
               from.neighbors.includes(toTerritory);
    }

    isValidFortify(fromTerritory, toTerritory) {
        const from = this.territories[fromTerritory];
        const to = this.territories[toTerritory];

        return from && to &&
               from.owner === this.getCurrentPlayer() &&
               to.owner === this.getCurrentPlayer() &&
               from.armies > 1 &&
               from.neighbors.includes(toTerritory); // Changed from areConnected to direct neighbor check
    }

    areConnected(territory1, territory2) {
        // Breadth-first search to find if territories are connected through owned territories
        const player = this.territories[territory1].owner;
        const visited = new Set();
        const queue = [territory1];

        while (queue.length > 0) {
            const current = queue.shift();
            if (current === territory2) return true;
            
            if (!visited.has(current)) {
                visited.add(current);
                const neighbors = this.territories[current].neighbors;
                for (const neighbor of neighbors) {
                    if (this.territories[neighbor].owner === player) {
                        queue.push(neighbor);
                    }
                }
            }
        }
        return false;
    }

    moveArmies(fromTerritory, toTerritory, count) {
        const from = this.territories[fromTerritory];
        const to = this.territories[toTerritory];

        if (from.armies <= count) {
            throw new Error('Must leave at least one army in territory');
        }

        from.armies -= count;
        to.armies += count;
        
        // Dispatch events for dashboard system
        document.dispatchEvent(new CustomEvent('armyCountChanged', {
            detail: { territoryId: fromTerritory, armyCount: from.armies, source: 'GameState.moveArmies' }
        }));
        document.dispatchEvent(new CustomEvent('armyCountChanged', {
            detail: { territoryId: toTerritory, armyCount: to.armies, source: 'GameState.moveArmies' }
        }));
    }

    resolveCombat(attackerDice, defenderDice) {
        // Sort dice in descending order
        attackerDice.sort((a, b) => b - a);
        defenderDice.sort((a, b) => b - a);

        const losses = { attacker: 0, defender: 0 };
        const comparisons = Math.min(attackerDice.length, defenderDice.length);

        for (let i = 0; i < comparisons; i++) {
            if (attackerDice[i] > defenderDice[i]) {
                losses.defender++;
            } else {
                losses.attacker++;
            }
        }

        return losses;
    }

    // Legacy nextPhase method - now handled by TurnManager/PhaseSynchronizer
    nextPhase() {
        console.warn('[GameState] nextPhase() is deprecated - use TurnManager.advancePhase() instead');
        
        switch (this.phase) {
            case 'startup':
                this.phase = 'reinforcement';
                break;
            case 'reinforcement':
                this.phase = 'attack';
                break;
            case 'attack':
                this.phase = 'fortification';
                break;
            case 'fortification':
                this.phase = 'reinforcement';
                this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
                if (this.currentPlayerIndex === 0) {
                    this.turnNumber++;
                }
                const nextPlayer = this.getCurrentPlayer();
                this.remainingArmies[nextPlayer] = this.calculateReinforcements(nextPlayer);
                break;
        }
    }

    checkVictory() {
        const ownedTerritories = {};
        Object.values(this.territories).forEach(territory => {
            if (territory.owner) {
                ownedTerritories[territory.owner] = (ownedTerritories[territory.owner] || 0) + 1;
            }
        });

        const totalTerritories = Object.keys(this.territories).length;
        for (const [player, count] of Object.entries(ownedTerritories)) {
            if (count === totalTerritories) {
                return player;
            }
        }
        return null;
    }

    // Save current state to session storage
    saveToSession() {
        const state = {
            players: this.players,
            territories: this.territories,
            currentPlayerIndex: this.currentPlayerIndex,
            phase: this.phase,
            turnNumber: this.turnNumber,
            armiesPerTurn: this.armiesPerTurn,
            reinforcements: this.reinforcements,
            remainingArmies: this.remainingArmies,
            playerColors: this.playerColors,
            continentBonuses: this.continentBonuses,
            initialDeploymentComplete: this.initialDeploymentComplete,
            isNewGame: false, // ✅ Always false when saving (game has been initialized)
            lastUpdate: Date.now(),
            // ✅ FIX 7: Include session tracking
            sessionCode: this.sessionCode,
            isMultiplayer: this.isMultiplayer,
            multiplayerSession: this.multiplayerSession
        };
        sessionStorage.setItem(GameState.SESSION_KEY, JSON.stringify(state));
        
        // Log save with session info
        if (this.sessionCode) {
            console.log(`💾 Game state saved for session: ${this.sessionCode}`);
        }
    }

    // Load state from session storage
    static loadFromSession() {
        const savedState = sessionStorage.getItem(GameState.SESSION_KEY);
        if (!savedState) return null;
        return JSON.parse(savedState);
    }

    /**
     * Update local state from server (multiplayer only)
     * Synchronizes client state with authoritative server state
     */
    updateFromServer(serverState) {
        console.log('📥 Updating client state from server');
        
        if (!serverState) {
            console.warn('⚠️ No server state provided');
            return;
        }
        
        try {
            // Update all territories
            if (serverState.territories) {
                Object.keys(serverState.territories).forEach(territoryId => {
                    const serverTerritory = serverState.territories[territoryId];
                    const clientTerritory = this.territories[territoryId];
                    
                    if (clientTerritory && serverTerritory) {
                        clientTerritory.armies = serverTerritory.armies;
                        clientTerritory.owner = serverTerritory.owner;
                        
                        // Preserve neighbors (they don't change)
                        if (!clientTerritory.neighbors && serverTerritory.neighbors) {
                            clientTerritory.neighbors = serverTerritory.neighbors;
                        }
                    }
                });
            }
            
            // Update game phase and turn
            if (serverState.phase !== undefined) {
                this.phase = serverState.phase;
            }
            
            if (serverState.turnNumber !== undefined) {
                this.turnNumber = serverState.turnNumber;
            }
            
            if (serverState.currentPlayerIndex !== undefined) {
                this.currentPlayerIndex = serverState.currentPlayerIndex;
            }
            
            // Update remaining armies
            if (serverState.remainingArmies) {
                this.remainingArmies = { ...serverState.remainingArmies };
            }
            
            // Update players list (in case of elimination)
            if (serverState.players) {
                this.players = [...serverState.players];
            }
            
            // Update player colors if provided
            if (serverState.playerColors) {
                this.playerColors = { ...serverState.playerColors };
            }
            
            console.log(`✅ Client synced: Turn ${this.turnNumber}, Phase: ${this.phase}, Player: ${this.getCurrentPlayer()}`);
            
            // Trigger UI update if available
            if (window.riskUI && typeof window.riskUI.updateUI === 'function') {
                window.riskUI.updateUI();
            }
            
            // CRITICAL: Refresh territory colors with dynamic opacity after state sync
            if (window.colorManager && typeof window.colorManager.refreshAllTerritories === 'function') {
                window.colorManager.refreshAllTerritories(this);
                console.log('✅ Territory colors refreshed with dynamic opacity after server sync');
            }
            
        } catch (error) {
            console.error('❌ Error updating from server:', error);
        }
    }

    // Clear saved game state
    static clearSavedGame() {
        sessionStorage.removeItem(GameState.SESSION_KEY);
    }

    // Clear saved game state
    static clearSavedGame() {
        sessionStorage.removeItem(GameState.SESSION_KEY);
    }

    // Get neighbors of a territory
    getNeighbors(territoryId) {
        const territory = this.territories[territoryId];
        return territory ? territory.neighbors || [] : [];
    }

    // Check if there's a saved game
    static hasSavedGame() {
        return !!sessionStorage.getItem(GameState.SESSION_KEY);
    }
}

// Make GameState available globally
window.GameState = GameState;