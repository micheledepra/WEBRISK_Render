/**
 * MapCalibration.js - Enhanced Multi-Layer Calibration System
 * 
 * Provides independent controls for three distinct layers:
 * 1. Water Texture Background (summerWaterTexture.png)
 * 2. World Map (preview.png)
 * 3. SVG Territories
 * Plus unified controls after solidification.
 */

class MapCalibration {
    constructor() {
        this.isDevelopmentMode = false;
        this.calibrationPoints = [];
        
        // Load calibration (from preset or localStorage)
        this.loadCalibration();
    }
    
    /**
     * Load calibration from localStorage or device preset
     */
    loadCalibration() {
        const savedData = localStorage.getItem('mapCalibration');
        
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                
                // Check if user has customized the calibration
                if (parsed.userCustomized === true) {
                    // User has manually calibrated - use their settings
                    this.calibrationData = parsed;
                    console.log('🎨 Loaded user custom calibration');
                    return;
                }
                
                // Check if saved preset matches current device
                if (window.MapCalibrationPresets) {
                    const savedCategory = parsed.deviceCategory;
                    const currentCategory = window.MapCalibrationPresets.detectDeviceCategory();
                    
                    if (savedCategory === currentCategory) {
                        // Saved preset matches current device - use it
                        this.calibrationData = parsed;
                        console.log(`📱 Loaded saved ${currentCategory} preset`);
                        return;
                    }
                    
                    // Device category changed - load new preset
                    console.log(`🔄 Device changed from ${savedCategory} to ${currentCategory} - loading new preset`);
                }
            } catch (e) {
                console.error('Error parsing saved calibration:', e);
            }
        }
        
        // No saved data or device changed - load device-specific preset
        this.loadDevicePreset();
    }
    
    /**
     * Load calibration preset for current device
     */
    loadDevicePreset() {
        if (!window.MapCalibrationPresets) {
            console.error('❌ MapCalibrationPresets not loaded - using defaults');
            this.loadDefaultCalibration();
            return;
        }
        
        const deviceCategory = window.MapCalibrationPresets.detectDeviceCategory();
        const preset = window.MapCalibrationPresets.getCurrentPreset();
        
        this.calibrationData = {
            ...preset,
            userCustomized: false,
            deviceCategory: deviceCategory
        };
        
        console.log(`📱 Loaded ${deviceCategory} calibration preset:`, this.calibrationData);
        
        // Save to localStorage so it persists
        this.saveCalibration();
    }
    
    /**
     * Fallback default calibration (neutral positioning)
     */
    loadDefaultCalibration() {
        this.calibrationData = {
            waterLayer: { offsetX: 0, offsetY: 0, scale: 1.0, opacity: 0.85 },
            mapLayer: { offsetX: 0, offsetY: 0, scale: 1.0, opacity: 0.85 },
            territoryLayer: { offsetX: 0, offsetY: 0, scale: 1.0, opacity: 1.0 },
            solidified: true,
            unifiedOffset: { offsetX: 0, offsetY: 0, scale: 1.0 },
            vignetteCenterX: 50,
            vignetteCenterY: 50,
            vignetteScale: 70,
            userCustomized: false,
            deviceCategory: 'desktop'
        };
    }
    
    /**
     * Save calibration settings to localStorage
     */
    saveCalibration() {
        localStorage.setItem('mapCalibration', JSON.stringify(this.calibrationData));
        const status = this.calibrationData.userCustomized ? 'Custom' : 'Preset';
        console.log(`💾 Calibration saved (${status}, ${this.calibrationData.deviceCategory})`);
    }
    
    /**
     * Mark calibration as user-customized when manually adjusted
     */
    markAsCustomized() {
        if (!this.calibrationData.userCustomized) {
            this.calibrationData.userCustomized = true;
            console.log('🎨 Calibration marked as user-customized');
        }
    }
    
    /**
     * Reset to device preset calibration
     */
    resetToDevicePreset() {
        console.log('🔄 Resetting to device preset calibration...');
        localStorage.removeItem('mapCalibration');
        this.loadDevicePreset();
        
        // Re-apply and update UI
        this.applyCalibration();
        if (this.isDevelopmentMode) {
            this.disableDevelopmentMode();
            this.enableDevelopmentMode();
        }
    }
    
    /**
     * Apply current calibration to all three layers
     * 
     * THREE-LAYER SYSTEM:
     * 1. Water Layer Container (water-layer-container) - Contains water texture + vignette
     * 2. Map Layer Container (map-layer-container) - Contains world map background + overlay
     * 3. Territory Layer Container (territory-layer-container) - Contains SVG territories (fixed/centered inside)
     * 
     * Transforms are applied to the CONTAINERS, not the content inside.
     * This keeps territories centered while allowing independent layer movement/scaling.
     */
    applyCalibration() {
        // Apply to each layer independently
        this.applyWaterLayer();
        this.applyMapLayer();
        this.applyTerritoryLayer();
        
        // Apply vignette
        this.applyVignette();
        
        // Apply unified offset if solidified
        if (this.calibrationData.solidified) {
            this.applyUnifiedOffset();
        }
        
        console.log('Applied multi-layer calibration:', {
            water: this.calibrationData.waterLayer,
            map: this.calibrationData.mapLayer,
            territories: this.calibrationData.territoryLayer,
            solidified: this.calibrationData.solidified
        });
    }
    
    /**
     * Apply water texture layer settings
     */
    applyWaterLayer() {
        const waterContainer = document.getElementById('water-layer-container');
        if (!waterContainer) {
            console.warn('⚠️ Water layer container not found');
            return;
        }
        
        const { offsetX, offsetY, scale, opacity } = this.calibrationData.waterLayer;
        
        // Apply transform to the container group
        const transform = `translate(${offsetX}, ${offsetY}) scale(${scale})`;
        waterContainer.setAttribute('transform', transform);
        
        // Apply opacity to all rects inside the container
        const rects = waterContainer.querySelectorAll('rect');
        rects.forEach(rect => {
            const currentOpacity = rect.getAttribute('opacity');
            if (currentOpacity) {
                rect.setAttribute('opacity', opacity);
            }
        });
        
        console.log(`✅ Water layer transform applied: ${transform}`);
    }
    
    /**
     * Apply world map layer settings
     */
    applyMapLayer() {
        const mapContainer = document.getElementById('map-layer-container');
        if (!mapContainer) {
            console.warn('⚠️ Map layer container not found');
            return;
        }
        
        const { offsetX, offsetY, scale, opacity } = this.calibrationData.mapLayer;
        
        // Apply transform to the container group
        const transform = `translate(${offsetX}, ${offsetY}) scale(${scale})`;
        mapContainer.setAttribute('transform', transform);
        
        // Apply opacity to all rects inside the container
        const rects = mapContainer.querySelectorAll('rect');
        rects.forEach(rect => {
            const currentOpacity = rect.getAttribute('opacity');
            if (currentOpacity) {
                rect.setAttribute('opacity', opacity);
            }
        });
        
        console.log(`✅ Map layer transform applied: ${transform}`);
    }
    
    /**
     * Apply territory layer settings
     */
    applyTerritoryLayer() {
        const territoryContainer = document.getElementById('territory-layer-container');
        if (!territoryContainer) {
            console.warn('⚠️ Territory layer container not found - SVG territories cannot be positioned');
            return;
        }
        
        const { offsetX, offsetY, scale, opacity } = this.calibrationData.territoryLayer;
        
        // Apply transform to the container group (territories stay centered inside)
        const transform = `translate(${offsetX}, ${offsetY}) scale(${scale})`;
        territoryContainer.setAttribute('transform', transform);
        
        // Apply opacity to the inner content group if needed
        const territoryContent = document.getElementById('territory-content');
        if (territoryContent && opacity !== undefined) {
            territoryContent.setAttribute('opacity', opacity);
        }
        
        console.log(`✅ Territory layer transform applied: ${transform}`);
    }
    
    /**
     * Apply vignette settings
     */
    applyVignette() {
        const vignetteGradient = document.getElementById('water-vignette');
        if (!vignetteGradient) return;
        
        vignetteGradient.setAttribute('cx', `${this.calibrationData.vignetteCenterX}%`);
        vignetteGradient.setAttribute('cy', `${this.calibrationData.vignetteCenterY}%`);
        vignetteGradient.setAttribute('r', `${this.calibrationData.vignetteScale}%`);
    }
    
    /**
     * Apply unified offset to all layers (when solidified)
     */
    applyUnifiedOffset() {
        const svg = document.getElementById('risk-map');
        if (!svg) return;
        
        const { offsetX, offsetY, scale } = this.calibrationData.unifiedOffset;
        
        // Adjust viewBox to create pan/zoom effect on all layers
        const newX = -offsetX / scale;
        const newY = -offsetY / scale;
        const newW = 1920 / scale;
        const newH = 1080 / scale;
        
        svg.setAttribute('viewBox', `${newX} ${newY} ${newW} ${newH}`);
    }
    
    /**
     * Toggle solidification - locks all three layers together with unified controls
     */
    solidifyAlignment() {
        this.calibrationData.solidified = !this.calibrationData.solidified;
        
        if (this.calibrationData.solidified) {
            // Reset unified offset when solidifying
            this.calibrationData.unifiedOffset = { offsetX: 0, offsetY: 0, scale: 1.0 };
            console.log('🔒 Layers solidified - unified controls enabled');
            this.showNotification('Layers solidified! Use unified controls to adjust all layers together.');
        } else {
            // Reset SVG viewBox when unsolidifying
            const svg = document.getElementById('risk-map');
            if (svg) svg.setAttribute('viewBox', '0 0 1920 1080');
            console.log('🔓 Layers unsolidified - individual controls active');
            this.showNotification('Layers unsolidified! Adjust each layer independently.');
        }
        
        this.applyCalibration();
        this.saveCalibration();
        
        // Refresh UI to show/hide unified controls
        if (this.isDevelopmentMode) {
            this.disableDevelopmentMode();
            this.enableDevelopmentMode();
        }
    }
    
    /**
     * Enable development mode with calibration controls
     */
    enableDevelopmentMode() {
        this.isDevelopmentMode = true;
        this.createCalibrationUI();
        console.log('Map calibration development mode enabled');
    }
    
    /**
     * Disable development mode and hide controls
     */
    disableDevelopmentMode() {
        this.isDevelopmentMode = false;
        const ui = document.getElementById('calibration-ui');
        if (ui) {
            ui.remove();
        }
        console.log('Map calibration development mode disabled');
    }
    
    /**
     * Create calibration control UI with multi-layer controls
     */
    createCalibrationUI() {
        // Remove existing UI if present
        const existing = document.getElementById('calibration-ui');
        if (existing) {
            existing.remove();
        }
        
        const ui = document.createElement('div');
        ui.id = 'calibration-ui';
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            background: rgba(30, 30, 30, 0.95);
            color: white;
            padding: 20px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            font-size: 13px;
            z-index: 10000;
            width: 380px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        `;
        
        const solidifiedStyle = this.calibrationData.solidified ? 'block' : 'none';
        
        ui.innerHTML = `
            <style>
                #calibration-ui h3 { margin: 0 0 15px 0; font-size: 18px; color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
                #calibration-ui h4 { margin: 15px 0 10px 0; font-size: 14px; display: flex; align-items: center; gap: 8px; }
                #calibration-ui .layer-section { padding: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 15px; border-left: 3px solid; }
                #calibration-ui .water-section { border-left-color: #03A9F4; }
                #calibration-ui .map-section { border-left-color: #FFC107; }
                #calibration-ui .territory-section { border-left-color: #4CAF50; }
                #calibration-ui .unified-section { border-left-color: #9C27B0; }
                #calibration-ui .control-group { margin-bottom: 12px; }
                #calibration-ui .control-group label { display: block; margin-bottom: 5px; font-size: 11px; color: #bbb; text-transform: uppercase; }
                #calibration-ui .slider-row { display: flex; align-items: center; gap: 10px; }
                #calibration-ui input[type="range"] { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.2); cursor: pointer; }
                #calibration-ui .value-display { min-width: 55px; text-align: right; font-weight: 600; font-size: 12px; }
                #calibration-ui .btn-group { display: flex; gap: 8px; margin-top: 15px; }
                #calibration-ui button { flex: 1; padding: 10px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
                #calibration-ui button:hover { transform: translateY(-1px); }
                #calibration-ui .btn-solidify { background: #9C27B0; color: white; }
                #calibration-ui .btn-reset { background: #f44336; color: white; }
                #calibration-ui .btn-save { background: #4CAF50; color: white; }
                #calibration-ui .solidified-badge { display: inline-block; padding: 3px 6px; background: #9C27B0; border-radius: 3px; font-size: 10px; margin-left: 5px; }
            </style>
            
            <h3>🔧 Multi-Layer Calibration</h3>
            
            <!-- Water Texture Layer -->
            <div class="layer-section water-section">
                <h4><span>🌊</span> Water Texture Background</h4>
                
                <div class="control-group">
                    <label>X Offset</label>
                    <div class="slider-row">
                        <input type="range" id="water-offset-x" min="-500" max="500" step="1" value="${this.calibrationData.waterLayer.offsetX}">
                        <span class="value-display" id="water-offset-x-value">${this.calibrationData.waterLayer.offsetX}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Y Offset</label>
                    <div class="slider-row">
                        <input type="range" id="water-offset-y" min="-500" max="500" step="1" value="${this.calibrationData.waterLayer.offsetY}">
                        <span class="value-display" id="water-offset-y-value">${this.calibrationData.waterLayer.offsetY}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Scale</label>
                    <div class="slider-row">
                        <input type="range" id="water-scale" min="0.5" max="2" step="0.01" value="${this.calibrationData.waterLayer.scale}">
                        <span class="value-display" id="water-scale-value">${this.calibrationData.waterLayer.scale.toFixed(2)}x</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Opacity</label>
                    <div class="slider-row">
                        <input type="range" id="water-opacity" min="0" max="1" step="0.01" value="${this.calibrationData.waterLayer.opacity}">
                        <span class="value-display" id="water-opacity-value">${Math.round(this.calibrationData.waterLayer.opacity * 100)}%</span>
                    </div>
                </div>
            </div>
            
            <!-- World Map Layer -->
            <div class="layer-section map-section">
                <h4><span>🗺️</span> World Map (preview.png)</h4>
                
                <div class="control-group">
                    <label>X Offset</label>
                    <div class="slider-row">
                        <input type="range" id="map-offset-x" min="-500" max="500" step="1" value="${this.calibrationData.mapLayer.offsetX}">
                        <span class="value-display" id="map-offset-x-value">${this.calibrationData.mapLayer.offsetX}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Y Offset</label>
                    <div class="slider-row">
                        <input type="range" id="map-offset-y" min="-500" max="500" step="1" value="${this.calibrationData.mapLayer.offsetY}">
                        <span class="value-display" id="map-offset-y-value">${this.calibrationData.mapLayer.offsetY}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Scale</label>
                    <div class="slider-row">
                        <input type="range" id="map-scale" min="0.5" max="2" step="0.01" value="${this.calibrationData.mapLayer.scale}">
                        <span class="value-display" id="map-scale-value">${this.calibrationData.mapLayer.scale.toFixed(2)}x</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Opacity</label>
                    <div class="slider-row">
                        <input type="range" id="map-opacity" min="0" max="1" step="0.01" value="${this.calibrationData.mapLayer.opacity}">
                        <span class="value-display" id="map-opacity-value">${Math.round(this.calibrationData.mapLayer.opacity * 100)}%</span>
                    </div>
                </div>
            </div>
            
            <!-- Territory Layer -->
            <div class="layer-section territory-section">
                <h4><span>🎯</span> SVG Territories</h4>
                
                <div class="control-group">
                    <label>X Offset</label>
                    <div class="slider-row">
                        <input type="range" id="territory-offset-x" min="-500" max="500" step="1" value="${this.calibrationData.territoryLayer.offsetX}">
                        <span class="value-display" id="territory-offset-x-value">${this.calibrationData.territoryLayer.offsetX}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Y Offset</label>
                    <div class="slider-row">
                        <input type="range" id="territory-offset-y" min="-500" max="500" step="1" value="${this.calibrationData.territoryLayer.offsetY}">
                        <span class="value-display" id="territory-offset-y-value">${this.calibrationData.territoryLayer.offsetY}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Scale</label>
                    <div class="slider-row">
                        <input type="range" id="territory-scale" min="0.5" max="2" step="0.01" value="${this.calibrationData.territoryLayer.scale}">
                        <span class="value-display" id="territory-scale-value">${this.calibrationData.territoryLayer.scale.toFixed(2)}x</span>
                    </div>
                </div>
            </div>
            
            <!-- Unified Controls (shown when solidified) -->
            <div class="layer-section unified-section" id="unified-controls" style="display: ${solidifiedStyle};">
                <h4><span>🔒</span> Unified Controls <span class="solidified-badge">Solidified</span></h4>
                
                <div class="control-group">
                    <label>Global X Offset</label>
                    <div class="slider-row">
                        <input type="range" id="unified-offset-x" min="-500" max="500" step="1" value="${this.calibrationData.unifiedOffset.offsetX}">
                        <span class="value-display" id="unified-offset-x-value">${this.calibrationData.unifiedOffset.offsetX}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Global Y Offset</label>
                    <div class="slider-row">
                        <input type="range" id="unified-offset-y" min="-500" max="500" step="1" value="${this.calibrationData.unifiedOffset.offsetY}">
                        <span class="value-display" id="unified-offset-y-value">${this.calibrationData.unifiedOffset.offsetY}px</span>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>Global Scale</label>
                    <div class="slider-row">
                        <input type="range" id="unified-scale" min="0.5" max="2" step="0.01" value="${this.calibrationData.unifiedOffset.scale}">
                        <span class="value-display" id="unified-scale-value">${this.calibrationData.unifiedOffset.scale.toFixed(2)}x</span>
                    </div>
                </div>
                
                <p style="font-size: 11px; color: #999; margin-top: 8px; font-style: italic;">These controls affect all three layers together.</p>
            </div>
            
            <div class="btn-group">
                <button class="btn-solidify" id="solidify-btn">${this.calibrationData.solidified ? '🔓 Unsolidify' : '🔒 Solidify'}</button>
            </div>
            
            <div class="btn-group">
                <button class="btn-reset" id="reset-btn">↺ Reset</button>
                <button class="btn-save" id="save-btn">💾 Save</button>
            </div>
            
            <p style="font-size: 10px; color: #999; margin-top: 10px; border-top: 1px solid #555; padding-top: 8px;">
                Press <b>C</b> to toggle calibration mode
            </p>
        `;
        
        document.body.appendChild(ui);
        
        // Add event listeners
        this.attachCalibrationListeners();
    }
    
    /**
     * Attach event listeners to calibration controls
     */
    attachCalibrationListeners() {
        // Helper function to attach layer listeners
        const attachLayerControls = (prefix, layerKey) => {
            const offsetX = document.getElementById(`${prefix}-offset-x`);
            const offsetY = document.getElementById(`${prefix}-offset-y`);
            const scale = document.getElementById(`${prefix}-scale`);
            const opacity = document.getElementById(`${prefix}-opacity`);
            
            offsetX?.addEventListener('input', (e) => {
                this.calibrationData[layerKey].offsetX = parseFloat(e.target.value);
                document.getElementById(`${prefix}-offset-x-value`).textContent = `${e.target.value}px`;
                this.applyCalibration();
            });
            
            offsetY?.addEventListener('input', (e) => {
                this.calibrationData[layerKey].offsetY = parseFloat(e.target.value);
                document.getElementById(`${prefix}-offset-y-value`).textContent = `${e.target.value}px`;
                this.applyCalibration();
            });
            
            scale?.addEventListener('input', (e) => {
                this.calibrationData[layerKey].scale = parseFloat(e.target.value);
                document.getElementById(`${prefix}-scale-value`).textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
                this.applyCalibration();
            });
            
            opacity?.addEventListener('input', (e) => {
                this.calibrationData[layerKey].opacity = parseFloat(e.target.value);
                document.getElementById(`${prefix}-opacity-value`).textContent = `${Math.round(parseFloat(e.target.value) * 100)}%`;
                this.applyCalibration();
            });
        };
        
        // Water Layer
        attachLayerControls('water', 'waterLayer');
        
        // Map Layer
        attachLayerControls('map', 'mapLayer');
        
        // Territory Layer (no opacity control)
        const terrOffsetX = document.getElementById('territory-offset-x');
        const terrOffsetY = document.getElementById('territory-offset-y');
        const terrScale = document.getElementById('territory-scale');
        
        terrOffsetX?.addEventListener('input', (e) => {
            this.calibrationData.territoryLayer.offsetX = parseFloat(e.target.value);
            document.getElementById('territory-offset-x-value').textContent = `${e.target.value}px`;
            this.applyCalibration();
        });
        
        terrOffsetY?.addEventListener('input', (e) => {
            this.calibrationData.territoryLayer.offsetY = parseFloat(e.target.value);
            document.getElementById('territory-offset-y-value').textContent = `${e.target.value}px`;
            this.applyCalibration();
        });
        
        terrScale?.addEventListener('input', (e) => {
            this.calibrationData.territoryLayer.scale = parseFloat(e.target.value);
            document.getElementById('territory-scale-value').textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
            this.applyCalibration();
        });
        
        // Unified Controls (if solidified)
        if (this.calibrationData.solidified) {
            const unifiedOffsetX = document.getElementById('unified-offset-x');
            const unifiedOffsetY = document.getElementById('unified-offset-y');
            const unifiedScale = document.getElementById('unified-scale');
            
            unifiedOffsetX?.addEventListener('input', (e) => {
                this.calibrationData.unifiedOffset.offsetX = parseFloat(e.target.value);
                document.getElementById('unified-offset-x-value').textContent = `${e.target.value}px`;
                this.applyCalibration();
            });
            
            unifiedOffsetY?.addEventListener('input', (e) => {
                this.calibrationData.unifiedOffset.offsetY = parseFloat(e.target.value);
                document.getElementById('unified-offset-y-value').textContent = `${e.target.value}px`;
                this.applyCalibration();
            });
            
            unifiedScale?.addEventListener('input', (e) => {
                this.calibrationData.unifiedOffset.scale = parseFloat(e.target.value);
                document.getElementById('unified-scale-value').textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
                this.applyCalibration();
            });
        }
        
        // Solidify button
        const solidifyBtn = document.getElementById('solidify-btn');
        solidifyBtn?.addEventListener('click', () => {
            this.solidifyAlignment();
        });
        
        // Save button
        const saveBtn = document.getElementById('save-btn');
        saveBtn?.addEventListener('click', () => {
            this.saveCalibration();
            this.showNotification('✅ Calibration saved!');
        });
        
        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        resetBtn?.addEventListener('click', () => {
            this.calibrationData = {
                waterLayer: { offsetX: 0, offsetY: 0, scale: 1.0, opacity: 0.85 },
                mapLayer: { offsetX: 4, offsetY: -24, scale: 0.8, opacity: 0.85 },
                territoryLayer: { offsetX: 0, offsetY: 0, scale: 1.0, opacity: 1.0 },
                solidified: false,
                unifiedOffset: { offsetX: 0, offsetY: 0, scale: 1.0 },
                vignetteCenterX: 50,
                vignetteCenterY: 50,
                vignetteScale: 70
            };
            this.applyCalibration();
            this.disableDevelopmentMode();
            this.enableDevelopmentMode();
            this.showNotification('↺ Reset to defaults!');
        });
    }
    
    /**
     * Update UI slider values
     */
    updateUIValues() {
        const xSlider = document.getElementById('cal-x');
        const ySlider = document.getElementById('cal-y');
        const opacitySlider = document.getElementById('cal-opacity');
        const scaleSlider = document.getElementById('cal-scale');
        const bgScaleSlider = document.getElementById('cal-bg-scale');
        const territoryXSlider = document.getElementById('cal-territory-x');
        const territoryYSlider = document.getElementById('cal-territory-y');
        const territoryScaleSlider = document.getElementById('cal-territory-scale');
        const vignetteXSlider = document.getElementById('cal-vignette-x');
        const vignetteYSlider = document.getElementById('cal-vignette-y');
        const vignetteScaleSlider = document.getElementById('cal-vignette-scale');
        
        if (xSlider) {
            xSlider.value = this.calibrationData.offsetX;
            document.getElementById('cal-x-value').textContent = this.calibrationData.offsetX;
        }
        if (ySlider) {
            ySlider.value = this.calibrationData.offsetY;
            document.getElementById('cal-y-value').textContent = this.calibrationData.offsetY;
        }
        if (opacitySlider) {
            opacitySlider.value = this.calibrationData.opacity;
            document.getElementById('cal-opacity-value').textContent = this.calibrationData.opacity.toFixed(2);
        }
        if (scaleSlider) {
            scaleSlider.value = this.calibrationData.scale;
            document.getElementById('cal-scale-value').textContent = this.calibrationData.scale.toFixed(2);
        }
        if (bgScaleSlider) {
            bgScaleSlider.value = this.calibrationData.bgScale;
            document.getElementById('cal-bg-scale-value').textContent = this.calibrationData.bgScale.toFixed(2);
        }
        if (territoryXSlider) {
            territoryXSlider.value = this.calibrationData.territoryOffsetX;
            document.getElementById('cal-territory-x-value').textContent = this.calibrationData.territoryOffsetX.toFixed(1);
        }
        if (territoryYSlider) {
            territoryYSlider.value = this.calibrationData.territoryOffsetY;
            document.getElementById('cal-territory-y-value').textContent = this.calibrationData.territoryOffsetY.toFixed(1);
        }
        if (territoryScaleSlider) {
            territoryScaleSlider.value = this.calibrationData.territoryScale;
            document.getElementById('cal-territory-scale-value').textContent = this.calibrationData.territoryScale.toFixed(2);
        }
        if (vignetteXSlider) {
            vignetteXSlider.value = this.calibrationData.vignetteCenterX;
            document.getElementById('cal-vignette-x-value').textContent = this.calibrationData.vignetteCenterX + '%';
        }
        if (vignetteYSlider) {
            vignetteYSlider.value = this.calibrationData.vignetteCenterY;
            document.getElementById('cal-vignette-y-value').textContent = this.calibrationData.vignetteCenterY + '%';
        }
        if (vignetteScaleSlider) {
            vignetteScaleSlider.value = this.calibrationData.vignetteScale;
            document.getElementById('cal-vignette-scale-value').textContent = this.calibrationData.vignetteScale + '%';
        }
    }
    
    /**
     * Show a temporary notification message
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
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    /**
     * Add calibration point for reference
     */
    addCalibrationPoint(x, y, label = '') {
        const point = {
            x,
            y,
            label,
            id: Date.now()
        };
        this.calibrationPoints.push(point);
        this.renderCalibrationPoint(point);
        console.log('Added calibration point:', point);
    }
    
    /**
     * Render a calibration point on the map
     */
    renderCalibrationPoint(point) {
        const svg = document.getElementById('risk-map');
        if (!svg) return;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'calibration-point');
        g.setAttribute('data-id', point.id);
        
        // Crosshair
        const horizontal = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        horizontal.setAttribute('x1', point.x - 10);
        horizontal.setAttribute('y1', point.y);
        horizontal.setAttribute('x2', point.x + 10);
        horizontal.setAttribute('y2', point.y);
        horizontal.setAttribute('stroke', '#ff00ff');
        horizontal.setAttribute('stroke-width', '2');
        
        const vertical = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vertical.setAttribute('x1', point.x);
        vertical.setAttribute('y1', point.y - 10);
        vertical.setAttribute('x2', point.x);
        vertical.setAttribute('y2', point.y + 10);
        vertical.setAttribute('stroke', '#ff00ff');
        vertical.setAttribute('stroke-width', '2');
        
        g.appendChild(horizontal);
        g.appendChild(vertical);
        
        // Label
        if (point.label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', point.x + 15);
            text.setAttribute('y', point.y - 5);
            text.setAttribute('fill', '#ff00ff');
            text.setAttribute('font-size', '12');
            text.textContent = point.label;
            g.appendChild(text);
        }
        
        svg.appendChild(g);
    }
    
    /**
     * Clear all calibration points
     */
    clearCalibrationPoints() {
        this.calibrationPoints = [];
        const points = document.querySelectorAll('.calibration-point');
        points.forEach(p => p.remove());
        console.log('Cleared all calibration points');
    }
    
    /**
     * Toggle calibration mode with keyboard shortcut
     */
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                if (this.isDevelopmentMode) {
                    this.disableDevelopmentMode();
                } else {
                    this.enableDevelopmentMode();
                }
            }
        });
    }
    
    /**
     * Initialize calibration system
     */
    init() {
        // Ensure layers are solidified by default for proper multi-layer zoom
        if (!this.calibrationData.solidified) {
            console.log('🔒 Auto-solidifying layers for unified zoom/pan');
            this.calibrationData.solidified = true;
            this.saveCalibration();
        }
        
        this.applyCalibration();
        this.setupKeyboardShortcut();
        console.log('MapCalibration initialized. Press "C" to toggle calibration mode.');
        console.log(`📊 Layers solidified: ${this.calibrationData.solidified}`);
    }
}

// Create global instance
window.mapCalibration = new MapCalibration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mapCalibration.init();
    });
} else {
    window.mapCalibration.init();
}
