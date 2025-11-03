/**
 * 🎲 Session Code Generator
 * Generates secure 6-digit alphanumeric codes for multiplayer sessions
 */

class SessionCodeGenerator {
    constructor() {
        // Exclude confusing characters: I, O, 0, 1, l
        this.chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        this.codeLength = 6;
    }

    /**
     * Generate a random 6-digit session code
     * @returns {string} - Session code (e.g., "ABC234")
     */
    generate() {
        let code = '';
        for (let i = 0; i < this.codeLength; i++) {
            const randomIndex = Math.floor(Math.random() * this.chars.length);
            code += this.chars[randomIndex];
        }
        return code;
    }

    /**
     * Validate a session code format
     * @param {string} code - Code to validate
     * @returns {boolean} - Whether code is valid format
     */
    validate(code) {
        if (!code || typeof code !== 'string') {
            return false;
        }

        // Must be exactly 6 characters
        if (code.length !== this.codeLength) {
            return false;
        }

        // Must only contain valid characters
        const validPattern = new RegExp(`^[${this.chars}]{${this.codeLength}}$`);
        return validPattern.test(code);
    }

    /**
     * Normalize a session code (uppercase, trim)
     * @param {string} code - Code to normalize
     * @returns {string} - Normalized code
     */
    normalize(code) {
        if (!code) return '';
        return code.toString().trim().toUpperCase();
    }

    /**
     * Generate unique code (check against existing codes)
     * @param {Set} existingCodes - Set of codes already in use
     * @param {number} maxAttempts - Maximum generation attempts
     * @returns {string|null} - Unique code or null if failed
     */
    generateUnique(existingCodes = new Set(), maxAttempts = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const code = this.generate();
            if (!existingCodes.has(code)) {
                return code;
            }
        }
        
        console.error('❌ Failed to generate unique session code after', maxAttempts, 'attempts');
        return null;
    }

    /**
     * Calculate collision probability
     * @param {number} existingSessions - Number of active sessions
     * @returns {number} - Collision probability (0-1)
     */
    getCollisionProbability(existingSessions) {
        const totalPossible = Math.pow(this.chars.length, this.codeLength);
        // Birthday problem approximation
        return 1 - Math.exp(-existingSessions * (existingSessions - 1) / (2 * totalPossible));
    }

    /**
     * Get statistics about code space
     * @returns {Object} - Statistics
     */
    getStatistics() {
        const totalPossible = Math.pow(this.chars.length, this.codeLength);
        return {
            charset: this.chars,
            codeLength: this.codeLength,
            totalPossibleCodes: totalPossible,
            formattedTotal: totalPossible.toLocaleString(),
            collisionAt1000: (this.getCollisionProbability(1000) * 100).toFixed(2) + '%',
            collisionAt10000: (this.getCollisionProbability(10000) * 100).toFixed(2) + '%'
        };
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionCodeGenerator;
}
if (typeof window !== 'undefined') {
    window.SessionCodeGenerator = SessionCodeGenerator;
}
