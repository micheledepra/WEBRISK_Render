/**
 * ReinforcementManager - Handles reinforcement calculation and deployment
 * Manages the complete reinforcement system including continent bonuses
 */
class ReinforcementManager {
    constructor(gameState = null, territoryVisualManager = null) {
        this.gameState = gameState;
        this.territoryVisualManager = territoryVisualManager;
        this.deploymentModal = null;
        this.currentDeploymentTerritory = null;
        this.continentBonuses = {
            'north-america': { bonus: 5, territories: ['alaska', 'alberta', 'central america', 'eastern united states', 'greenland', 'northwest territory', 'ontario', 'quebec', 'western united states'] },
            'south-america': { bonus: 2, territories: ['argentina', 'brazil', 'peru', 'venezuela'] },
            'europe': { bonus: 5, territories: ['great britain', 'iceland', 'northern europe', 'scandinavia', 'southern europe', 'ukraine', 'western europe'] },
            'africa': { bonus: 3, territories: ['congo', 'east africa', 'egypt', 'madagascar', 'north africa', 'south africa'] },
            'asia': { bonus: 7, territories: ['afghanistan', 'china', 'india', 'irkutsk', 'japan', 'kamchatka', 'middle east', 'mongolia', 'siam', 'siberia', 'ural', 'yakutsk'] },
            'australia': { bonus: 2, territories: ['eastern australia', 'indonesia', 'new guinea', 'western australia'] }
        };
        
        this.createDeploymentModal();
    }

    /**
     * Initialize the ReinforcementManager with game state and visual manager
     */
    initializeGame(gameState, territoryVisualManager) {
        this.gameState = gameState;
        this.territoryVisualManager = territoryVisualManager;
    }

    /**
     * Calculate total reinforcements for a player at start of turn
     */
    calculateReinforcements(player) {
        // Base reinforcements: territories owned / 3, minimum 1
        const territoriesOwned = this.getPlayerTerritories(player).length;
        let reinforcements = Math.max(1, Math.floor(territoriesOwned / 3));

        // Add continent bonuses
        const continentBonus = this.calculateContinentBonuses(player);
        reinforcements += continentBonus;

        return reinforcements;
    }

    /**
     * Get all territories owned by a player
     */
    getPlayerTerritories(player) {
        return Object.entries(this.gameState.territories)
            .filter(([_, data]) => data.owner === player)
            .map(([territoryId]) => territoryId);
    }

    /**
     * Calculate continent bonuses for a player
     */
    calculateContinentBonuses(player) {
        let totalBonus = 0;

        Object.entries(this.continentBonuses).forEach(([continentId, continentData]) => {
            const ownsAllTerritories = continentData.territories.every(territory => 
                this.gameState.territories[territory] && 
                this.gameState.territories[territory].owner === player
            );

            if (ownsAllTerritories) {
                totalBonus += continentData.bonus;
            }
        });

        return totalBonus;
    }

    /**
     * Get continent control information for UI display
     */
    getContinentControlInfo(player) {
        const continentInfo = {};

        Object.entries(this.continentBonuses).forEach(([continentId, continentData]) => {
            const playerTerritories = continentData.territories.filter(territory => 
                this.gameState.territories[territory] && 
                this.gameState.territories[territory].owner === player
            );

            continentInfo[continentId] = {
                name: this.formatContinentName(continentId),
                bonus: continentData.bonus,
                owned: playerTerritories.length,
                total: continentData.territories.length,
                controlled: playerTerritories.length === continentData.territories.length,
                progress: (playerTerritories.length / continentData.territories.length) * 100
            };
        });

        return continentInfo;
    }

    /**
     * Format continent name for display
     */
    formatContinentName(continentId) {
        return continentId.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Start reinforcement phase for current player
     */
    startReinforcementPhase() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const reinforcements = this.calculateReinforcements(currentPlayer);
        
        // Store reinforcements in game state
        if (!this.gameState.remainingArmies) {
            this.gameState.remainingArmies = {};
        }
        this.gameState.remainingArmies[currentPlayer] = reinforcements;

        // CRITICAL: Initialize phase tracking at the TRUE start of reinforcement
        // This captures the army state BEFORE any deployments
        if (window.resetPhaseTracking) {
            console.log('🔄 Reinforcement phase starting - initializing tracking');
            window.resetPhaseTracking();
        }

        // Update UI
        this.updateReinforcementDisplay();
        
        return reinforcements;
    }

    /**
     * Check if player can deploy armies on a territory
     */
    canDeployOn(territoryId, player) {
        const territory = this.gameState.territories[territoryId];
        return territory && territory.owner === player;
    }

    /**
     * Get remaining reinforcements for current player
     */
    getRemainingReinforcements(player) {
        return this.gameState.remainingArmies[player] || 0;
    }

    /**
     * Deploy armies to a territory
     */
    deployArmies(territoryId, armyCount) {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const territory = this.gameState.territories[territoryId];
        const remainingArmies = this.getRemainingReinforcements(currentPlayer);
        const currentPhase = this.gameState.phase;

        // Validation
        if (!this.canDeployOn(territoryId, currentPlayer)) {
            throw new Error('Cannot deploy on enemy territory');
        }

        if (armyCount > remainingArmies) {
            throw new Error('Not enough reinforcements available');
        }

        if (armyCount < 1) {
            throw new Error('Must deploy at least 1 army');
        }

        // Deploy armies
        territory.armies += armyCount;
        this.gameState.remainingArmies[currentPlayer] -= armyCount;
        
        // Dispatch event for dashboard system
        document.dispatchEvent(new CustomEvent('armyCountChanged', {
            detail: { territoryId, armyCount: territory.armies, source: 'ReinforcementManager.deployArmies' }
        }));

        // Update visuals with dynamic opacity
        if (this.territoryVisualManager) {
            this.territoryVisualManager.updateTerritoryVisual(territoryId, territory, null, this.gameState);
        }
        
        // Refresh all territory opacities since max armies may have changed
        if (window.riskUI && window.riskUI.colorManager) {
            window.riskUI.colorManager.refreshAllTerritories(this.gameState);
        }
        
        this.updateReinforcementDisplay();
        
        // 💾 AUTO-SAVE: Save state after deployment
        this.gameState.saveToSession();

        // During startup phase, advance to next player only if current player has no armies left
        if (currentPhase === 'startup' && this.gameState.remainingArmies[currentPlayer] === 0) {
            const nextPlayerResult = this.gameState.nextPlayer();
            
            // Check if startup is complete (all players deployed AND we're back to first player)
            if (this.gameState.initialDeploymentComplete) {
                console.log('🎮 Startup phase complete! Transitioning to Turn 1...');
                
                // Transition to Turn 1 with reinforcement phase
                this.gameState.phase = 'reinforcement';
                this.gameState.turnNumber = 1;
                this.gameState.currentPlayerIndex = 0; // Reset to first player
                
                // Clear all remainingArmies before calculating reinforcements
                this.gameState.players.forEach(player => {
                    this.gameState.remainingArmies[player] = 0;
                });
                
                // Calculate reinforcements for first player
                const firstPlayer = this.gameState.getCurrentPlayer();
                const reinforcements = this.calculateReinforcements(firstPlayer);
                this.gameState.remainingArmies[firstPlayer] = reinforcements;
                
                // Update TurnManager if available
                if (window.turnManager) {
                    window.turnManager.startupComplete = true;
                    window.turnManager.currentPhase = 'reinforcement';
                    window.turnManager.turnNumber = 1;
                    window.turnManager.syncWithGameState();
                }
                
                // Update PhaseSynchronizer if available
                if (window.phaseSynchronizer) {
                    window.phaseSynchronizer.updatePhase('reinforcement', 'StartupComplete');
                }
                
                // ✅ CRITICAL: Reset deployment tracking for Turn 1
                if (window.resetPhaseTracking) {
                    console.log('🔄 Resetting tracking for Turn 1 start');
                    window.resetPhaseTracking();
                }
                
                console.log(`✅ Turn 1 begins! ${firstPlayer} gets ${reinforcements} reinforcements`);
            }
            
            // Update UI to show new current player
            if (window.updateTurnManagementUI) {
                window.updateTurnManagementUI();
            }
            if (window.updateReinforcementPanel) {
                window.updateReinforcementPanel();
            }
        }

        return {
            territory: territoryId,
            armiesDeployed: armyCount,
            newArmyCount: territory.armies,
            remainingReinforcements: this.gameState.remainingArmies[currentPlayer],
            nextPlayer: this.gameState.getCurrentPlayer()
        };
    }

    /**
     * Check if reinforcement phase is complete
     */
    isReinforcementPhaseComplete() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        return this.getRemainingReinforcements(currentPlayer) === 0;
    }

    /**
     * Open deployment modal for bulk army deployment
     * Supports both startup and reinforcement phases
     */
    openDeploymentModal(territoryId) {
        const territory = this.gameState.territories[territoryId];
        const currentPlayer = this.gameState.getCurrentPlayer();
        const currentPhase = this.gameState.phase;

        // Validate territory ownership
        if (!territory || territory.owner !== currentPlayer) {
            console.warn("Cannot deploy to territory owned by another player");
            return;
        }

        // Get remaining armies for current player
        const remainingArmies = this.gameState.remainingArmies[currentPlayer] || 0;

        if (remainingArmies === 0) {
            console.warn("No armies remaining to deploy");
            return;
        }

        // Store deployment state
        this.currentDeploymentTerritory = territoryId;

        // Update modal title based on phase
        const modalTitle = currentPhase === 'startup' 
            ? '🎮 Startup Deployment' 
            : '💰 Deploy Reinforcements';

        // Get modal element - use the instance variable
        const modal = this.deploymentModal;
        if (!modal) {
            console.warn("Deployment modal not initialized");
            return;
        }

        // Update modal header
        const headerElement = modal.querySelector(".deployment-header h3");
        if (headerElement) {
            headerElement.textContent = modalTitle;
        }

        // Update territory information
        const territoryNameEl = modal.querySelector("#deployment-territory-name");
        const currentArmiesEl = modal.querySelector("#deployment-current-armies");
        const availableArmiesEl = modal.querySelector("#deployment-available");

        if (territoryNameEl) {
            territoryNameEl.textContent = territoryId.replace(/-/g, " ").toUpperCase();
        }

        if (currentArmiesEl) {
            currentArmiesEl.textContent = territory.armies;
        }

        if (availableArmiesEl) {
            availableArmiesEl.textContent = remainingArmies;
        }

        // Update phase-specific instructions
        const infoDiv = modal.querySelector(".deployment-info");
        if (infoDiv) {
            let instructionsPara = infoDiv.querySelector("p.deployment-instructions");
            if (!instructionsPara) {
                // Create instructions paragraph if it doesn't exist
                instructionsPara = document.createElement("p");
                instructionsPara.className = "deployment-instructions";
                infoDiv.appendChild(instructionsPara);
            }
            const instructions = currentPhase === 'startup'
                ? "Deploy armies to your territories during initial setup. You can deploy multiple armies at once."
                : "Deploy your reinforcement armies to strengthen your territories.";
            instructionsPara.textContent = instructions;
        }

        // Set up input controls
        const armyInput = modal.querySelector('#deployment-army-count');
        const armySlider = modal.querySelector('#deployment-army-slider');
        
        if (armyInput) {
            armyInput.value = 1;
            armyInput.max = remainingArmies;
            armyInput.min = 1;
        }

        if (armySlider) {
            armySlider.value = 1;
            armySlider.max = remainingArmies;
            armySlider.min = 1;
        }

        // Update preview
        this.updateDeploymentPreview();

        // Show modal
        modal.style.display = 'block';
        
        // Auto-focus the input field for immediate keyboard input during deployment phases
        if (currentPhase === 'startup' || currentPhase === 'reinforcement') {
            setTimeout(() => {
                if (armyInput) {
                    armyInput.focus();
                    armyInput.select(); // Select the current value for easy replacement
                }
            }, 100);
        }
    }

    /**
     * Show deployment modal for territory
     */
    showDeploymentModal(territoryId) {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const territory = this.gameState.territories[territoryId];
        const remainingArmies = this.getRemainingReinforcements(currentPlayer);

        if (!this.canDeployOn(territoryId, currentPlayer)) {
            this.showError('You can only deploy armies on your own territories!');
            return;
        }

        if (remainingArmies <= 0) {
            this.showError('No reinforcements remaining!');
            return;
        }

        this.currentDeploymentTerritory = territoryId;
        
        // Update modal content
        const territoryName = this.formatTerritoryName(territoryId);
        const currentArmies = territory.armies;

        document.getElementById('deployment-territory-name').textContent = territoryName;
        document.getElementById('deployment-current-armies').textContent = currentArmies;
        document.getElementById('deployment-available').textContent = remainingArmies;
        
        const armyInput = document.getElementById('deployment-army-count');
        const armySlider = document.getElementById('deployment-army-slider');
        
        armyInput.value = 1;
        armyInput.max = remainingArmies;
        armySlider.value = 1;
        armySlider.max = remainingArmies;
        
        this.updateDeploymentPreview();
        
        // Show modal
        this.deploymentModal.style.display = 'flex';
    }

    /**
     * Hide deployment modal
     */
    hideDeploymentModal() {
        this.deploymentModal.style.display = 'none';
        this.currentDeploymentTerritory = null;
        
        // Blur the input field when modal closes
        const armyInput = document.getElementById('deployment-army-count');
        if (armyInput) {
            armyInput.blur();
        }
    }

    /**
     * Update deployment preview
     */
    updateDeploymentPreview() {
        if (!this.currentDeploymentTerritory) return;

        const armyCount = parseInt(document.getElementById('deployment-army-count').value) || 0;
        const territory = this.gameState.territories[this.currentDeploymentTerritory];
        const newTotal = territory.armies + armyCount;
        const currentPlayer = this.gameState.getCurrentPlayer();
        const remaining = this.getRemainingReinforcements(currentPlayer) - armyCount;

        document.getElementById('deployment-new-total').textContent = newTotal;
        document.getElementById('deployment-remaining-after').textContent = Math.max(0, remaining);
        
        // Update deploy button state
        const deployBtn = document.getElementById('deploy-armies-btn');
        deployBtn.disabled = armyCount < 1 || armyCount > this.getRemainingReinforcements(currentPlayer);
    }

    /**
     * Execute deployment
     */
    executeDeployment() {
        if (!this.currentDeploymentTerritory) return;

        const armyCount = parseInt(document.getElementById('deployment-army-count').value) || 0;
        const territoryName = this.formatTerritoryName(this.currentDeploymentTerritory);
        
        try {
            const result = this.deployArmies(this.currentDeploymentTerritory, armyCount);
            this.hideDeploymentModal();
            
            // Show success message
            this.showSuccess(`Deployed ${armyCount} armies to ${territoryName}`);
            
            return result;
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Format territory name for display
     */
    formatTerritoryName(territoryId) {
        if (!territoryId) return 'Unknown Territory';
        return territoryId.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Update reinforcement display in UI
     */
    updateReinforcementDisplay() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const remaining = this.getRemainingReinforcements(currentPlayer);
        
        // Update reinforcement counter
        const reinforcementCounter = document.getElementById('reinforcement-counter');
        if (reinforcementCounter) {
            reinforcementCounter.textContent = remaining;
        }

        // Update reinforcement info
        const reinforcementInfo = document.getElementById('reinforcement-info');
        if (reinforcementInfo) {
            if (remaining > 0) {
                reinforcementInfo.innerHTML = `
                    <div class="reinforcement-status">
                        <strong>${remaining}</strong> reinforcements remaining
                    </div>
                `;
                reinforcementInfo.className = 'reinforcement-info active';
            } else {
                reinforcementInfo.innerHTML = `
                    <div class="reinforcement-status complete">
                        All reinforcements deployed!
                    </div>
                `;
                reinforcementInfo.className = 'reinforcement-info complete';
            }
        }

        // Update continent bonuses display
        this.updateContinentBonusDisplay();
    }

    /**
     * Update continent bonus display
     */
    updateContinentBonusDisplay() {
        const currentPlayer = this.gameState.getCurrentPlayer();
        const continentInfo = this.getContinentControlInfo(currentPlayer);
        
        const continentDisplay = document.getElementById('continent-bonus-display');
        if (continentDisplay) {
            let html = '<h4>Continent Bonuses</h4>';
            
            Object.entries(continentInfo).forEach(([continentId, info]) => {
                const statusClass = info.controlled ? 'controlled' : 'partial';
                const progressWidth = Math.round(info.progress);
                
                html += `
                    <div class="continent-bonus-item ${statusClass}">
                        <div class="continent-name">${info.name}</div>
                        <div class="continent-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressWidth}%"></div>
                            </div>
                            <div class="progress-text">${info.owned}/${info.total}</div>
                        </div>
                        <div class="continent-bonus ${info.controlled ? 'active' : ''}">
                            +${info.bonus}
                        </div>
                    </div>
                `;
            });
            
            continentDisplay.innerHTML = html;
        }
    }

    /**
     * Create deployment modal
     */
    createDeploymentModal() {
        this.deploymentModal = document.createElement('div');
        this.deploymentModal.className = 'deployment-modal';
        this.deploymentModal.innerHTML = `
            <div class="deployment-modal-content">
                <div class="deployment-header">
                    <h3>Deploy Armies</h3>
                    <button class="close-btn" id="close-deployment-modal">&times;</button>
                </div>
                
                <div class="deployment-info">
                    <div class="territory-info">
                        <h4 id="deployment-territory-name">Territory Name</h4>
                        <p>Current armies: <span id="deployment-current-armies">0</span></p>
                    </div>
                    
                    <div class="available-armies">
                        <p>Available reinforcements: <span id="deployment-available">0</span></p>
                    </div>
                </div>
                
                <div class="deployment-controls">
                    <label for="deployment-army-count">Armies to deploy:</label>
                    <div class="army-input-group">
                        <button type="button" id="decrease-armies">-</button>
                        <input type="number" id="deployment-army-count" min="1" value="1">
                        <button type="button" id="increase-armies">+</button>
                    </div>
                    <input type="range" id="deployment-army-slider" min="1" value="1" class="army-slider" aria-label="Number of armies to deploy - drag to adjust" title="Drag slider to select number of armies to deploy">
                </div>
                
                <div class="deployment-preview">
                    <div class="preview-item">
                        <span>New total armies:</span>
                        <span id="deployment-new-total">1</span>
                    </div>
                    <div class="preview-item">
                        <span>Remaining reinforcements:</span>
                        <span id="deployment-remaining-after">0</span>
                    </div>
                </div>
                
                <div class="deployment-actions">
                    <button id="deploy-armies-btn" class="deploy-btn">Deploy Armies</button>
                    <button id="cancel-deployment-btn" class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.deploymentModal);
        this.setupModalEventListeners();
    }

    /**
     * Setup event listeners for deployment modal
     */
    setupModalEventListeners() {
        const armyInput = document.getElementById('deployment-army-count');
        const armySlider = document.getElementById('deployment-army-slider');
        const increaseBtn = document.getElementById('increase-armies');
        const decreaseBtn = document.getElementById('decrease-armies');
        const deployBtn = document.getElementById('deploy-armies-btn');
        const cancelBtn = document.getElementById('cancel-deployment-btn');
        const closeBtn = document.getElementById('close-deployment-modal');

        // Sync input and slider
        armyInput.addEventListener('input', () => {
            armySlider.value = armyInput.value;
            this.updateDeploymentPreview();
        });

        armySlider.addEventListener('input', () => {
            armyInput.value = armySlider.value;
            this.updateDeploymentPreview();
        });

        // +/- buttons
        increaseBtn.addEventListener('click', () => {
            const current = parseInt(armyInput.value) || 0;
            const max = parseInt(armyInput.max) || 0;
            if (current < max) {
                armyInput.value = current + 1;
                armySlider.value = current + 1;
                this.updateDeploymentPreview();
            }
        });

        decreaseBtn.addEventListener('click', () => {
            const current = parseInt(armyInput.value) || 0;
            if (current > 1) {
                armyInput.value = current - 1;
                armySlider.value = current - 1;
                this.updateDeploymentPreview();
            }
        });

        // Deploy button
        deployBtn.addEventListener('click', () => {
            this.executeDeployment();
        });

        // Cancel/close buttons
        cancelBtn.addEventListener('click', () => {
            this.hideDeploymentModal();
        });

        closeBtn.addEventListener('click', () => {
            this.hideDeploymentModal();
        });

        // Close on backdrop click
        this.deploymentModal.addEventListener('click', (e) => {
            if (e.target === this.deploymentModal) {
                this.hideDeploymentModal();
            }
        });

        // Keyboard shortcuts for deployment modal (Enter to deploy, ESC to cancel, direct number input)
        // Store reference to bound handler for cleanup
        this.keyboardHandler = (e) => {
            // Only activate keyboard controls when modal is visible and in deployment phase
            if (this.deploymentModal.style.display !== 'block' && this.deploymentModal.style.display !== 'flex') {
                return;
            }

            const currentPhase = this.gameState?.phase;
            const isDeploymentPhase = currentPhase === 'startup' || currentPhase === 'reinforcement';

            if (!isDeploymentPhase) {
                return;
            }

            // Don't interfere if user is typing in the input field
            const activeElement = document.activeElement;
            const isTypingInInput = activeElement && activeElement.id === 'deployment-army-count';

            if (e.key === 'Enter') {
                e.preventDefault();
                this.executeDeployment();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.hideDeploymentModal();
            } else if (!isTypingInInput && e.key >= '0' && e.key <= '9') {
                // Direct number input - focus the input and let the key go through
                e.preventDefault();
                armyInput.focus();
                const max = parseInt(armyInput.max) || 0;
                const newValue = parseInt(e.key);
                if (newValue > 0 && newValue <= max) {
                    armyInput.value = newValue;
                    armySlider.value = newValue;
                    this.updateDeploymentPreview();
                }
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // You can implement a toast notification system here
        console.log('Success:', message);
    }

    /**
     * Show error message
     */
    showError(message) {
        // You can implement a toast notification system here
        console.error('Error:', message);
        alert(message); // Temporary implementation
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReinforcementManager };
}