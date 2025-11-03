class RiskMap {
    constructor(riskUI) {
        this.riskUI = riskUI;
        this.svg = document.getElementById('risk-map');
        this.mapGroup = this.svg.querySelector('.map-group');
        this.tooltip = document.querySelector('.tooltip');
        
        this.selectedTerritory = null;
        
        // **ZOOM/PAN STATE - Neutral by default (no initial transform)**
        // These values are only used when user actively zooms/pans
        // Initial layer positioning is controlled by MapCalibration
        this.translateX = 0;
        this.translateY = 0;
        this.scale = 1.0;
        
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.lastX = this.translateX;
        this.lastY = this.translateY;
        this.minScale = 0.001;
        this.maxScale = 5;
        
        // Zoom/Pan mode toggle
        this.zoomPanEnabled = false;

        this.init();
    }

    init() {
        // **CRITICAL: Apply MapCalibration BEFORE setting up viewBox**
        if (window.mapCalibration) {
            window.mapCalibration.applyCalibration();
            console.log('✅ Applied MapCalibration before RiskMap setup');
        } else {
            console.warn('⚠️ MapCalibration not available - using default viewBox');
        }
        
        this.setupViewBox();
        this.createTerritoryPaths();
        this.populateContinentList();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        
        // **LOG DEVICE CATEGORY AND PRESET STATUS**
        const deviceCat = window.MapCalibrationPresets?.detectDeviceCategory() || 'unknown';
        console.log(`🗺️ RiskMap initialized - using ${deviceCat} calibration preset`);
    }

    setupViewBox() {
        // **Check if MapCalibration has already set a viewBox (solidified layers)**
        if (window.mapCalibration?.calibrationData?.solidified) {
            const svg = document.getElementById('risk-map');
            const currentViewBox = svg?.getAttribute('viewBox');
            
            if (currentViewBox && currentViewBox !== '0 0 1920 1080') {
                console.log(`📐 Using MapCalibration viewBox (solidified): ${currentViewBox}`);
                // Don't override - MapCalibration already set it
                return;
            }
        }
        
        // Fallback: Set default viewBox to match MapCalibration system
        const viewBoxWidth = 1920;
        const viewBoxHeight = 1080;
        
        // Set default viewBox - MapCalibration will override if needed
        this.svg.setAttribute('viewBox', `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
        
        console.log('📐 ViewBox initialized to MapCalibration base: 1920x1080');
    }

    createTerritoryPaths() {
        Object.entries(mapData.continents).forEach(([continentId, continent]) => {
            const group = document.getElementById(continentId);
            if (!group) {
                console.error('Continent group not found:', continentId);
                return;
            }

            continent.territories.forEach(territory => {
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute('id', territory);
                path.setAttribute('class', 'territory');
                path.setAttribute('data-name', territory.toUpperCase());
                
                if (territoryPaths && territoryPaths[territory]) {
                    path.setAttribute('d', territoryPaths[territory]);
                } else {
                    console.warn(`No path data for territory: ${territory}`);
                }
                
                // Apply manual position adjustments for specific territories
                if (territory === 'greenland') {
                    path.setAttribute('transform', 'translate(-2, -3)');
                }
                
                group.appendChild(path);
            });
        });
    }

    populateContinentList() {
        const continentList = document.querySelector('.continent-list');
        if (!continentList) {
            console.log('Continent list not found - skipping continent list population');
            return;
        }
        
        Object.entries(mapData.continents).forEach(([id, continent]) => {
            const item = document.createElement('div');
            item.className = 'continent-item';
            item.innerHTML = `
                <span>${continent.name}</span>
                <span class="bonus-value">+${continent.captureBonus}</span>
            `;
            item.addEventListener('click', () => this.highlightContinent(id));
            continentList.appendChild(item);
        });
    }

    setupEventListeners() {
        // Territory interactions
        document.querySelectorAll('.territory').forEach(territory => {
            // Use mouseenter for immediate tooltip display
            territory.addEventListener('mouseenter', (e) => this.handleTerritoryHover(e));
            territory.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
            territory.addEventListener('mouseleave', () => this.hideTooltip());
            territory.addEventListener('click', (e) => this.handleTerritoryClick(e));
        });

        // Map controls
        this.setupMapControls();
    }

    setupMapControls() {
        // Pan/Drag events (only active when zoom/pan mode enabled)
        this.svg.addEventListener('mousedown', (e) => {
            if (this.zoomPanEnabled) this.startDragging(e);
        });
        this.svg.addEventListener('mousemove', (e) => {
            if (this.zoomPanEnabled) this.handleDrag(e);
        });
        this.svg.addEventListener('mouseup', () => {
            if (this.zoomPanEnabled) this.stopDragging();
        });
        this.svg.addEventListener('mouseleave', () => {
            if (this.zoomPanEnabled) this.stopDragging();
        });

        // Mouse wheel zoom (only active when zoom/pan mode enabled)
        this.svg.addEventListener('wheel', (e) => {
            if (!this.zoomPanEnabled) return;
            e.preventDefault();
            const zoomFactor = 1.1;
            const rect = this.svg.getBoundingClientRect();
            const newScale = e.deltaY > 0 
                ? this.scale / zoomFactor  // Zoom out
                : this.scale * zoomFactor; // Zoom in
            
            // Pass the mouse coordinates for centered zooming
            this.zoomAtPoint(e.clientX, e.clientY, newScale);
        });

        // **ADD: Touch event support for mobile**
        this.setupTouchControls();
    }

    setupTouchControls() {
        let lastTouchDistance = 0;
        let lastTouchCenter = { x: 0, y: 0 };
        
        this.svg.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Pinch zoom starting
                e.preventDefault();
                lastTouchDistance = this.getTouchDistance(e.touches);
                lastTouchCenter = this.getTouchCenter(e.touches);
            } else if (e.touches.length === 1) {
                // Single touch pan
                const touch = e.touches[0];
                this.startX = touch.clientX - this.translateX;
                this.startY = touch.clientY - this.translateY;
                this.isDragging = true;
            }
        });
        
        this.svg.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                // Pinch zoom
                e.preventDefault();
                const currentDistance = this.getTouchDistance(e.touches);
                const currentCenter = this.getTouchCenter(e.touches);
                
                // Calculate zoom
                const zoomDelta = currentDistance / lastTouchDistance;
                const newScale = this.scale * zoomDelta;
                
                // Zoom at center point
                this.zoomAtPoint(currentCenter.x, currentCenter.y, newScale);
                
                lastTouchDistance = currentDistance;
                lastTouchCenter = currentCenter;
            } else if (e.touches.length === 1 && this.isDragging) {
                // Pan
                e.preventDefault();
                const touch = e.touches[0];
                this.translateX = touch.clientX - this.startX;
                this.translateY = touch.clientY - this.startY;
                this.updateTransform();
            }
        });
        
        this.svg.addEventListener('touchend', () => {
            this.isDragging = false;
            lastTouchDistance = 0;
        });
        
        console.log('📱 Touch controls initialized for mobile zoom/pan');
    }

    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    handleTerritoryClick(event) {
        const territory = event.target;
        const territoryName = territory.getAttribute('id');
        if (this.riskUI) {
            this.riskUI.handleTerritoryClick(territoryName);
        }
    }

    handleTerritoryHover(event) {
        const territory = event.target;
        const territoryId = territory.getAttribute('id');
        
        // Verify element exists
        if (!territoryId) {
            console.warn('⚠️ No territory ID found');
            return;
        }
        
        console.log('🎯 Hovering over:', territoryId);
        
        // Add popped class immediately for synchronized animation
        territory.classList.add('territory-popped');
        
        // Desaturate neighboring territories
        this.desaturateNeighbors(territoryId);
        
        // Delegate to RiskUI's enhanced tooltip system
        if (this.riskUI && this.riskUI.handleTerritoryHover) {
            this.riskUI.handleTerritoryHover(territoryId, event);
        }
    }

    updateTooltipPosition(event) {
        // Update tooltip position as mouse moves
        if (this.riskUI && this.riskUI.updateTooltipPosition) {
            this.riskUI.updateTooltipPosition(event);
        }
    }



    getTerritoryInfo(territoryId) {
        const territory = this.riskUI.gameState.territories[territoryId];
        const continentName = this.getContinent(territoryId);
        
        return {
            name: territoryId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            continent: continentName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            owner: territory ? territory.owner : null,
            armies: territory ? territory.armies : 0
        };
    }

    desaturateNeighbors(territoryId) {
        console.log('🔍 Desaturating neighbors for:', territoryId);
        
        // Check if mapData exists
        if (typeof mapData === 'undefined') {
            console.error('❌ mapData is not defined!');
            return;
        }
        
        console.log('Available territories:', Object.keys(mapData.territories).slice(0, 5), '... (showing first 5)');
        
        // Get neighbors from mapData
        const territoryData = mapData.territories[territoryId];
        if (!territoryData) {
            console.error('❌ No territory data found for:', territoryId);
            console.log('💡 Try one of:', Object.keys(mapData.territories).slice(0, 3));
            return;
        }
        if (!territoryData.neighbors) {
            console.error('❌ No neighbors array for:', territoryId);
            return;
        }
        
        console.log('✓ Found neighbors:', territoryData.neighbors);
        
        // Desaturate all neighboring territories
        territoryData.neighbors.forEach(neighborId => {
            const neighborElement = document.getElementById(neighborId);
            console.log(`  Neighbor "${neighborId}":`, neighborElement ? '✓ found' : '❌ not found');
            if (neighborElement) {
                neighborElement.classList.add('neighbor-desaturated');
                console.log(`  ✅ Added 'neighbor-desaturated' class to ${neighborId}`);
                console.log(`  Current classes:`, neighborElement.classList.toString());
            }
        });
    }

    restoreNeighborSaturation() {
        const desaturatedTerritories = document.querySelectorAll('.neighbor-desaturated');
        console.log('🔄 Restoring saturation for', desaturatedTerritories.length, 'territories');
        
        // Remove desaturation class from all territories and restore original stroke
        desaturatedTerritories.forEach(territory => {
            const territoryId = territory.getAttribute('id');
            console.log('  Restoring:', territoryId);
            territory.classList.remove('neighbor-desaturated');
            
            // Restore original stroke color from territory data
            this.restoreTerritoryStroke(territoryId);
        });
    }

    /**
     * Restore the original stroke color for a territory based on its owner
     */
    restoreTerritoryStroke(territoryId) {
        const pathElement = document.getElementById(territoryId);
        if (!pathElement) return;
        
        const territoryData = this.riskUI?.gameState?.territories?.[territoryId];
        if (!territoryData || !territoryData.owner) {
            // Neutral territory - use default stroke
            pathElement.style.stroke = '#333';
            return;
        }
        
        // Get owner's color and create darker border
        const colorManager = this.riskUI.colorManager;
        if (colorManager) {
            const playerColor = colorManager.getPlayerColor(territoryData.owner);
            const darkerBorderColor = colorManager.darkenColor(playerColor, 20);
            pathElement.style.stroke = darkerBorderColor;
        }
    }

    getContinent(territoryId) {
        for (const [continentId, continent] of Object.entries(mapData.continents)) {
            if (continent.territories.includes(territoryId)) {
                return continent.name;
            }
        }
        return 'Unknown';
    }

    hideTooltip() {
        // Remove popped class from all territories and restore their stroke
        document.querySelectorAll('.territory-popped').forEach(territory => {
            const territoryId = territory.getAttribute('id');
            territory.classList.remove('territory-popped');
            
            // Restore original stroke color
            if (territoryId) {
                this.restoreTerritoryStroke(territoryId);
            }
        });
        
        // Restore saturation to all neighbors (which also restores their strokes)
        this.restoreNeighborSaturation();
        
        // Delegate to RiskUI to use EnhancedTooltip system
        if (this.riskUI && this.riskUI.handleTerritoryHoverEnd) {
            this.riskUI.handleTerritoryHoverEnd();
        }
    }

    startDragging(event) {
        this.isDragging = true;
        this.startX = event.clientX - this.translateX;
        this.startY = event.clientY - this.translateY;
        this.svg.style.cursor = 'grabbing';
    }

    handleDrag(event) {
        if (!this.isDragging) return;
        
        event.preventDefault();
        const rect = this.svg.getBoundingClientRect();
        const maxOffset = Math.max(rect.width, rect.height);
        const boundary = maxOffset * 0.8;
        
        const newX = event.clientX - this.startX;
        const newY = event.clientY - this.startY;
        
        this.translateX = Math.max(Math.min(newX, boundary), -boundary);
        this.translateY = Math.max(Math.min(newY, boundary), -boundary);
        
        this.updateTransform();
    }

    stopDragging() {
        this.isDragging = false;
        this.lastX = this.translateX;
        this.lastY = this.translateY;
        this.svg.style.cursor = 'grab';
    }

    zoomIn() {
        const newScale = Math.min(this.scale * 1.2, this.maxScale);
        this.scale = newScale;
        this.updateTransform();
    }

    zoomOut() {
        const newScale = this.scale / 1.2;
        this.scale = newScale;
        this.updateTransform();
    }

    zoomAtPoint(clientX, clientY, newScale) {
        // Get current values before zoom
        const oldScale = this.scale;
        
        // Constrain the new scale within bounds
        this.scale = Math.min(Math.max(newScale, this.minScale), this.maxScale);
        
        // Get mouse position relative to SVG
        const rect = this.svg.getBoundingClientRect();
        const mouseX = clientX - rect.left - this.translateX;
        const mouseY = clientY - rect.top - this.translateY;
        
        // Calculate new position to zoom towards mouse
        const scaleDiff = this.scale - oldScale;
        this.translateX -= (mouseX * scaleDiff) / oldScale;
        this.translateY -= (mouseY * scaleDiff) / oldScale;
        
        this.updateTransform();
    }

    resetZoom() {
        // **RESET TO NEUTRAL (NO ZOOM/PAN)**
        // This returns to MapCalibration's default layer positioning
        this.scale = 1.0;
        this.translateX = 0;
        this.translateY = 0;
        
        this.updateTransform();
        console.log('🔄 Zoom reset to neutral - MapCalibration positioning restored');
    }

    resetView() {
        document.querySelectorAll('.continent').forEach(continent => {
            continent.style.opacity = '1';
        });
        
        if (this.selectedTerritory) {
            this.selectedTerritory.classList.remove('selected');
            this.selectedTerritory = null;
        }
        
        // Territory info panel removed - no longer updating it
        
        // **RESET TO NEUTRAL POSITION**
        this.resetZoom();
    }

    updateTransform() {
        // **USE MAPCALIBRATION VIEWBOX SYSTEM FOR SOLIDIFIED LAYERS**
        // When layers are solidified, we need to manipulate the SVG viewBox
        // to zoom/pan all layers (water, map, territories) together
        
        if (window.mapCalibration && window.mapCalibration.calibrationData.solidified) {
            // The MapCalibration system uses viewBox manipulation for unified transforms
            // viewBox format: "minX minY width height"
            // To zoom: decrease width/height (zoom in) or increase (zoom out)
            // To pan: adjust minX/minY
            
            const baseWidth = 1920;  // Base SVG coordinate system width
            const baseHeight = 1080; // Base SVG coordinate system height
            
            // Convert our pixel-based scale to viewBox scale (inverted relationship)
            const viewBoxWidth = baseWidth / this.scale;
            const viewBoxHeight = baseHeight / this.scale;
            
            // Convert pixel-based translation to SVG coordinates
            // The translation affects the viewBox origin (top-left corner)
            const viewBoxX = -this.translateX / this.scale;
            const viewBoxY = -this.translateY / this.scale;
            
            // Update the unified offset in MapCalibration
            window.mapCalibration.calibrationData.unifiedOffset = {
                offsetX: this.translateX,
                offsetY: this.translateY,
                scale: this.scale
            };
            
            // Apply the viewBox directly (this transforms all layers simultaneously)
            this.svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
            
            // Save the calibration
            window.mapCalibration.saveCalibration();
            
            console.log(`🔄 ViewBox updated: (${viewBoxX.toFixed(2)}, ${viewBoxY.toFixed(2)}) ${viewBoxWidth.toFixed(2)}x${viewBoxHeight.toFixed(2)} [scale: ${this.scale.toFixed(3)}]`);
        } else {
            // Fallback: If MapCalibration not available or not solidified,
            // apply basic transform to map group only (legacy behavior)
            console.warn('⚠️ MapCalibration not solidified - using fallback transform');
            if (this.mapGroup) {
                this.mapGroup.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
            }
        }
    }

    highlightContinent(continentId) {
        document.querySelectorAll('.continent').forEach(continent => {
            continent.style.opacity = continent.id === continentId ? '1' : '0.5';
        });
    }
    
    /**
     * Toggle zoom/pan mode on or off
     */
    toggleZoomPanMode() {
        this.zoomPanEnabled = !this.zoomPanEnabled;
        
        // Update cursor style
        if (this.zoomPanEnabled) {
            this.svg.style.cursor = 'grab';
            this.showNotification('🔍 Zoom/Pan Mode: ENABLED\nPress Z to disable');
        } else {
            this.svg.style.cursor = 'default';
            this.showNotification('🔍 Zoom/Pan Mode: DISABLED\nPress Z to enable');
        }
        
        console.log(`Zoom/Pan mode: ${this.zoomPanEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    /**
     * Show a temporary notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            text-align: center;
            white-space: pre-line;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'z' || e.key === 'Z') {
                this.toggleZoomPanMode();
            }
        });
    }
}