/**
 * ArmyCountManager - Real-time army count display system
 * Ensures all territories always have visible, centered army count displays
 */
class ArmyCountManager {
    constructor(gameState, colorManager) {
        this.gameState = gameState;
        this.colorManager = colorManager;
        this.armyCountElements = new Map();
        this.updateInterval = null;
        this.isInitialized = false;
    }

    /**
     * Initialize army counts for ALL territories
     * Creates persistent army count displays that are always visible
     */
    initializeAllArmyCounts() {
        if (!this.gameState || !this.gameState.territories) {
            console.warn('GameState not available for army count initialization');
            return false;
        }

        console.log('🔢 Initializing army counts for all territories...');
        
        Object.keys(this.gameState.territories).forEach(territoryId => {
            this.createPersistentArmyCount(territoryId);
        });

        this.isInitialized = true;
        this.startRealTimeUpdates();
        console.log(`✅ Army counts initialized for ${Object.keys(this.gameState.territories).length} territories`);
        return true;
    }

    /**
     * Create persistent army count display for a territory
     * Always visible, pinned, and centered
     */
    createPersistentArmyCount(territoryId) {
        const territoryElement = document.getElementById(territoryId);
        if (!territoryElement) {
            console.warn(`Territory element not found: ${territoryId}`);
            return;
        }

        // Remove existing army count if present
        this.removeArmyCount(territoryId);

        // Get territory center using getBBox for accurate positioning
        const bbox = territoryElement.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        // Get current army count
        const territory = this.gameState.territories[territoryId];
        const armyCount = territory ? territory.armies : 1;
        const owner = territory ? territory.owner : null;

        // Find the correct SVG container - look for the same parent as territories
        let svgContainer = territoryElement.parentNode;
        
        // If territory is in a group (like <g id="territories">), use that group
        while (svgContainer && svgContainer.tagName !== 'svg' && svgContainer.tagName !== 'g') {
            svgContainer = svgContainer.parentNode;
        }
        
        // If we found a group container, use it; otherwise use the SVG root
        if (!svgContainer || svgContainer.tagName === 'svg') {
            // Look specifically for a territories group
            const territoriesGroup = document.querySelector('#territories, .territories, g[id*="territory"], g[class*="territory"]');
            if (territoriesGroup) {
                svgContainer = territoriesGroup;
            } else {
                // Fall back to the main SVG element
                svgContainer = territoryElement.closest('svg');
            }
        }

        if (!svgContainer) {
            console.warn(`Could not find SVG container for territory: ${territoryId}`);
            return;
        }

        // Create enhanced background circle with border
        const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        bgCircle.setAttribute("id", `${territoryId}-army-bg`);
        bgCircle.setAttribute("cx", centerX);
        bgCircle.setAttribute("cy", centerY);
        bgCircle.setAttribute("r", "14");
        bgCircle.setAttribute("fill", "rgba(0, 0, 0, 0.8)");
        bgCircle.setAttribute("stroke", "#fff");
        bgCircle.setAttribute("stroke-width", "2");
        bgCircle.style.pointerEvents = "none";
        bgCircle.classList.add("army-count-bg", "persistent-army-count");

        // Create text element with enhanced styling
        const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textElement.setAttribute("id", `${territoryId}-army-count`);
        textElement.setAttribute("x", centerX);
        textElement.setAttribute("y", centerY);
        textElement.setAttribute("text-anchor", "middle");
        textElement.setAttribute("dominant-baseline", "middle");
        textElement.setAttribute("fill", "#fff");
        textElement.setAttribute("font-size", "13");
        textElement.setAttribute("font-weight", "bold");
        textElement.setAttribute("font-family", "Arial, sans-serif");
        textElement.style.pointerEvents = "none";
        textElement.classList.add("army-count-text", "persistent-army-count");
        textElement.textContent = this.formatArmyCount(armyCount);

        // Add elements to the same container as territories
        svgContainer.appendChild(bgCircle);
        svgContainer.appendChild(textElement);
        
        // Store references
        this.armyCountElements.set(territoryId, {
            background: bgCircle,
            text: textElement,
            lastUpdate: Date.now(),
            container: svgContainer
        });

        console.log(`✅ Army count created for ${territoryId}: ${armyCount} armies in container: ${svgContainer.tagName}#${svgContainer.id || 'unnamed'}`);
    }

    /**
     * Update army count for specific territory
     * Real-time updates with change detection
     */
    updateArmyCount(territoryId, forceUpdate = false) {
        const elements = this.armyCountElements.get(territoryId);
        if (!elements) {
            // Create if doesn't exist
            this.createPersistentArmyCount(territoryId);
            return;
        }

        const territory = this.gameState.territories[territoryId];
        if (!territory) return;

        const currentArmies = territory.armies || 1;
        const currentText = elements.text.textContent;
        const newText = this.formatArmyCount(currentArmies);

        // Only update if changed or forced
        if (currentText !== newText || forceUpdate) {
            elements.text.textContent = newText;
            elements.lastUpdate = Date.now();

            // Add visual feedback for changes
            this.animateArmyCountChange(territoryId, currentArmies);
            
            console.log(`🔄 Army count updated: ${territoryId} = ${currentArmies}`);
        }
    }

    /**
     * Format army count with K notation for large numbers
     */
    formatArmyCount(count) {
        if (count >= 1000) {
            return `${Math.floor(count / 1000)}K`;
        }
        return count.toString();
    }

    /**
     * Animate army count changes for visual feedback
     */
    animateArmyCountChange(territoryId, newCount) {
        const elements = this.armyCountElements.get(territoryId);
        if (!elements) return;

        // Pulse animation for changes
        elements.background.style.animation = "army-count-pulse 0.6s ease-out";
        elements.text.style.animation = "army-count-pulse 0.6s ease-out";

        // Remove animation after completion
        setTimeout(() => {
            elements.background.style.animation = "";
            elements.text.style.animation = "";
        }, 600);
    }

    /**
     * Start real-time updates
     * Monitors game state changes and updates army counts automatically
     */
    startRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            this.updateAllArmyCounts();
        }, 1000); // Update every second

        console.log('⏰ Real-time army count updates started');
    }

    /**
     * Update all army counts
     * Called periodically and after major game events
     */
    updateAllArmyCounts() {
        if (!this.isInitialized || !this.gameState) return;

        Object.keys(this.gameState.territories).forEach(territoryId => {
            this.updateArmyCount(territoryId);
        });
    }

    /**
     * Remove army count display for territory
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
     * Refresh all army counts (recreate all displays)
     */
    refreshAll() {
        console.log('🔄 Refreshing all army count displays...');
        
        // Clear existing
        this.armyCountElements.forEach((elements, territoryId) => {
            this.removeArmyCount(territoryId);
        });

        // Recreate all
        this.initializeAllArmyCounts();
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏹️ Real-time army count updates stopped');
        }
    }

    /**
     * Update army count positioning when map transforms change
     * Call this method when zoom or pan operations occur
     */
    updatePositionsAfterTransform() {
        this.armyCountElements.forEach((elements, territoryId) => {
            const territoryElement = document.getElementById(territoryId);
            if (territoryElement) {
                // Recalculate position based on current territory bounds
                const bbox = territoryElement.getBBox();
                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;
                
                // Update positions
                elements.background.setAttribute("cx", centerX);
                elements.background.setAttribute("cy", centerY);
                elements.text.setAttribute("x", centerX);
                elements.text.setAttribute("y", centerY);
            }
        });
    }

    /**
     * Get army count element for territory
     */
    getArmyCountElement(territoryId) {
        return document.getElementById(`${territoryId}-army-count`);
    }

    /**
     * Hook into game events for immediate updates
     */
    hookIntoGameEvents() {
        // Hook into reinforcement events
        window.addEventListener('armiesDeployed', (event) => {
            if (event.detail && event.detail.territoryId) {
                this.updateArmyCount(event.detail.territoryId, true);
            }
        });

        // Hook into combat events
        window.addEventListener('battleResolved', () => {
            this.updateAllArmyCounts();
        });

        // Hook into fortification events
        window.addEventListener('fortificationComplete', () => {
            this.updateAllArmyCounts();
        });

        // Hook into real-time army count changes
        window.addEventListener('armyCountChanged', (event) => {
            if (event.detail && event.detail.territoryId) {
                this.updateArmyCount(event.detail.territoryId, true);
            }
        });

        // Hook into territory conquest events
        window.addEventListener('territoryConquered', (event) => {
            if (event.detail && event.detail.territoryId) {
                this.updateArmyCount(event.detail.territoryId, true);
                // Also update transparency for all territories since max armies may have changed
                this.updateAllArmyCounts();
            }
        });

        console.log('🔗 Army count manager hooked into game events');
    }

    /**
     * Force update all army counts immediately
     * Useful after major game state changes
     */
    forceUpdateAll() {
        if (!this.isInitialized) return;
        
        Object.keys(this.gameState.territories).forEach(territoryId => {
            this.updateArmyCount(territoryId, true);
        });
        
        console.log('🔄 Force updated all army counts');
    }

    /**
     * Get statistics about army count displays
     */
    getStats() {
        return {
            totalTerritories: Object.keys(this.gameState.territories || {}).length,
            displayedCounts: this.armyCountElements.size,
            isInitialized: this.isInitialized,
            isRealTimeActive: !!this.updateInterval
        };
    }

    /**
     * Update army count positioning when map transforms change
     * Call this method when zoom or pan operations occur
     */
    updatePositionsAfterTransform() {
        this.armyCountElements.forEach((elements, territoryId) => {
            const territoryElement = document.getElementById(territoryId);
            if (territoryElement) {
                // Recalculate position based on current territory bounds
                const bbox = territoryElement.getBBox();
                const centerX = bbox.x + bbox.width / 2;
                const centerY = bbox.y + bbox.height / 2;
                
                // Update positions
                elements.background.setAttribute("cx", centerX);
                elements.background.setAttribute("cy", centerY);
                elements.text.setAttribute("x", centerX);
                elements.text.setAttribute("y", centerY);
            }
        });
    }

    /**
     * Get detailed positioning information for debugging
     */
    getPositioningDebugInfo(territoryId) {
        const elements = this.armyCountElements.get(territoryId);
        const territoryElement = document.getElementById(territoryId);
        
        if (!elements || !territoryElement) {
            return null;
        }
        
        const bbox = territoryElement.getBBox();
        const bgRect = elements.background.getBoundingClientRect();
        const textRect = elements.text.getBoundingClientRect();
        
        return {
            territoryId,
            territoryBBox: bbox,
            armyCountContainer: elements.container.tagName + '#' + (elements.container.id || 'unnamed'),
            backgroundPosition: {
                cx: elements.background.getAttribute('cx'),
                cy: elements.background.getAttribute('cy'),
                clientRect: bgRect
            },
            textPosition: {
                x: elements.text.getAttribute('x'),
                y: elements.text.getAttribute('y'),
                clientRect: textRect
            },
            inSameContainer: territoryElement.parentNode === elements.container
        };
    }

    /**
     * Get detailed positioning information for debugging
     */
    getPositioningDebugInfo(territoryId) {
        const elements = this.armyCountElements.get(territoryId);
        const territoryElement = document.getElementById(territoryId);
        
        if (!elements || !territoryElement) {
            return null;
        }
        
        const bbox = territoryElement.getBBox();
        const bgRect = elements.background.getBoundingClientRect();
        const textRect = elements.text.getBoundingClientRect();
        
        return {
            territoryId,
            territoryBBox: bbox,
            armyCountContainer: elements.container.tagName + '#' + (elements.container.id || 'unnamed'),
            backgroundPosition: {
                cx: elements.background.getAttribute('cx'),
                cy: elements.background.getAttribute('cy'),
                clientRect: bgRect
            },
            textPosition: {
                x: elements.text.getAttribute('x'),
                y: elements.text.getAttribute('y'),
                clientRect: textRect
            },
            inSameContainer: territoryElement.parentNode === elements.container
        };
    }

    /**
     * Debug method to verify army count positioning
     * Call from browser console: window.riskUI.armyCountManager.debugPositioning()
     */
    debugPositioning() {
        console.log('🔍 Army Count Positioning Debug:');
        
        this.armyCountElements.forEach((elements, territoryId) => {
            const debugInfo = this.getPositioningDebugInfo(territoryId);
            if (debugInfo) {
                console.log(`📍 ${territoryId}:`, {
                    container: debugInfo.armyCountContainer,
                    territoryBounds: debugInfo.territoryBBox,
                    armyCountPosition: debugInfo.backgroundPosition,
                    inSameContainer: debugInfo.inSameContainer
                });
            }
        });
        
        // Check for common issues
        const svgElement = document.querySelector('#risk-map svg');
        const territoriesGroup = document.querySelector('#territories, .territories, g[id*="territory"]');
        
        console.log('🗺️ Map Structure:', {
            svgElement: svgElement ? 'Found' : 'Not found',
            territoriesGroup: territoriesGroup ? `Found: ${territoriesGroup.tagName}#${territoriesGroup.id}` : 'Not found',
            totalArmyCounts: this.armyCountElements.size,
            viewBox: svgElement ? svgElement.getAttribute('viewBox') : 'N/A'
        });
    }

    /**
     * Force update all positions (useful after map transforms)
     */
    forceUpdateAllPositions() {
        console.log('🔄 Force updating all army count positions...');
        this.updatePositionsAfterTransform();
        console.log('✅ Position update complete');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArmyCountManager;
}