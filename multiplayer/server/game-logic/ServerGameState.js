/**
 * Server-side GameState for Risk Game
 * Core game state management without browser dependencies
 */

const mapData = require('./mapData');

class ServerGameState {
    constructor(players, playerColors = {}, clientPlayerMapping = {}) {
        console.log(`🎮 Server: Initializing GameState for ${players.length} players`);
        
        this.players = players;
        this.territories = {};
        this.currentPlayerIndex = 0;
        this.phase = 'startup';
        this.turnNumber = 0;
        this.remainingArmies = {};
        this.playerColors = playerColors;
        this.clientPlayerMapping = clientPlayerMapping; // Maps clientId -> [playerNames]
        this.continentBonuses = {
            'north-america': 5,
            'south-america': 2,
            'europe': 5,
            'africa': 3,
            'asia': 7,
            'australia': 2
        };
        
        // Initialize territories
        Object.keys(mapData.territories).forEach(territory => {
            this.territories[territory] = {
                owner: null,
                armies: 0,
                neighbors: mapData.territories[territory].neighbors || []
            };
        });
        
        // Initialize remaining armies
        const initialArmies = this.getInitialArmies(players.length);
        this.players.forEach(player => {
            this.remainingArmies[player] = initialArmies;
        });
        
        console.log(`   Each player receives ${initialArmies} initial armies`);
    }

    getInitialArmies(numPlayers) {
        // Official Risk rules
        switch(numPlayers) {
            case 2: return 40;
            case 3: return 35;
            case 4: return 30;
            case 5: return 25;
            case 6: return 20;
            default: return 30;
        }
    }

    /**
     * Initialize territories with deterministic assignment
     * Each player gets equal territories with 1 army each
     * Uses timestamp-based seed for deterministic randomization
     */
    initializeTerritoriesForPlayers(seed = Date.now()) {
        console.log(`🎲 Server: Initializing territories (seed: ${seed})`);
        
        const territories = Object.keys(this.territories);
        
        // Deterministic shuffle using seed
        const shuffled = this.shuffleWithSeed([...territories], seed);
        
        const initialArmies = this.getInitialArmies(this.players.length);
        const territoriesPerPlayer = Math.floor(shuffled.length / this.players.length);
        const extraTerritories = shuffled.length % this.players.length;
        
        let currentIndex = 0;
        
        // Assign territories round-robin style
        this.players.forEach((player, playerIndex) => {
            const playerTerritories = territoriesPerPlayer + (playerIndex < extraTerritories ? 1 : 0);
            
            for (let i = 0; i < playerTerritories; i++) {
                const territory = shuffled[currentIndex++];
                this.territories[territory].owner = player;
                this.territories[territory].armies = 1; // Each territory starts with 1 army
            }
            
            // Calculate remaining armies after initial placement
            this.remainingArmies[player] = initialArmies - playerTerritories;
            
            console.log(`   ${player}: ${playerTerritories} territories, ${this.remainingArmies[player]} armies remaining`);
        });
        
        // Store the seed for potential debugging
        this.initializationSeed = seed;
        
        console.log('✅ Server: Territory initialization complete');
        console.log(`   Total territories: ${shuffled.length}, Players: ${this.players.length}`);
        console.log(`   Per player: ${territoriesPerPlayer}, Extra: ${extraTerritories}`);
    }
    
    /**
     * Deterministic shuffle using seeded random
     */
    shuffleWithSeed(array, seed) {
        const random = this.seededRandom(seed);
        const shuffled = [...array];
        
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }
    
    /**
     * Seeded random number generator (LCG algorithm)
     */
    seededRandom(seed) {
        let state = seed;
        return function() {
            state = (state * 1664525 + 1013904223) % 4294967296;
            return state / 4294967296;
        };
    }
    
    /**
     * Legacy method - redirects to new initialization
     */
    assignTerritoriesRandomly() {
        this.initializeTerritoriesForPlayers();
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    
    /**
     * Check if a client owns/controls a specific player
     */
    isClientPlayer(clientId, playerName) {
        if (!this.clientPlayerMapping || !this.clientPlayerMapping[clientId]) {
            return false;
        }
        return this.clientPlayerMapping[clientId].includes(playerName);
    }
    
    /**
     * Check if it's a specific client's turn
     */
    isClientTurn(clientId) {
        const currentPlayer = this.getCurrentPlayer();
        return this.isClientPlayer(clientId, currentPlayer);
    }
    
    /**
     * Get all players controlled by a client
     */
    getClientPlayers(clientId) {
        return this.clientPlayerMapping[clientId] || [];
    }

    getTerritoriesOwnedByPlayer(player) {
        return Object.keys(this.territories).filter(
            territory => this.territories[territory].owner === player
        );
    }

    calculateReinforcements(player) {
        const territoriesOwned = this.getTerritoriesOwnedByPlayer(player).length;
        let reinforcements = Math.max(3, Math.floor(territoriesOwned / 3));
        reinforcements += this.calculateContinentBonuses(player);
        return reinforcements;
    }

    calculateContinentBonuses(player) {
        let bonus = 0;
        
        for (const [continent, continentData] of Object.entries(mapData.continents)) {
            const territories = continentData.territories || [];
            if (territories.every(territory => 
                this.territories[territory] && 
                this.territories[territory].owner === player
            )) {
                bonus += this.continentBonuses[continent];
            }
        }
        
        return bonus;
    }

    advancePhase() {
        const oldPhase = this.phase;
        
        if (this.phase === 'startup') {
            // Check if all players have deployed their initial armies
            const allDeployed = this.players.every(
                player => this.remainingArmies[player] === 0
            );
            
            if (allDeployed) {
                this.phase = 'reinforcement';
                this.turnNumber = 1;
                this.currentPlayerIndex = 0;
                this.remainingArmies[this.getCurrentPlayer()] = 
                    this.calculateReinforcements(this.getCurrentPlayer());
            }
        } else if (this.phase === 'reinforcement') {
            this.phase = 'attack';
        } else if (this.phase === 'attack') {
            this.phase = 'fortification';
        } else if (this.phase === 'fortification') {
            this.advanceTurn();
        }
        
        console.log(`🔄 Server: Phase ${oldPhase} → ${this.phase}`);
        return { oldPhase, newPhase: this.phase };
    }

    advanceTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        
        if (this.currentPlayerIndex === 0) {
            this.turnNumber++;
        }
        
        this.phase = 'reinforcement';
        const currentPlayer = this.getCurrentPlayer();
        this.remainingArmies[currentPlayer] = this.calculateReinforcements(currentPlayer);
        
        console.log(`🔄 Server: Turn advanced to ${this.turnNumber}, Player: ${currentPlayer}`);
    }

    checkPlayerElimination(playerName) {
        const hasTerritory = Object.values(this.territories)
            .some(t => t.owner === playerName);
        
        if (!hasTerritory) {
            console.log(`💀 Server: Player ${playerName} eliminated`);
            const index = this.players.indexOf(playerName);
            if (index > -1) {
                this.players.splice(index, 1);
            }
            
            // Check for victory
            if (this.players.length === 1) {
                this.phase = 'victory';
                console.log(`🏆 Server: ${this.players[0]} wins!`);
                return { eliminated: true, victory: true, winner: this.players[0] };
            }
            
            return { eliminated: true, victory: false };
        }
        
        return { eliminated: false, victory: false };
    }

    serialize() {
        return {
            territories: this.territories,
            players: this.players,
            currentPlayerIndex: this.currentPlayerIndex,
            currentPlayer: this.getCurrentPlayer(),
            phase: this.phase,
            turnNumber: this.turnNumber,
            remainingArmies: this.remainingArmies,
            playerColors: this.playerColors,
            clientPlayerMapping: this.clientPlayerMapping,
            initializationSeed: this.initializationSeed,
            timestamp: Date.now()
        };
    }
}

module.exports = ServerGameState;
