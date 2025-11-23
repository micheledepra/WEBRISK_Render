/**
 * UICalibration.js - Sidebar UI Element Position Calibration System
 * 
 * Provides position controls for sidebar UI elements:
 * 1. Turn Counter Panel
 * 2. Phase Progress Panel
 * 3. Players Turn Order
 * 4. Phase Control Panel
 * 5. Controls
 * 
 * Modeled after MapCalibration.js for consistency.
 * Press 'X' key to toggle calibration mode.
 */

class UICalibration {
    constructor() {
        this.isDevelopmentMode = false;
        this.elements = [
            { id: 'turn-counter-panel', name: 'Turn Counter', selector: '#turn-counter-panel' },
            { id: 'phase-progress-panel', name: 'Phase Progress', selector: '#phase-progress-panel' },
            { id: 'players-turn-order', name: 'Players Turn Order', selector: '#players-turn-order' },
            { id: 'phase-control-panel', name: 'Phase Control', selector: '.phase-control-panel' },
            { id: 'controls', name: 'Game Controls', selector: '.controls' },
            { id: 'reinforcement-panel', name: 'Reinforcement Panel', selector: '#reinforcement-panel' },
            { id: 'turn-header-panel', name: 'Turn Header Panel', selector: '#turn-header-panel' }
        ];
        
        // Load calibration from localStorage or defaults
        this.loadCalibration();
    }
    
    /**
     * Load calibration from localStorage or extract from current DOM positions
     */
    loadCalibration() {
        const savedData = localStorage.getItem('uiCalibration');
        
        if (savedData) {
            try {
                this.calibrationData = JSON.parse(savedData);
                console.log('🎨 Loaded UI calibration from localStorage');
                
                // Ensure all elements have calibration data (add missing elements)
                let needsUpdate = false;
                this.elements.forEach(element => {
                    if (!this.calibrationData[element.id]) {
                        console.warn(`⚠️ Missing calibration for ${element.name}, extracting from DOM`);
                        const el = document.querySelector(element.selector);
                        if (el) {
                            const style = window.getComputedStyle(el);
                            const top = parseInt(style.top) || 20;
                            const left = parseInt(style.left) || 20;
                            this.calibrationData[element.id] = { x: left, y: top };
                        } else {
                            this.calibrationData[element.id] = { x: 20, y: 20 };
                        }
                        needsUpdate = true;
                    }
                });
                
                if (needsUpdate) {
                    this.saveCalibration();
                }
                
                return;
            } catch (e) {
                console.error('Error parsing saved UI calibration:', e);
            }
        }
        
        // No saved data - extract current positions from DOM
        this.extractDefaultPositions();
    }
    
    /**
     * Extract current DOM positions as default calibration
     */
    extractDefaultPositions() {
        this.calibrationData = {};
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.extractPositionsFromDOM();
            });
        } else {
            this.extractPositionsFromDOM();
        }
    }
    
    /**
     * Extract positions from DOM elements
     */
    extractPositionsFromDOM() {
        this.elements.forEach(element => {
            const el = document.querySelector(element.selector);
            if (el) {
                const style = window.getComputedStyle(el);
                const top = parseInt(style.top) || 0;
                const left = parseInt(style.left) || 0;
                
                this.calibrationData[element.id] = { x: left, y: top };
                console.log(`📏 Extracted ${element.name} position: x=${left}, y=${top}`);
            } else {
                // Default fallback positions
                this.calibrationData[element.id] = { x: 20, y: 20 };
                console.warn(`⚠️ Element ${element.selector} not found, using defaults`);
            }
        });
        
        this.saveCalibration();
    }
    
    /**
     * Save calibration settings to localStorage
     */
    saveCalibration() {
        localStorage.setItem('uiCalibration', JSON.stringify(this.calibrationData));
        console.log('💾 UI calibration saved');
    }
    
    /**
     * Reset to default positions (extracted from current DOM)
     */
    resetToDefaults() {
        // Reset to initial extracted positions
        this.calibrationData = {
            'turn-counter-panel': { x: 20, y: 20 },
            'phase-progress-panel': { x: 20, y: 70 },
            'players-turn-order': { x: 20, y: 190 },
            'phase-control-panel': { x: 20, y: 400 },
            'controls': { x: 20, y: 500 }
        };
        
        this.applyCalibration();
        this.saveCalibration();
        this.showNotification('↺ Reset to defaults!');
    }
    
    /**
     * Apply current calibration to UI elements
     */
    applyCalibration() {
        this.elements.forEach(element => {
            const el = document.querySelector(element.selector);
            const calibration = this.calibrationData[element.id];
            
            if (el && calibration) {
                // Only update position - preserve all other styles and functionality
                el.style.left = `${calibration.x}px`;
                el.style.top = `${calibration.y}px`;
            }
        });
    }
    
    /**
     * Enable development mode with calibration controls
     */
    enableDevelopmentMode() {
        this.isDevelopmentMode = true;
        this.createCalibrationUI();
        console.log('UI calibration development mode enabled');
    }
    
    /**
     * Disable development mode and hide controls
     */
    disableDevelopmentMode() {
        this.isDevelopmentMode = false;
        const ui = document.getElementById('ui-calibration-panel');
        if (ui) {
            ui.remove();
        }
        console.log('UI calibration development mode disabled');
    }
    
    /**
     * Create calibration control UI (modeled after MapCalibration)
     */
    createCalibrationUI() {
        // Remove existing UI if present
        const existing = document.getElementById('ui-calibration-panel');
        if (existing) {
            existing.remove();
        }
        
        const ui = document.createElement('div');
        ui.id = 'ui-calibration-panel';
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
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;
        
        // Add inline styles
        ui.innerHTML = `
            <style>
                #ui-calibration-panel h3 { margin: 0 0 15px 0; font-size: 16px; color: #fff; text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 8px; }
                #ui-calibration-panel .element-section { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 12px; border-left: 3px solid #4CAF50; }
                #ui-calibration-panel .element-section h4 { margin: 0 0 10px 0; font-size: 14px; color: #4CAF50; display: flex; align-items: center; gap: 8px; }
                #ui-calibration-panel .control-group { margin-bottom: 10px; }
                #ui-calibration-panel .control-group label { display: block; margin-bottom: 5px; font-size: 11px; color: #bbb; text-transform: uppercase; }
                #ui-calibration-panel .slider-row { display: flex; align-items: center; gap: 10px; }
                #ui-calibration-panel input[type="range"] { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.2); cursor: pointer; }
                #ui-calibration-panel .value-display { min-width: 55px; text-align: right; font-weight: 600; font-size: 12px; }
                #ui-calibration-panel .btn-group { display: flex; gap: 8px; margin-top: 15px; }
                #ui-calibration-panel button { flex: 1; padding: 10px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
                #ui-calibration-panel button:hover { transform: translateY(-1px); }
                #ui-calibration-panel .btn-reset { background: #f44336; color: white; }
                #ui-calibration-panel .btn-save { background: #4CAF50; color: white; }
            </style>
            
            <h3>⚙️ UI Position Calibration</h3>
            
            ${this.elements.map(element => `
                <div class="element-section">
                    <h4><span>📐</span> ${element.name}</h4>
                    
                    <div class="control-group">
                        <label>X Position (Left)</label>
                        <div class="slider-row">
                            <input type="range" id="${element.id}-x" min="0" max="1500" step="1" value="${this.calibrationData[element.id].x}">
                            <span class="value-display" id="${element.id}-x-value">${this.calibrationData[element.id].x}px</span>
                        </div>
                    </div>
                    
                    <div class="control-group">
                        <label>Y Position (Top)</label>
                        <div class="slider-row">
                            <input type="range" id="${element.id}-y" min="0" max="1500" step="1" value="${this.calibrationData[element.id].y}">
                            <span class="value-display" id="${element.id}-y-value">${this.calibrationData[element.id].y}px</span>
                        </div>
                    </div>
                </div>
            `).join('')}
            
            <div class="btn-group">
                <button class="btn-reset" id="ui-reset-btn">↺ Reset</button>
                <button class="btn-save" id="ui-save-btn">💾 Save</button>
            </div>
            
            <p style="font-size: 10px; color: #999; margin-top: 10px; border-top: 1px solid #555; padding-top: 8px;">
                Press <b>X</b> to toggle calibration mode
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
        this.elements.forEach(element => {
            // X position slider
            const xSlider = document.getElementById(`${element.id}-x`);
            const xValue = document.getElementById(`${element.id}-x-value`);
            
            if (xSlider && xValue) {
                xSlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.calibrationData[element.id].x = value;
                    xValue.textContent = value + 'px';
                    this.applyCalibration();
                });
            }
            
            // Y position slider
            const ySlider = document.getElementById(`${element.id}-y`);
            const yValue = document.getElementById(`${element.id}-y-value`);
            
            if (ySlider && yValue) {
                ySlider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    this.calibrationData[element.id].y = value;
                    yValue.textContent = value + 'px';
                    this.applyCalibration();
                });
            }
        });
        
        // Reset button
        const resetBtn = document.getElementById('ui-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefaults();
                // Re-create UI to update slider values
                this.disableDevelopmentMode();
                this.enableDevelopmentMode();
            });
        }
        
        // Save button
        const saveBtn = document.getElementById('ui-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCalibration();
                this.showNotification('💾 UI positions saved!');
            });
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
     * Toggle calibration mode with keyboard shortcut
     */
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'x' || e.key === 'X') {
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
        console.log('UICalibration initialized. Press "X" to toggle calibration mode.');
    }
}

// Create global instance
window.uiCalibration = new UICalibration();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.uiCalibration.init();
    });
} else {
    window.uiCalibration.init();
}
