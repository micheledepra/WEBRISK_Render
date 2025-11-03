/**
 * MapCalibration.js
 * 
 * Provides development tools for aligning the background world map image 
 * with SVG territory paths. Includes calibration points, offset adjustment,
 * and opacity controls for precise positioning.
 */

class MapCalibration {
    constructor() {
        this.calibrationData = {
            offsetX: 4,
            offsetY: -24,
            opacity: 0.85,
            scale: 0.8,
            bgScale: 0.8,
            // Separate controls for SVG territories
            territoryOffsetX: 0,
            territoryOffsetY: 0,
            territoryScale: 1.0,
            vignetteCenterX: 50,
            vignetteCenterY: 50,
            vignetteScale: 70
        };
        
        this.isDevelopmentMode = false;
        this.calibrationPoints = [];
        this.loadCalibration();
    }
    
    /**
     * Load calibration settings from localStorage
     */
    loadCalibration() {
        const saved = localStorage.getItem('mapCalibration');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all properties exist
                this.calibrationData = {
                    offsetX: parsed.offsetX ?? 4,
                    offsetY: parsed.offsetY ?? -24,
                    opacity: parsed.opacity ?? 0.85,
                    scale: parsed.scale ?? 0.8,
                    bgScale: parsed.bgScale ?? 0.8,
                    territoryOffsetX: parsed.territoryOffsetX ?? 0,
                    territoryOffsetY: parsed.territoryOffsetY ?? 0,
                    territoryScale: parsed.territoryScale ?? 1.0,
                    vignetteCenterX: parsed.vignetteCenterX ?? 50,
                    vignetteCenterY: parsed.vignetteCenterY ?? 50,
                    vignetteScale: parsed.vignetteScale ?? 70
                };
                console.log('Loaded map calibration:', this.calibrationData);
            } catch (e) {
                console.error('Failed to load calibration data:', e);
            }
        }
    }
    
    /**
     * Save calibration settings to localStorage
     */
    saveCalibration() {
        localStorage.setItem('mapCalibration', JSON.stringify(this.calibrationData));
        console.log('Saved map calibration:', this.calibrationData);
    }
    
    /**
     * Apply current calibration to the unified map layer
     */
    applyCalibration() {
        const unifiedLayer = document.getElementById('unified-map-layer');
        const mapGroup = document.querySelector('.map-group');
        const bgRect = document.querySelector('rect[fill="url(#world-map-bg)"]');
        const vignetteGradient = document.getElementById('water-vignette');
        
        if (!unifiedLayer) {
            console.warn('Unified map layer not found');
            return;
        }
        
        // Get values with safe defaults
        const offsetX = this.calibrationData.offsetX ?? 4;
        const offsetY = this.calibrationData.offsetY ?? -24;
        const scale = this.calibrationData.scale ?? 0.8;
        const opacity = this.calibrationData.opacity ?? 0.85;
        const territoryOffsetX = this.calibrationData.territoryOffsetX ?? 0;
        const territoryOffsetY = this.calibrationData.territoryOffsetY ?? 0;
        const territoryScale = this.calibrationData.territoryScale ?? 1.0;
        
        // Apply base transform to unified layer (backgrounds + territories together)
        const baseTransform = `translate(${offsetX}, ${offsetY}) scale(${scale})`;
        unifiedLayer.setAttribute('transform', baseTransform);
        
        // Apply additional territory-specific transform for fine-tuning alignment
        if (mapGroup) {
            const territoryTransform = `translate(${territoryOffsetX}, ${territoryOffsetY}) scale(${territoryScale})`;
            mapGroup.setAttribute('transform', territoryTransform);
        }
        
        // Update world map opacity only
        if (bgRect) {
            bgRect.setAttribute('opacity', opacity);
        }
        
        // Update vignette gradient if present
        if (vignetteGradient) {
            const vignetteCenterX = this.calibrationData.vignetteCenterX ?? 50;
            const vignetteCenterY = this.calibrationData.vignetteCenterY ?? 50;
            const vignetteScale = this.calibrationData.vignetteScale ?? 70;
            
            vignetteGradient.setAttribute('cx', `${vignetteCenterX}%`);
            vignetteGradient.setAttribute('cy', `${vignetteCenterY}%`);
            vignetteGradient.setAttribute('r', `${vignetteScale}%`);
        }
        
        console.log('Applied calibration - Unified layer:', {
            base: baseTransform,
            territory: territoryOffsetX !== 0 || territoryOffsetY !== 0 || territoryScale !== 1.0 ? `translate(${territoryOffsetX}, ${territoryOffsetY}) scale(${territoryScale})` : 'default'
        });
    }
    
    /**
     * Solidify the alignment by merging territory adjustments into base transform
     */
    solidifyAlignment() {
        // Merge territory offsets into base offsets
        this.calibrationData.offsetX += this.calibrationData.territoryOffsetX * this.calibrationData.scale;
        this.calibrationData.offsetY += this.calibrationData.territoryOffsetY * this.calibrationData.scale;
        
        // Merge territory scale into base scale
        this.calibrationData.scale *= this.calibrationData.territoryScale;
        
        // Reset territory-specific adjustments
        this.calibrationData.territoryOffsetX = 0;
        this.calibrationData.territoryOffsetY = 0;
        this.calibrationData.territoryScale = 1.0;
        
        // Apply the solidified transform
        this.applyCalibration();
        this.saveCalibration();
        
        this.showNotification('Alignment solidified! Territory adjustments merged into base layer.');
        console.log('✅ Alignment solidified:', this.calibrationData);
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
     * Create calibration control UI
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
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 250px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        ui.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; border-bottom: 1px solid #555; padding-bottom: 5px;">
                🎯 Map Calibration
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 3px;">X Offset: <span id="cal-x-value">${this.calibrationData.offsetX}</span></label>
                <input type="range" id="cal-x" min="-500" max="500" value="${this.calibrationData.offsetX}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 3px;">Y Offset: <span id="cal-y-value">${this.calibrationData.offsetY}</span></label>
                <input type="range" id="cal-y" min="-500" max="500" value="${this.calibrationData.offsetY}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 3px;">Map Opacity: <span id="cal-opacity-value">${this.calibrationData.opacity}</span></label>
                <input type="range" id="cal-opacity" min="0" max="1" step="0.05" value="${this.calibrationData.opacity}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 3px;">Map Scale: <span id="cal-scale-value">${this.calibrationData.scale}</span></label>
                <input type="range" id="cal-scale" min="0.5" max="2.0" step="0.05" value="${this.calibrationData.scale}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px; padding-top: 10px; border-top: 1px dashed #555;">
                <label style="display: block; margin-bottom: 3px; color: #4dd0e1;">🌊 Background Scale: <span id="cal-bg-scale-value">${this.calibrationData.bgScale}</span></label>
                <input type="range" id="cal-bg-scale" min="0.5" max="3.0" step="0.1" value="${this.calibrationData.bgScale}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px; padding-top: 10px; border-top: 2px solid #ff6b6b;">
                <div style="margin-bottom: 8px; font-weight: bold; color: #ff6b6b;">🎨 Territory Fine-Tuning</div>
                
                <label style="display: block; margin-bottom: 3px;">Territory X: <span id="cal-territory-x-value">${this.calibrationData.territoryOffsetX}</span></label>
                <input type="range" id="cal-territory-x" min="-100" max="100" step="0.5" value="${this.calibrationData.territoryOffsetX}" 
                       style="width: 100%; margin-bottom: 8px;">
                
                <label style="display: block; margin-bottom: 3px;">Territory Y: <span id="cal-territory-y-value">${this.calibrationData.territoryOffsetY}</span></label>
                <input type="range" id="cal-territory-y" min="-100" max="100" step="0.5" value="${this.calibrationData.territoryOffsetY}" 
                       style="width: 100%; margin-bottom: 8px;">
                
                <label style="display: block; margin-bottom: 3px;">Territory Scale: <span id="cal-territory-scale-value">${this.calibrationData.territoryScale}</span></label>
                <input type="range" id="cal-territory-scale" min="0.8" max="1.2" step="0.01" value="${this.calibrationData.territoryScale}" 
                       style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 10px; padding-top: 10px; border-top: 1px solid #555;">
                <div style="margin-bottom: 8px; font-weight: bold; color: #ff9800;">✨ Dynamic Vignette</div>
                
                <label style="display: block; margin-bottom: 3px;">Center X: <span id="cal-vignette-x-value">${this.calibrationData.vignetteCenterX}%</span></label>
                <input type="range" id="cal-vignette-x" min="0" max="100" step="1" value="${this.calibrationData.vignetteCenterX}" 
                       style="width: 100%; margin-bottom: 8px;">
                
                <label style="display: block; margin-bottom: 3px;">Center Y: <span id="cal-vignette-y-value">${this.calibrationData.vignetteCenterY}%</span></label>
                <input type="range" id="cal-vignette-y" min="0" max="100" step="1" value="${this.calibrationData.vignetteCenterY}" 
                       style="width: 100%; margin-bottom: 8px;">
                
                <label style="display: block; margin-bottom: 3px;">Radius: <span id="cal-vignette-scale-value">${this.calibrationData.vignetteScale}%</span></label>
                <input type="range" id="cal-vignette-scale" min="30" max="150" step="5" value="${this.calibrationData.vignetteScale}" 
                       style="width: 100%;">
            </div>
            
            <div style="display: flex; gap: 5px; margin-top: 15px;">
                <button id="cal-solidify" style="flex: 1; padding: 8px; border: none; background: #9C27B0; color: white; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    🔒 Solidify
                </button>
            </div>
            
            <div style="display: flex; gap: 5px; margin-top: 5px;">
                <button id="cal-save" style="flex: 1; padding: 8px; border: none; background: #4CAF50; color: white; border-radius: 4px; cursor: pointer;">
                    💾 Save
                </button>
                <button id="cal-reset" style="flex: 1; padding: 8px; border: none; background: #f44336; color: white; border-radius: 4px; cursor: pointer;">
                    🔄 Reset
                </button>
            </div>
            
            <div style="margin-top: 10px; font-size: 10px; color: #aaa; border-top: 1px solid #555; padding-top: 5px;">
                <div>Press 'C' to toggle calibration mode</div>
                <div>Adjust territory position, then <b>Solidify</b></div>
            </div>
        `;
        
        document.body.appendChild(ui);
        
        // Add event listeners
        this.attachCalibrationListeners();
    }
    
    /**
     * Attach event listeners to calibration controls
     */
    attachCalibrationListeners() {
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
        const solidifyBtn = document.getElementById('cal-solidify');
        const saveBtn = document.getElementById('cal-save');
        const resetBtn = document.getElementById('cal-reset');
        
        // X offset
        xSlider?.addEventListener('input', (e) => {
            this.calibrationData.offsetX = parseFloat(e.target.value);
            document.getElementById('cal-x-value').textContent = this.calibrationData.offsetX;
            this.applyCalibration();
        });
        
        // Y offset
        ySlider?.addEventListener('input', (e) => {
            this.calibrationData.offsetY = parseFloat(e.target.value);
            document.getElementById('cal-y-value').textContent = this.calibrationData.offsetY;
            this.applyCalibration();
        });
        
        // Opacity
        opacitySlider?.addEventListener('input', (e) => {
            this.calibrationData.opacity = parseFloat(e.target.value);
            document.getElementById('cal-opacity-value').textContent = this.calibrationData.opacity.toFixed(2);
            this.applyCalibration();
        });
        
        // Scale
        scaleSlider?.addEventListener('input', (e) => {
            this.calibrationData.scale = parseFloat(e.target.value);
            document.getElementById('cal-scale-value').textContent = this.calibrationData.scale.toFixed(2);
            this.applyCalibration();
        });
        
        // Background Scale
        bgScaleSlider?.addEventListener('input', (e) => {
            this.calibrationData.bgScale = parseFloat(e.target.value);
            document.getElementById('cal-bg-scale-value').textContent = this.calibrationData.bgScale.toFixed(2);
            this.applyCalibration();
        });
        
        // Territory X offset
        territoryXSlider?.addEventListener('input', (e) => {
            this.calibrationData.territoryOffsetX = parseFloat(e.target.value);
            document.getElementById('cal-territory-x-value').textContent = this.calibrationData.territoryOffsetX.toFixed(1);
            this.applyCalibration();
        });
        
        // Territory Y offset
        territoryYSlider?.addEventListener('input', (e) => {
            this.calibrationData.territoryOffsetY = parseFloat(e.target.value);
            document.getElementById('cal-territory-y-value').textContent = this.calibrationData.territoryOffsetY.toFixed(1);
            this.applyCalibration();
        });
        
        // Territory Scale
        territoryScaleSlider?.addEventListener('input', (e) => {
            this.calibrationData.territoryScale = parseFloat(e.target.value);
            document.getElementById('cal-territory-scale-value').textContent = this.calibrationData.territoryScale.toFixed(2);
            this.applyCalibration();
        });
        
        // Vignette Center X
        vignetteXSlider?.addEventListener('input', (e) => {
            this.calibrationData.vignetteCenterX = parseFloat(e.target.value);
            document.getElementById('cal-vignette-x-value').textContent = this.calibrationData.vignetteCenterX + '%';
            this.applyCalibration();
        });
        
        // Vignette Center Y
        vignetteYSlider?.addEventListener('input', (e) => {
            this.calibrationData.vignetteCenterY = parseFloat(e.target.value);
            document.getElementById('cal-vignette-y-value').textContent = this.calibrationData.vignetteCenterY + '%';
            this.applyCalibration();
        });
        
        // Vignette Scale (Radius)
        vignetteScaleSlider?.addEventListener('input', (e) => {
            this.calibrationData.vignetteScale = parseFloat(e.target.value);
            document.getElementById('cal-vignette-scale-value').textContent = this.calibrationData.vignetteScale + '%';
            this.applyCalibration();
        });
        
        // Solidify button
        solidifyBtn?.addEventListener('click', () => {
            this.solidifyAlignment();
            this.showNotification('Territory alignment solidified!');
        });
        
        // Save button
        saveBtn?.addEventListener('click', () => {
            this.saveCalibration();
            this.showNotification('Calibration saved!');
        });
        
        // Reset button
        resetBtn?.addEventListener('click', () => {
            this.calibrationData = {
                offsetX: 4,
                offsetY: -24,
                opacity: 0.85,
                scale: 0.8,
                bgScale: 0.8,
                territoryOffsetX: 0,
                territoryOffsetY: 0,
                territoryScale: 1.0,
                vignetteCenterX: 50,
                vignetteCenterY: 50,
                vignetteScale: 70
            };
            this.applyCalibration();
            this.updateUIValues();
            this.showNotification('Calibration reset to defaults!');
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
        this.applyCalibration();
        this.setupKeyboardShortcut();
        console.log('MapCalibration initialized. Press "C" to toggle calibration mode.');
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
