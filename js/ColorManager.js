/**
 * ColorManager - Centralized color management for the Risk game
 * Handles player colors, territory coloring, and visual state management
 */
class ColorManager {
    constructor() {
        this.playerColors = {};
        this.defaultColors = [
            '#ff4444', // Red
            '#44ff44', // Green
            '#4444ff', // Blue
            '#ffff44', // Yellow
            '#ff44ff', // Magenta
            '#44ffff'  // Cyan
        ];
        this.neutralTerritoryColor = '#F4D03F';
        this.initializeColors();
    }

    /**
     * Initialize player colors from sessionStorage or use defaults
     */
    initializeColors() {
        try {
            const storedPlayers = sessionStorage.getItem('riskPlayers');
            const storedColors = sessionStorage.getItem('riskPlayerColors');
            
            if (storedPlayers && storedColors) {
                const players = JSON.parse(storedPlayers);
                const colors = JSON.parse(storedColors);
                
                players.forEach((player, index) => {
                    this.playerColors[player] = colors[index] || this.defaultColors[index];
                });
            }
        } catch (error) {
            console.warn('Failed to load colors from sessionStorage:', error);
        }
    }

    /**
     * Get color for a specific player
     */
    getPlayerColor(player) {
        return this.playerColors[player] || this.neutralTerritoryColor;
    }

    /**
     * Set color for a player
     */
    setPlayerColor(player, color) {
        this.playerColors[player] = color;
        this.saveColorsToStorage();
    }

    /**
     * Get all player colors
     */
    getAllPlayerColors() {
        return { ...this.playerColors };
    }

    /**
     * Get neutral territory color
     */
    getNeutralColor() {
        return this.neutralTerritoryColor;
    }

    /**
     * Get color with opacity for highlighting
     */
    getColorWithOpacity(player, opacity = 0.7) {
        const color = this.getPlayerColor(player);
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Get contrasting text color (black or white) for a given background color
     */
    getContrastingTextColor(backgroundColor) {
        // Convert hex to RGB
        const r = parseInt(backgroundColor.slice(1, 3), 16);
        const g = parseInt(backgroundColor.slice(3, 5), 16);
        const b = parseInt(backgroundColor.slice(5, 7), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }

    /**
     * Save colors to sessionStorage
     */
    saveColorsToStorage() {
        try {
            const players = Object.keys(this.playerColors);
            const colors = players.map(player => this.playerColors[player]);
            sessionStorage.setItem('riskPlayers', JSON.stringify(players));
            sessionStorage.setItem('riskPlayerColors', JSON.stringify(colors));
        } catch (error) {
            console.warn('Failed to save colors to sessionStorage:', error);
        }
    }

    /**
     * Get phase-specific highlighting colors
     */
    getPhaseColors() {
        return {
            selected: '#FFD700',      // Gold for selected territory
            validTarget: '#4CAF50',   // Green for valid targets
            invalidTarget: '#F44336', // Red for invalid targets
            ownTerritory: '#2196F3',  // Blue for own territories
            hover: '#FF9800',         // Orange for hover
            'valid-source': '#4CAF50',       // Green for valid fortify sources
            'valid-destination': '#2196F3',  // Blue for valid fortify destinations
            'selected-source': '#FF9800',    // Orange for selected source
            'selected-destination': '#E91E63' // Pink for selected destination
        };
    }

    /**
     * Calculate dynamic opacity based on army count within the same continent
     * Min armies (1) = 30% opacity, Max armies in continent = 80% opacity
     * @param {number} armies - Current territory army count
     * @param {string} continent - Territory's continent
     * @param {Object} allTerritories - All game territories
     * @returns {number} Opacity value between 0.3 and 0.8
     */
    calculateDynamicOpacity(armies, continent, allTerritories) {
        // Handle case where continent is not provided
        if (!continent) {
            console.warn('⚠️ No continent provided for opacity calculation, using global max');
            const maxArmies = Math.max(
                ...Object.values(allTerritories).map(t => t.armies || 1),
                1
            );
            const minOpacity = 0.3;
            const maxOpacity = 0.8;
            const normalizedValue = maxArmies === 1 ? 0 : (armies - 1) / (maxArmies - 1);
            return Math.max(minOpacity, Math.min(maxOpacity, minOpacity + (normalizedValue * (maxOpacity - minOpacity))));
        }

        // Find maximum army count only within the same continent
        const continentTerritories = Object.values(allTerritories).filter(
            t => t.continent === continent
        );
        
        if (continentTerritories.length === 0) {
            return 0.3; // Default minimum if no territories found in continent
        }

        const maxArmiesInContinent = Math.max(
            ...continentTerritories.map(t => t.armies || 1),
            1
        );
        
        // If all territories in continent have 1 army, return minimum opacity
        if (maxArmiesInContinent === 1) {
            return 0.3;
        }
        
        // Linear interpolation: 0.3 (1 army) to 0.8 (max armies in continent)
        const minOpacity = 0.3;
        const maxOpacity = 0.8;
        const normalizedValue = (armies - 1) / (maxArmiesInContinent - 1);
        const opacity = minOpacity + (normalizedValue * (maxOpacity - minOpacity));
        
        return Math.max(minOpacity, Math.min(maxOpacity, opacity));
    }

    /**
     * Convert hex color to RGBA with specified opacity
     * @param {string} hex - Hex color code (e.g., '#ff4444')
     * @param {number} opacity - Opacity value between 0 and 1
     * @returns {string} RGBA color string
     */
    hexToRGBA(hex, opacity) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse RGB values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Darken a hex color by a specified percentage
     * @param {string} hex - Hex color code (e.g., '#ff4444')
     * @param {number} percent - Percentage to darken (0-100)
     * @returns {string} Darkened hex color
     */
    darkenColor(hex, percent) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse RGB values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Calculate darkened values
        const factor = 1 - (percent / 100);
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        
        // Convert back to hex
        const toHex = (value) => value.toString(16).padStart(2, '0');
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }

    /**
     * Update territory color with dynamic opacity based on army count
     * @param {string} territoryId - Territory ID
     * @param {string} owner - Player who owns the territory
     * @param {Object} gameState - Current game state with territories
     */
    updateTerritoryColorWithOpacity(territoryId, owner, gameState) {
        // Territory element IS the path element (see RiskMap.js createTerritoryPaths)
        const pathElement = document.getElementById(territoryId);
        if (!pathElement) {
            console.warn(`Territory element not found: ${territoryId}`);
            return;
        }
        
        const playerColor = this.playerColors[owner];
        if (!playerColor) {
            console.warn(`No color found for player: ${owner}`);
            return;
        }
        
        // Get army count and continent for continent-relative opacity calculation
        const territory = gameState.territories[territoryId];
        const armies = territory ? territory.armies : 1;
        const continent = territory ? territory.continent : null;
        const opacity = this.calculateDynamicOpacity(armies, continent, gameState.territories);
        
        // Convert hex color to RGBA with dynamic opacity
        const rgbaColor = this.hexToRGBA(playerColor, opacity);
        
        // Create darker border color (20% darker)
        const darkerBorderColor = this.darkenColor(playerColor, 20);
        
        // Update SVG path element with opacity-adjusted color and darker border
        pathElement.style.fill = rgbaColor;
        pathElement.style.stroke = darkerBorderColor; // Use darker border
        pathElement.style.strokeWidth = '0.5'; // Ensure visible borders
        
        // DEBUG: Log opacity updates
        console.log(`🎨 ${territoryId} (${continent || 'unknown'}): ${armies} armies → ${(opacity * 100).toFixed(0)}% opacity`);
    }

    /**
     * Refresh all territory colors and opacities
     * Call after any army count changes (attacks, reinforcements, fortifications)
     * @param {Object} gameState - Current game state
     */
    refreshAllTerritories(gameState) {
        if (!gameState || !gameState.territories) {
            console.warn('Invalid gameState provided to refreshAllTerritories');
            return;
        }
        
        Object.keys(gameState.territories).forEach(territoryId => {
            const territory = gameState.territories[territoryId];
            if (territory.owner) {
                this.updateTerritoryColorWithOpacity(territoryId, territory.owner, gameState);
            }
        });
    }
}

/**
 * TerritoryVisualManager - Handles visual representation of territories
 */
class TerritoryVisualManager {
    constructor(colorManager) {
        this.colorManager = colorManager;
        this.armyCountElements = new Map();
        this.highlightStates = new Map();
        this.phaseColors = this.colorManager.getPhaseColors();
        
        // Initialize ArmyCountManager integration
        this.armyCountManager = null;
    }

    /**
     * Set ArmyCountManager instance for integration
     */
    setArmyCountManager(armyCountManager) {
        this.armyCountManager = armyCountManager;
        console.log('✅ ArmyCountManager integrated with TerritoryVisualManager');
    }

    /**
     * Update territory color based on ownership
     * OFFICIAL METHOD - Always uses dynamic opacity system
     * @param {string} territoryId - Territory ID
     * @param {string} owner - Owner player
     * @param {Object} gameState - Game state for dynamic opacity (required for owned territories)
     */
    updateTerritoryColor(territoryId, owner, gameState = null) {
        // Territory element IS the path element (see RiskMap.js createTerritoryPaths)
        const pathElement = document.getElementById(territoryId);
        if (!pathElement) return;

        const color = owner ? 
            this.colorManager.getPlayerColor(owner) : 
            this.colorManager.getNeutralColor();
        
        pathElement.setAttribute('data-owner', owner || '');
        
        // ALWAYS use dynamic opacity if territory has owner
        if (owner && gameState && gameState.territories) {
            // Use the official dynamic opacity method
            this.colorManager.updateTerritoryColorWithOpacity(territoryId, owner, gameState);
        } else if (owner) {
            // No gameState provided but has owner - use default opacity (25%)
            const defaultOpacity = 0.25;
            const rgbaColor = this.colorManager.hexToRGBA(color, defaultOpacity);
            const darkerBorderColor = this.colorManager.darkenColor(color, 20);
            
            pathElement.style.fill = rgbaColor;
            pathElement.style.stroke = darkerBorderColor;
            pathElement.style.strokeWidth = '0.5';
        } else {
            // Neutral territory - no owner, use solid color
            pathElement.style.fill = color;
            pathElement.style.stroke = color;
            pathElement.style.strokeWidth = '0.5';
        }
    }

    /**
     * Update army count indicator
     * @param {string} territoryId - Territory ID
     * @param {number} armyCount - Army count
     * @param {string} owner - Territory owner
     * @param {Object} gameState - Optional game state for opacity updates
     */
    updateArmyCount(territoryId, armyCount, owner, gameState = null) {
        // Use ArmyCountManager if available
        if (this.armyCountManager) {
            this.armyCountManager.updateArmyCount(territoryId, true);
            return;
        }

        // Fallback to legacy implementation
        this.removeArmyCount(territoryId);
        
        if (armyCount <= 0) return;

        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) return;

        // Get territory center
        const bbox = territoryElement.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        // Create background circle
        const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bgCircle.setAttribute("id", `${territoryId}-army-bg`);
        bgCircle.setAttribute("cx", centerX);
        bgCircle.setAttribute("cy", centerY);
        bgCircle.setAttribute("r", "12");
        bgCircle.setAttribute("fill", "rgba(0, 0, 0, 0.7)");
        bgCircle.setAttribute("stroke", "#fff");
        bgCircle.setAttribute("stroke-width", "1");
        bgCircle.style.pointerEvents = "none";

        // Create text element
        const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("id", `${territoryId}-army-count`);
        textElement.setAttribute("x", centerX);
        textElement.setAttribute("y", centerY);
        textElement.setAttribute("text-anchor", "middle");
        textElement.setAttribute("dominant-baseline", "middle");
        textElement.setAttribute("fill", "#fff");
        textElement.setAttribute("font-size", "12");
        textElement.setAttribute("font-weight", "bold");
        textElement.style.pointerEvents = "none";
        textElement.textContent = armyCount > 999 ? `${Math.floor(armyCount/1000)}K` : armyCount.toString();

        // Add to SVG
        const svgElement = territoryElement.closest('svg');
        if (svgElement) {
            svgElement.appendChild(bgCircle);
            svgElement.appendChild(textElement);
            
            this.armyCountElements.set(territoryId, {
                background: bgCircle,
                text: textElement
            });
        }
        
        // Update territory opacity if gameState provided
        if (gameState && owner) {
            this.updateTerritoryColor(territoryId, owner, gameState);
        }
    }

    /**
     * Remove army count indicator
     */
    removeArmyCount(territoryId) {
        const elements = this.armyCountElements.get(territoryId);
        if (elements) {
            elements.background.remove();
            elements.text.remove();
            this.armyCountElements.delete(territoryId);
        }
    }

    /**
     * Highlight territory for specific phase
     */
    highlightTerritory(territoryId, highlightType, active = true) {
        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) return;

        if (!active) {
            this.clearHighlight(territoryId);
            return;
        }

        const color = this.phaseColors[highlightType] || this.phaseColors.hover;
        territoryElement.style.stroke = color;
        territoryElement.style.strokeWidth = "3";
        territoryElement.classList.add(`highlight-${highlightType}`);
        
        this.highlightStates.set(territoryId, highlightType);
    }

    /**
     * Clear highlight from territory
     */
    clearHighlight(territoryId) {
        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) return;

        territoryElement.style.stroke = "#333";
        territoryElement.style.strokeWidth = "1";
        
        // Remove all highlight classes
        const classList = territoryElement.classList;
        for (let i = classList.length - 1; i >= 0; i--) {
            if (classList[i].startsWith('highlight-')) {
                classList.remove(classList[i]);
            }
        }
        
        this.highlightStates.delete(territoryId);
    }

    /**
     * Clear all highlights
     */
    clearAllHighlights() {
        this.highlightStates.forEach((_, territoryId) => {
            this.clearHighlight(territoryId);
        });
    }

    /**
     * Update territory visual state (color, army count, highlighting)
     * @param {string} territoryId - Territory ID
     * @param {Object} territoryData - Territory data
     * @param {string} highlightType - Optional highlight type
     * @param {Object} gameState - Optional game state for opacity
     */
    updateTerritoryVisual(territoryId, territoryData, highlightType = null, gameState = null) {
        this.updateTerritoryColor(territoryId, territoryData.owner, gameState);
        this.updateArmyCount(territoryId, territoryData.armies, territoryData.owner, gameState);
        
        if (highlightType) {
            this.highlightTerritory(territoryId, highlightType);
        }
    }

    /**
     * Get territory visual information for tooltips
     */
    getTerritoryVisualInfo(territoryId, territoryData, currentPlayer, currentPhase) {
        const isOwned = territoryData.owner === currentPlayer;
        const hasArmies = territoryData.armies > 0;
        const canDeploy = isOwned && currentPhase === 'deploy';
        const canAttackFrom = isOwned && territoryData.armies > 1 && currentPhase === 'attack';
        const canFortifyFrom = isOwned && territoryData.armies > 1 && currentPhase === 'fortify';
        const canFortifyTo = isOwned && currentPhase === 'fortify';

        return {
            territoryId,
            owner: territoryData.owner,
            armies: territoryData.armies,
            playerColor: territoryData.owner ? this.colorManager.getPlayerColor(territoryData.owner) : null,
            isOwned,
            hasArmies,
            availableActions: {
                canDeploy,
                canAttackFrom,
                canFortifyFrom,
                canFortifyTo
            }
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ColorManager, TerritoryVisualManager };
}