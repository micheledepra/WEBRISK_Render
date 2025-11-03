/**
 * Enhanced Tooltip System for Risk Game
 * Shows territory information, ownership, armies, and available actions
 */
class EnhancedTooltip {
    constructor(colorManager, territoryVisualManager) {
        this.colorManager = colorManager;
        this.territoryVisualManager = territoryVisualManager;
        this.tooltip = null;
        this.isVisible = false;
        this.currentTerritory = null;
        this.gameState = null;
        this.currentPlayer = null;
        this.currentPhase = null;
        
        this.createTooltipElement();
        this.setupEventListeners();
    }

    /**
     * Create the tooltip DOM element
     */
    createTooltipElement() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'enhanced-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            pointer-events: none;
            z-index: 10000;
            display: none;
            min-width: 220px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255,255,255,0.1);
            transition: opacity var(--pop-duration, 200ms) var(--pop-ease, cubic-bezier(.2,.9,.2,1)), 
                        transform var(--pop-duration, 200ms) var(--pop-ease, cubic-bezier(.2,.9,.2,1));
            transform-origin: top left;
        `;
        document.body.appendChild(this.tooltip);
    }

    /**
     * Set game context for tooltip information
     */
    setGameContext(gameState, currentPlayer, currentPhase) {
        this.gameState = gameState;
        this.currentPlayer = currentPlayer;
        this.currentPhase = currentPhase;
    }

    /**
     * Show tooltip for a territory
     */
    showTooltip(territoryId, event) {
        if (!this.gameState || !territoryId) return;

        this.currentTerritory = territoryId;
        const territoryData = this.gameState.territories[territoryId];
        
        if (!territoryData) return;

        const visualInfo = this.territoryVisualManager.getTerritoryVisualInfo(
            territoryId, 
            territoryData, 
            this.currentPlayer, 
            this.currentPhase
        );

        this.tooltip.innerHTML = this.generateTooltipContent(territoryId, territoryData, visualInfo);
        
        // Set initial position and make visible immediately
        this.tooltip.style.display = 'block';
        this.positionTooltip(event);
        
        // Add popped class to sync with territory animation
        this.tooltip.classList.add('territory-popped');
        this.isVisible = true;

        // Trigger animation immediately
        requestAnimationFrame(() => {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'scale(1)';
        });
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (!this.isVisible) return;

        // Remove popped class
        this.tooltip.classList.remove('territory-popped');
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            this.tooltip.style.display = 'none';
            this.isVisible = false;
            this.currentTerritory = null;
        }, 200);
    }

    /**
     * Generate tooltip HTML content
     */
    generateTooltipContent(territoryId, territoryData, visualInfo) {
        const territoryName = this.formatTerritoryName(territoryId);
        const continent = this.getContinent(territoryId);
        
        let content = `
            <div class="tooltip-header" style="
                font-weight: bold; 
                font-size: 16px; 
                margin-bottom: 8px; 
                border-bottom: 1px solid rgba(255,255,255,0.3); 
                padding-bottom: 6px;
                color: #fff;
            ">
                ${territoryName}
            </div>
        `;

        // Owner information
        if (territoryData.owner) {
            const ownerColor = visualInfo.playerColor;
            const isCurrentPlayer = territoryData.owner === this.currentPlayer;
            content += `
                <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                    <span style="color: #ccc;">Owner:</span>
                    <span style="color: ${ownerColor}; font-weight: bold;">
                        ${territoryData.owner} ${isCurrentPlayer ? '(You)' : ''}
                    </span>
                </div>
            `;
        } else {
            content += `
                <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                    <span style="color: #ccc;">Owner:</span>
                    <span style="color: #999; font-style: italic;">Unoccupied</span>
                </div>
            `;
        }

        // Army count
        content += `
            <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                <span style="color: #ccc;">Armies:</span>
                <span style="color: #FFC107; font-weight: bold;">${territoryData.armies}</span>
            </div>
        `;

        // Continent information
        if (continent) {
            content += `
                <div class="tooltip-row" style="display: flex; justify-content: space-between; margin: 6px 0;">
                    <span style="color: #ccc;">Continent:</span>
                    <span style="color: #81C784;">${continent}</span>
                </div>
            `;
        }

        // Available actions based on current phase
        const actions = this.getAvailableActions(visualInfo);
        if (actions.length > 0) {
            content += `
                <div class="tooltip-actions" style="
                    margin-top: 10px; 
                    padding-top: 8px; 
                    border-top: 1px solid rgba(255,255,255,0.2);
                ">
                    <div style="color: #4CAF50; font-weight: bold; margin-bottom: 4px;">Available Actions:</div>
                    ${actions.map(action => `
                        <div style="color: #E0E0E0; font-size: 12px; margin: 2px 0;">
                            • ${action}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Phase-specific tips
        const tips = this.getPhaseSpecificTips(visualInfo);
        if (tips.length > 0) {
            content += `
                <div class="tooltip-tips" style="
                    margin-top: 8px; 
                    padding-top: 6px; 
                    border-top: 1px solid rgba(255,255,255,0.1);
                ">
                    ${tips.map(tip => `
                        <div style="color: #FFB74D; font-size: 11px; margin: 2px 0; font-style: italic;">
                            💡 ${tip}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return content;
    }

    /**
     * Get available actions for the territory
     */
    getAvailableActions(visualInfo) {
        const actions = [];
        const { availableActions } = visualInfo;

        if (availableActions.canDeploy) {
            actions.push('Deploy reinforcements');
        }
        if (availableActions.canAttackFrom) {
            actions.push('Attack from here');
        }
        if (availableActions.canFortifyFrom) {
            actions.push('Move armies from here');
        }
        if (availableActions.canFortifyTo) {
            actions.push('Move armies to here');
        }

        return actions;
    }

    /**
     * Get phase-specific tips
     */
    getPhaseSpecificTips(visualInfo) {
        const tips = [];
        
        switch (this.currentPhase) {
            case 'deploy':
                if (visualInfo.isOwned) {
                    tips.push('Click to deploy reinforcements');
                } else {
                    tips.push('You can only deploy on your own territories');
                }
                break;
                
            case 'attack':
                if (visualInfo.isOwned && visualInfo.armies > 1) {
                    tips.push('Click to select as attacking territory');
                } else if (visualInfo.isOwned) {
                    tips.push('Need more than 1 army to attack');
                } else {
                    tips.push('Enemy territory - can be attacked');
                }
                break;
                
            case 'fortify':
                if (visualInfo.isOwned && visualInfo.armies > 1) {
                    tips.push('Click to move armies from here');
                } else if (visualInfo.isOwned) {
                    tips.push('Can receive armies from other territories');
                } else {
                    tips.push('Cannot fortify enemy territories');
                }
                break;
        }

        return tips;
    }

    /**
     * Position tooltip near the cursor (avoiding overlap with custom cursor)
     * Aligns top-left corner of tooltip with bottom-right corner of cursor
     */
    positionTooltip(event) {
        const cursorSize = 32; // Custom cursor is 32x32px
        const gap = 2; // Small gap between cursor and tooltip
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        // Determine if tooltip should be on right or left of cursor
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceOnRight = windowWidth - event.clientX;
        const tooltipFitsOnRight = spaceOnRight > tooltipRect.width + cursorSize + gap + 10; // 10px buffer
        
        let x, y;
        
        if (tooltipFitsOnRight) {
            // Position tooltip's top-left corner at cursor's bottom-right corner
            this.tooltip.classList.add('right-positioned');
            this.tooltip.classList.remove('left-positioned');
            
            // Top-left of tooltip = Bottom-right of cursor (cursor position + cursor size)
            x = event.clientX + cursorSize + gap; // Cursor left + cursor width + small gap
            y = event.clientY + cursorSize + gap; // Cursor top + cursor height + small gap
        } else {
            // Position tooltip to the left of cursor
            this.tooltip.classList.add('left-positioned');
            this.tooltip.classList.remove('right-positioned');
            
            x = event.clientX - tooltipRect.width - gap;
            y = event.clientY + cursorSize + gap; // Still below cursor
        }
        
        // Ensure tooltip doesn't go off bottom of screen
        if (y + tooltipRect.height > windowHeight - 10) {
            y = windowHeight - tooltipRect.height - 10;
        }
        
        // Ensure tooltip doesn't go off top of screen
        if (y < 10) {
            y = 10;
        }
        
        // Ensure tooltip doesn't go off left edge
        if (x < 10) {
            x = 10;
        }
        
        // Ensure tooltip doesn't go off right edge
        if (x + tooltipRect.width > windowWidth - 10) {
            x = windowWidth - tooltipRect.width - 10;
        }

        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
        
        // Set initial state for animation
        this.tooltip.style.opacity = '0';
        this.tooltip.style.transform = 'scale(0.95)';
    }

    /**
     * Update tooltip position (called on mousemove)
     */
    updatePosition(event) {
        if (!this.isVisible) return;
        
        const cursorSize = 32;
        const gap = 2;
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const spaceOnRight = windowWidth - event.clientX;
        const tooltipFitsOnRight = spaceOnRight > tooltipRect.width + cursorSize + gap + 10;
        
        let x, y;
        
        if (tooltipFitsOnRight) {
            x = event.clientX + cursorSize + gap;
            y = event.clientY + cursorSize + gap;
        } else {
            x = event.clientX - tooltipRect.width - gap;
            y = event.clientY + cursorSize + gap;
        }
        
        if (y + tooltipRect.height > windowHeight - 10) {
            y = windowHeight - tooltipRect.height - 10;
        }
        if (y < 10) {
            y = 10;
        }
        if (x < 10) {
            x = 10;
        }
        if (x + tooltipRect.width > windowWidth - 10) {
            x = windowWidth - tooltipRect.width - 10;
        }

        this.tooltip.style.left = x + 'px';
        this.tooltip.style.top = y + 'px';
    }

    /**
     * Format territory name for display
     */
    formatTerritoryName(territoryId) {
        return territoryId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Get continent name for territory
     */
    getContinent(territoryId) {
        const continentMap = {
            // North America
            'alaska': 'North America',
            'alberta': 'North America',
            'central america': 'North America',
            'eastern united states': 'North America',
            'greenland': 'North America',
            'northwest territory': 'North America',
            'ontario': 'North America',
            'quebec': 'North America',
            'western united states': 'North America',
            
            // South America
            'argentina': 'South America',
            'brazil': 'South America',
            'peru': 'South America',
            'venezuela': 'South America',
            
            // Europe
            'great britain': 'Europe',
            'iceland': 'Europe',
            'northern europe': 'Europe',
            'scandinavia': 'Europe',
            'southern europe': 'Europe',
            'ukraine': 'Europe',
            'western europe': 'Europe',
            
            // Africa
            'central-africa': 'Africa',
            'congo': 'Africa',
            'east africa': 'Africa',
            'egypt': 'Africa',
            'madagascar': 'Africa',
            'north africa': 'Africa',
            'south africa': 'Africa',
            
            // Asia
            'afghanistan': 'Asia',
            'china': 'Asia',
            'india': 'Asia',
            'irkutsk': 'Asia',
            'japan': 'Asia',
            'kamchatka': 'Asia',
            'middle east': 'Asia',
            'mongolia': 'Asia',
            'siam': 'Asia',
            'siberia': 'Asia',
            'ural': 'Asia',
            'yakutsk': 'Asia',
            
            // Australia
            'eastern australia': 'Australia',
            'indonesia': 'Australia',
            'new guinea': 'Australia',
            'western australia': 'Australia'
        };
        
        return continentMap[territoryId.toLowerCase()] || 'Unknown';
    }

    /**
     * Setup event listeners for mouse tracking
     */
    setupEventListeners() {
        // No global mousemove listener needed anymore
        // Position updates are handled by RiskMap's mousemove events
    }

    /**
     * Update tooltip if currently visible
     */
    updateTooltip() {
        if (this.isVisible && this.currentTerritory) {
            const event = { clientX: 0, clientY: 0 }; // Will be repositioned on next mouse move
            this.showTooltip(this.currentTerritory, event);
        }
    }

    /**
     * Destroy tooltip
     */
    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedTooltip };
}