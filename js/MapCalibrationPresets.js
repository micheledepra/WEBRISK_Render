/**
 * Device-specific map calibration presets
 * These define default layer positions for different device categories
 */
const MapCalibrationPresets = {
    // Desktop/Laptop presets (1024px and above)
    desktop: {
        waterLayer: { offsetX: -97, offsetY: -66, scale: 1.22, opacity: 0.92 },
        eyeballFrame: { offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
        sidebarFrame: { offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
        mapLayer: { offsetX: -131, offsetY: -105, scale: 1.25, opacity: 0.92 },
        territoryLayer: { offsetX: -180, offsetY: -129, scale: 0.5, opacity: 1.0 },
        solidified: true,
        unifiedOffset: { offsetX: 89, offsetY: 58, scale: 0.81 },
        vignetteCenterX: 50,
        vignetteCenterY: 50,
        vignetteScale: 70
    },
    
    // Tablet presets (768px - 1023px)
    tablet: {
        waterLayer: { offsetX: 0, offsetY: -50, scale: 1.1, opacity: 0.85 },
        eyeballFrame: { offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
        sidebarFrame: { offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
        mapLayer: { offsetX: 0, offsetY: -50, scale: 1.1, opacity: 0.85 },
        territoryLayer: { offsetX: 0, offsetY: -50, scale: 1.1, opacity: 1.0 },
        solidified: true,
        unifiedOffset: { offsetX: 0, offsetY: -50, scale: 1.1 },
        vignetteCenterX: 50,
        vignetteCenterY: 50,
        vignetteScale: 70
    },
    
    // Mobile presets (below 768px)
    mobile: {
        waterLayer: { offsetX: -13, offsetY: 39, scale: 1.29, opacity: 0.85 },
        eyeballFrame: { offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
        sidebarFrame: { offsetX: 0, offsetY: 0, scaleX: 1.0, scaleY: 1.0, rotation: 0, opacity: 1.0 },
        mapLayer: { offsetX: -47, offsetY: -9, scale: 1.3, opacity: 0.85 },
        territoryLayer: { offsetX: -99, offsetY: -34, scale: 0.52, opacity: 1.0 },
        solidified: true,
        unifiedOffset: { offsetX: 0, offsetY: -67, scale: 0.76 },
        vignetteCenterX: 50,
        vignetteCenterY: 50,
        vignetteScale: 70
    },
    
    /**
     * Detect device category based on screen size and orientation
     * @returns {string} 'desktop', 'tablet', or 'mobile'
     */
    detectDeviceCategory() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isPortrait = height > width;
        
        // Desktop/Laptop detection
        if (width >= 1024) {
            console.log(`📱 Device detected: DESKTOP (${width}x${height})`);
            return 'desktop';
        }
        
        // Tablet detection (iPad, Android tablets)
        if (width >= 768 && width < 1024) {
            console.log(`📱 Device detected: TABLET (${width}x${height})`);
            return 'tablet';
        }
        
        // Mobile detection
        if (width < 768) {
            console.log(`📱 Device detected: MOBILE (${width}x${height})`);
            return 'mobile';
        }
        
        return 'desktop'; // Fallback
    },
    
    /**
     * Get the appropriate preset for current device
     * @returns {Object} Calibration preset object
     */
    getCurrentPreset() {
        const category = this.detectDeviceCategory();
        return this[category];
    },
    
    /**
     * Check if current calibration matches the device preset
     * @param {Object} currentCalibration - Current calibration data
     * @returns {boolean} True if using preset, false if customized
     */
    isUsingPreset(currentCalibration) {
        const preset = this.getCurrentPreset();
        
        // Deep comparison of layer positions
        const matches = 
            this.compareLayer(currentCalibration.waterLayer, preset.waterLayer) &&
            this.compareLayer(currentCalibration.mapLayer, preset.mapLayer) &&
            this.compareLayer(currentCalibration.territoryLayer, preset.territoryLayer) &&
            this.compareLayer(currentCalibration.unifiedOffset, preset.unifiedOffset);
        
        return matches;
    },
    
    /**
     * Compare two layer configurations (with tolerance for floating point errors)
     */
    compareLayer(layer1, layer2, tolerance = 0.01) {
        if (!layer1 || !layer2) return false;
        
        return Math.abs(layer1.offsetX - layer2.offsetX) < tolerance &&
               Math.abs(layer1.offsetY - layer2.offsetY) < tolerance &&
               Math.abs(layer1.scale - layer2.scale) < tolerance;
    }
};

// Make globally available
window.MapCalibrationPresets = MapCalibrationPresets;

console.log('📋 MapCalibrationPresets loaded with device-specific defaults');
