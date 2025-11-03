class RiskGame {
    constructor(ui, map) {
        if (!ui || !map) {
            throw new Error('RiskGame requires UI and Map instances');
        }
        
        this.ui = ui;
        this.map = map;
        
        // Initialize players array if it doesn't exist
        if (!this.ui.players) {
            this.ui.players = [];
        }
        
        // Initialize gameState if it doesn't exist
        if (!this.ui.gameState) {
            this.ui.gameState = {
                players: ['Player 1', 'Player 2'], // Default to 2 players
                currentPlayer: 'Player 1',
                territories: {},
                reinforcements: {}
            };
        }
        
        this.assignTerritories();
    }

    assignTerritories() {
        if (!this.ui || !this.ui.players) {
            throw new Error('UI or players not properly initialized');
        }
        const territories = Object.keys(mapData.territories);
        const players = this.ui.gameState.players;
        
        // Create continent lookup from mapData.continents
        const continentLookup = {};
        if (mapData.continents) {
            Object.entries(mapData.continents).forEach(([continentName, continentData]) => {
                continentData.territories.forEach(territoryId => {
                    continentLookup[territoryId] = continentName;
                });
            });
        }
        
        // Initialize reinforcements with initial army counts
        const initialArmies = this.getInitialArmies(players.length);
        if (!this.ui.gameState.reinforcements) {
            this.ui.gameState.reinforcements = {};
        }
        players.forEach(player => {
            this.ui.gameState.reinforcements[player] = initialArmies;
        });
        
        // Shuffle territories
        for (let i = territories.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [territories[i], territories[j]] = [territories[j], territories[i]];
        }

        // Assign territories to players with 1 army each
        territories.forEach((territory, index) => {
            const playerIndex = index % players.length;
            const player = players[playerIndex];
            this.ui.gameState.territories[territory] = {
                owner: player,
                armies: 1,
                neighbors: mapData.territories[territory].neighbors,
                continent: continentLookup[territory]  // Use lookup instead of direct access
            };
            // Deduct one army for the initial placement
            this.ui.gameState.reinforcements[player]--;
        });

        this.currentPhase = 'deploy';
        this.updateTerritoryColors();
    }

    getInitialArmies(numPlayers) {
        // Use GameState's implementation
        return this.ui.gameState.getInitialArmies(numPlayers);
    }

    getArmyDisplay(armies) {
        if (armies >= 1000) {
            return `${Math.floor(armies/1000)}K`;
        }
        return armies.toString();
    }

    setupEventListeners() {
        // Territory Click Events
        document.querySelectorAll('.territory').forEach(territory => {
            territory.addEventListener('click', (e) => this.handleTerritoryClick(e.target));
        });
    }

    handleEndTurn() {
        // Delegate to TurnManager
        if (this.ui && this.ui.turnManager) {
            this.ui.turnManager.endTurn();
        }
    }

    handleTerritoryClick(territory) {
        const territoryId = territory.id || territory;
        
        // Delegate to TurnManager
        if (this.ui && this.ui.turnManager) {
            const result = this.ui.turnManager.handleTerritoryClick(territoryId);
            if (result) {
                this.ui.updateUI(result);
            }
        }
    }

    // Phase handling is now delegated to TurnManager
    // These methods are kept for backward compatibility but delegate to TurnManager

    highlightValidTargets(territoryId) {
        this.clearHighlights();
        const territory = document.getElementById(territoryId);
        territory.classList.add('selected');
        
        const validTargets = this.ui.getValidAttackTargets(territoryId);
        validTargets.forEach(target => {
            const targetElement = document.getElementById(target);
            if (targetElement) {
                targetElement.classList.add('valid-target');
            }
        });
    }

    highlightValidFortifyTargets(territoryId) {
        this.clearHighlights();
        const territory = document.getElementById(territoryId);
        territory.classList.add('selected');
        
        const validTargets = this.ui.getValidFortifyTargets(territoryId);
        validTargets.forEach(target => {
            const targetElement = document.getElementById(target);
            if (targetElement) {
                targetElement.classList.add('valid-target');
            }
        });
    }

    clearHighlights() {
        document.querySelectorAll('.territory').forEach(territory => {
            territory.classList.remove('selected', 'valid-target');
        });
    }

    updateUI() {
        const currentPlayer = this.ui.gameState.currentPlayer || this.ui.gameState.players[0];
        const reinforcements = this.ui.gameState.reinforcements[currentPlayer] || 0;

        // Update current player display
        const currentPlayerElement = document.querySelector('.current-player');
        const currentPhaseElement = document.querySelector('.current-phase');
        const playerColorIndicator = document.querySelector('.player-color-indicator');
        
        if (currentPlayerElement && currentPhaseElement && playerColorIndicator) {
            currentPlayerElement.textContent = currentPlayer;
            currentPhaseElement.textContent = `${this.currentPhase.charAt(0).toUpperCase() + this.currentPhase.slice(1)} Phase`;
            playerColorIndicator.style.backgroundColor = this.getPlayerColor(this.ui.gameState.players.indexOf(currentPlayer));
        }

        // Update player stats
        const territoriesElement = document.querySelector('.territories strong');
        const reinforcementsElement = document.querySelector('.reinforcements strong');
        
        if (territoriesElement && reinforcementsElement) {
            territoriesElement.textContent = this.countPlayerTerritories(currentPlayer);
            reinforcementsElement.textContent = reinforcements;
        }

        // Update territory info
        this.updateTerritoryInfo();

        // Update territory colors and army counts
        this.updateTerritoryColors();
    }

    countPlayerTerritories(player) {
        return Object.values(this.ui.gameState.territories)
            .filter(territory => territory.owner === player)
            .length;
    }

    // Territory info panel removed - method disabled
    /*
    updateTerritoryInfo() {
        const info = document.querySelector('.territory-info');
        if (this.selectedTerritory) {
            const territory = this.ui.gameState.territories[this.selectedTerritory];
            const neighbors = mapData.territories[this.selectedTerritory].neighbors;
            
            // Create a nicely formatted list of neighboring territories
            const neighborsList = neighbors.map(n => {
                const t = this.ui.gameState.territories[n];
                const isFriendly = t.owner === territory.owner;
                const style = isFriendly ? 'color: green;' : 'color: red;';
                return `<div style="${style}">
                    ${n.replace(/-/g, ' ')} 
                    (${t.owner} - ${this.getArmyDisplay(t.armies)} armies)
                    ${isFriendly ? '🤝' : '⚔️'}
                </div>`;
            }).join('');

            // Calculate continent bonus if player owns all territories in the continent
            const continentBonus = this.calculateContinentBonus(territory.owner);
            const totalReinforcements = this.calculateTotalReinforcements(territory.owner);

            info.innerHTML = `
                <h3>${this.selectedTerritory.replace(/-/g, ' ')}</h3>
                <div class="territory-details">
                    <p><strong>Owner:</strong> ${territory.owner}</p>
                    <p><strong>Armies:</strong> ${this.getArmyDisplay(territory.armies)}</p>
                    <p><strong>Phase:</strong> ${this.currentPhase}</p>
                    ${this.currentPhase === 'deploy' ? `
                        <p><strong>Available Reinforcements:</strong> ${this.getArmyDisplay(this.ui.gameState.reinforcements[territory.owner] || 0)}</p>
                        <p><strong>Next Turn Bonus:</strong> +${totalReinforcements} armies</p>
                        <p><strong>Continent Bonus:</strong> +${continentBonus} armies</p>
                    ` : ''}
                </div>
                <h4>Neighboring Territories:</h4>
                <div class="neighbors-list">${neighborsList}</div>
            `;
        } else {
            const currentPlayer = this.ui.gameState.currentPlayer;
            const reinforcements = this.ui.gameState.reinforcements[currentPlayer] || 0;
            const totalTerritories = Object.values(this.ui.gameState.territories)
                .filter(t => t.owner === currentPlayer).length;
            const continentBonus = this.calculateContinentBonus(currentPlayer);
            const totalReinforcements = this.calculateTotalReinforcements(currentPlayer);

            info.innerHTML = `
                <h3>Game Info</h3>
                <div class="player-stats">
                    <p><strong>Current Phase:</strong> ${this.currentPhase}</p>
                    <p><strong>Territories Owned:</strong> ${totalTerritories}</p>
                    ${this.currentPhase === 'deploy' ? `
                        <p><strong>Available Armies:</strong> ${this.getArmyDisplay(reinforcements)}</p>
                        <p><strong>Next Turn Bonus:</strong> +${totalReinforcements} armies</p>
                        <p><strong>Continent Bonus:</strong> +${continentBonus} armies</p>
                    ` : ''}
                </div>
                <p class="instructions">${this.getPhaseInstructions()}</p>
            `;
        }
    }
    */

    calculateContinentBonus(player) {
        let bonus = 0;
        Object.entries(mapData.continents).forEach(([continent, data]) => {
            const territories = data.territories;
            const ownsAll = territories.every(territory => 
                this.ui.gameState.territories[territory]?.owner === player
            );
            if (ownsAll) {
                bonus += data.captureBonus;
            }
        });
        return bonus;
    }

    calculateTotalReinforcements(player) {
        const territoryCount = Object.values(this.ui.gameState.territories)
            .filter(t => t.owner === player).length;
        const baseReinforcements = Math.max(3, Math.floor(territoryCount / 3));
        const continentBonus = this.calculateContinentBonus(player);
        return baseReinforcements + continentBonus;
    }

    getPhaseInstructions() {
        switch(this.currentPhase) {
            case 'deploy':
                return 'your territories to deploy armies';
            case 'attack':
                return 'a territory to attack from, then a target to attack';
            case 'fortify':
                return 'a source territory, then a destination to move armies';
            default:
                return 'any territory for information';
        }
    }

    updateTerritoryColors() {
        const players = this.ui.gameState.players;
        const mapGroup = document.querySelector('.map-group');
        
        // Use ColorManager's refreshAllTerritories if available
        if (window.riskUI && window.riskUI.colorManager && 
            typeof window.riskUI.colorManager.refreshAllTerritories === 'function') {
            window.riskUI.colorManager.refreshAllTerritories(this.ui.gameState);
            console.log('✅ All territories updated using dynamic opacity system');
            return;
        }
        
        // Fallback: Basic color update with 50% minimum opacity
        console.warn('⚠️ RiskGame using fallback - ColorManager not available');
        Object.entries(this.ui.gameState.territories).forEach(([territoryId, territory]) => {
            const element = document.getElementById(territoryId);
            if (element && territory.owner) {
                // Update territory color with minimum 25% opacity
                const playerIndex = players.indexOf(territory.owner);
                const color = this.getPlayerColor(playerIndex);
                
                // Convert to RGBA with 25% minimum opacity
                const hex = color.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                const rgbaColor = `rgba(${r}, ${g}, ${b}, 0.25)`;
                
                element.style.fill = rgbaColor;
                element.style.stroke = color;
                element.style.strokeWidth = '0.5';

                // Army count text display and background circles removed to clean up map
                // Territory army counts are still tracked in game state but not visually displayed on map
            }
        });
    }

    getPlayerColor(playerIndex) {
        // Use GameState's color management
        const player = this.ui.gameState.players[playerIndex];
        return this.ui.gameState.playerColors[player] || '#cccccc';
    }
}