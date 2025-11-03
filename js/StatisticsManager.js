/**
 * StatisticsManager - Comprehensive game statistics tracking
 * Integrates with existing Risk game infrastructure
 */
class StatisticsManager {
    constructor(gameState) {
        this.gameState = gameState;
        this.stats = {
            gameInfo: {
                startTime: new Date(),
                currentTurn: 1,
                totalBattles: 0,
                totalDeployments: 0,
                totalFortifications: 0
            },
            players: {},
            battles: [],
            territoryChanges: [],
            phaseHistory: [],
            continentControl: []
        };
        
        this.initializePlayerStats();
        this.setupEventListeners();
        console.log('📊 StatisticsManager initialized');
    }

    initializePlayerStats() {
        if (!this.gameState.players) return;
        
        this.gameState.players.forEach(player => {
            this.stats.players[player] = {
                name: player,
                territoriesOwned: 0,
                armiesDeployed: 0,
                battlesInitiated: 0,
                battlesWon: 0,
                battlesLost: 0,
                territoriesConquered: 0,
                territoriesLost: 0,
                continentsControlled: [],
                longestTerritoryHold: 0,
                armiesLost: 0,
                armiesKilled: 0,
                fortificationsMade: 0,
                averageArmiesPerTerritory: 0,
                turnDuration: [],
                totalArmies: 0,
                cardSetsTraded: 0
            };
        });
    }

    setupEventListeners() {
        // Hook into existing combat system
        this.hookIntoCombatManager();
        
        // Hook into phase changes
        this.hookIntoPhaseManager();
        
        // Hook into fortification
        this.hookIntoFortificationManager();
    }

    hookIntoCombatManager() {
        // Hook into AttackManager if available
        if (window.riskUI?.attackManager) {
            const originalExecuteAttack = window.riskUI.attackManager.executeAttack;
            if (originalExecuteAttack) {
                window.riskUI.attackManager.executeAttack = (...args) => {
                    const result = originalExecuteAttack.apply(window.riskUI.attackManager, args);
                    
                    // Record battle after execution
                    if (result && result.attackerLosses !== undefined) {
                        this.recordBattle({
                            attacker: this.gameState.getCurrentPlayer(),
                            defender: result.defender || 'Unknown',
                            attackingTerritory: result.attackingTerritory,
                            defendingTerritory: result.defendingTerritory,
                            attackerLosses: result.attackerLosses,
                            defenderLosses: result.defenderLosses,
                            conquered: result.conquered || false
                        });
                    }
                    
                    return result;
                };
            }
        }
    }

    hookIntoPhaseManager() {
        if (this.gameState.setPhase) {
            const originalSetPhase = this.gameState.setPhase;
            this.gameState.setPhase = (newPhase) => {
                const oldPhase = this.gameState.phase;
                const result = originalSetPhase.call(this.gameState, newPhase);
                
                this.recordPhaseChange({
                    oldPhase: oldPhase,
                    newPhase: newPhase
                });
                
                return result;
            };
        }
    }

    hookIntoFortificationManager() {
        if (window.riskUI?.fortificationManager?.executeFortification) {
            const originalFortify = window.riskUI.fortificationManager.executeFortification;
            window.riskUI.fortificationManager.executeFortification = (...args) => {
                const result = originalFortify.apply(window.riskUI.fortificationManager, args);
                this.recordFortification(args);
                return result;
            };
        }
    }

    recordBattle(battleData) {
        this.stats.gameInfo.totalBattles++;
        
        const battle = {
            turn: this.gameState.turnNumber,
            timestamp: new Date(),
            attacker: battleData.attacker,
            defender: battleData.defender,
            attackingTerritory: battleData.attackingTerritory,
            defendingTerritory: battleData.defendingTerritory,
            attackerLosses: battleData.attackerLosses || 0,
            defenderLosses: battleData.defenderLosses || 0,
            conquered: battleData.conquered || false
        };
        
        this.stats.battles.push(battle);

        // Update player stats
        if (this.stats.players[battleData.attacker]) {
            this.stats.players[battleData.attacker].battlesInitiated++;
            this.stats.players[battleData.attacker].armiesLost += battle.attackerLosses;
            this.stats.players[battleData.attacker].armiesKilled += battle.defenderLosses;
            
            if (battle.conquered) {
                this.stats.players[battleData.attacker].battlesWon++;
                this.stats.players[battleData.attacker].territoriesConquered++;
                
                this.recordConquest({
                    territory: battleData.defendingTerritory,
                    previousOwner: battleData.defender,
                    newOwner: battleData.attacker
                });
            }
        }

        if (this.stats.players[battleData.defender]) {
            this.stats.players[battleData.defender].armiesLost += battle.defenderLosses;
            this.stats.players[battleData.defender].armiesKilled += battle.attackerLosses;
            
            if (battle.conquered) {
                this.stats.players[battleData.defender].battlesLost++;
                this.stats.players[battleData.defender].territoriesLost++;
            }
        }

        // Update dashboard data
        if (window.updateDashboardData) {
            window.updateDashboardData();
        }
    }

    recordDeployment(player, territory, armies) {
        this.stats.gameInfo.totalDeployments++;
        
        if (this.stats.players[player]) {
            this.stats.players[player].armiesDeployed += armies;
        }
    }

    recordFortification(fortificationData) {
        this.stats.gameInfo.totalFortifications++;
        
        const player = this.gameState.getCurrentPlayer();
        if (this.stats.players[player]) {
            this.stats.players[player].fortificationsMade++;
        }
    }

    recordConquest(conquestData) {
        this.stats.territoryChanges.push({
            timestamp: new Date(),
            turn: this.gameState.turnNumber,
            territory: conquestData.territory,
            previousOwner: conquestData.previousOwner,
            newOwner: conquestData.newOwner
        });
    }

    recordPhaseChange(phaseData) {
        this.stats.phaseHistory.push({
            timestamp: new Date(),
            turn: this.gameState.turnNumber,
            oldPhase: phaseData.oldPhase,
            newPhase: phaseData.newPhase,
            player: this.gameState.getCurrentPlayer()
        });
    }

    updateCurrentStats() {
        // Reset territory counts
        Object.keys(this.stats.players).forEach(player => {
            this.stats.players[player].territoriesOwned = 0;
            this.stats.players[player].totalArmies = 0;
        });

        // Update territory counts and armies
        Object.keys(this.gameState.territories).forEach(territoryId => {
            const territory = this.gameState.territories[territoryId];
            if (territory.owner && this.stats.players[territory.owner]) {
                this.stats.players[territory.owner].territoriesOwned++;
                this.stats.players[territory.owner].totalArmies += territory.armies || 0;
            }
        });

        // Update continent control
        this.updateContinentControl();

        // Update averages
        Object.keys(this.stats.players).forEach(player => {
            const playerStats = this.stats.players[player];
            if (playerStats.territoriesOwned > 0) {
                playerStats.averageArmiesPerTerritory = 
                    (playerStats.totalArmies / playerStats.territoriesOwned).toFixed(1);
            }
        });
    }

    updateContinentControl() {
        // Use mapData if available
        if (typeof mapData !== 'undefined' && mapData.continents) {
            Object.keys(this.stats.players).forEach(player => {
                this.stats.players[player].continentsControlled = [];
            });

            Object.entries(mapData.continents).forEach(([continentId, continentData]) => {
                const territories = continentData.territories || [];
                const owners = new Set();
                
                territories.forEach(territoryId => {
                    const territory = this.gameState.territories[territoryId];
                    if (territory && territory.owner) {
                        owners.add(territory.owner);
                    }
                });

                if (owners.size === 1) {
                    const controller = [...owners][0];
                    if (this.stats.players[controller]) {
                        this.stats.players[controller].continentsControlled.push(continentData.name);
                    }
                }
            });
        }
    }

    getStatsSummary() {
        this.updateCurrentStats();
        
        return {
            gameInfo: {
                ...this.stats.gameInfo,
                duration: new Date() - this.stats.gameInfo.startTime,
                currentTurn: this.gameState.turnNumber,
                currentPhase: this.gameState.phase
            },
            players: this.stats.players,
            battles: this.stats.battles.slice(-20), // Last 20 battles
            territoryChanges: this.stats.territoryChanges.slice(-20), // Last 20 changes
            leaderboard: this.generateLeaderboard()
        };
    }

    generateLeaderboard() {
        return Object.values(this.stats.players)
            .sort((a, b) => b.territoriesOwned - a.territoriesOwned)
            .map((player, index) => ({
                rank: index + 1,
                name: player.name,
                territoriesOwned: player.territoriesOwned,
                totalArmies: player.totalArmies,
                continentsControlled: player.continentsControlled.length,
                battlesWon: player.battlesWon,
                battlesLost: player.battlesLost,
                winRate: player.battlesInitiated > 0 ?
                    (player.battlesWon / player.battlesInitiated * 100).toFixed(1) : '0.0',
                territoriesConquered: player.territoriesConquered,
                armiesKilled: player.armiesKilled,
                armiesLost: player.armiesLost,
                killDeathRatio: player.armiesLost > 0 ?
                    (player.armiesKilled / player.armiesLost).toFixed(2) : player.armiesKilled.toString()
            }));
    }

    exportStats() {
        return JSON.stringify(this.getStatsSummary(), null, 2);
    }

    // Save stats to localStorage for persistence
    saveStats() {
        try {
            localStorage.setItem('riskGameStats', this.exportStats());
            console.log('📊 Stats saved to localStorage');
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }

    // Load stats from localStorage
    loadStats() {
        try {
            const savedStats = localStorage.getItem('riskGameStats');
            if (savedStats) {
                const parsed = JSON.parse(savedStats);
                // Merge saved stats with current stats
                this.stats = { ...this.stats, ...parsed };
                console.log('📊 Stats loaded from localStorage');
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }
}

// Global access
window.StatisticsManager = StatisticsManager;
