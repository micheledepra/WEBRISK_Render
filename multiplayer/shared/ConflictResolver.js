/**
 * 🔄 Conflict Resolution System
 * Timestamp-based conflict resolution for concurrent updates
 */

class ConflictResolver {
    constructor() {
        this.conflictLog = [];
        this.maxLogSize = 100;
    }

    /**
     * Resolve conflict between two game states
     * @param {Object} localState - Local game state
     * @param {Object} remoteState - Remote game state
     * @returns {Object} - Resolved state with metadata
     */
    resolveConflict(localState, remoteState) {
        const result = {
            resolvedState: null,
            conflictType: null,
            resolution: null,
            timestamp: Date.now()
        };

        // 1. No conflict if same timestamp
        if (localState.timestamp === remoteState.timestamp) {
            result.resolvedState = remoteState;
            result.conflictType = 'none';
            result.resolution = 'identical';
            return result;
        }

        // 2. Simple case: one is clearly newer
        if (remoteState.timestamp > localState.timestamp) {
            result.resolvedState = remoteState;
            result.conflictType = 'timestamp';
            result.resolution = 'remote_newer';
            return result;
        }

        if (localState.timestamp > remoteState.timestamp) {
            result.resolvedState = localState;
            result.conflictType = 'timestamp';
            result.resolution = 'local_newer';
            this.logConflict('local_newer', localState, remoteState);
            return result;
        }

        // 3. Complex case: version numbers differ
        const localVersion = this.parseVersion(localState.version);
        const remoteVersion = this.parseVersion(remoteState.version);

        if (remoteVersion > localVersion) {
            result.resolvedState = remoteState;
            result.conflictType = 'version';
            result.resolution = 'remote_higher_version';
            return result;
        }

        if (localVersion > remoteVersion) {
            result.resolvedState = localState;
            result.conflictType = 'version';
            result.resolution = 'local_higher_version';
            this.logConflict('local_higher_version', localState, remoteState);
            return result;
        }

        // 4. Fallback: merge states
        result.resolvedState = this.mergeStates(localState, remoteState);
        result.conflictType = 'merge';
        result.resolution = 'merged';
        this.logConflict('merged', localState, remoteState);

        return result;
    }

    /**
     * Merge two game states (advanced conflict resolution)
     * @param {Object} localState - Local state
     * @param {Object} remoteState - Remote state
     * @returns {Object} - Merged state
     */
    mergeStates(localState, remoteState) {
        const merged = { ...remoteState }; // Start with remote as base

        // Merge territories individually
        if (localState.territories && remoteState.territories) {
            merged.territories = {};

            const allTerritoryIds = new Set([
                ...Object.keys(localState.territories),
                ...Object.keys(remoteState.territories)
            ]);

            allTerritoryIds.forEach(territoryId => {
                const localTerritory = localState.territories[territoryId];
                const remoteTerritory = remoteState.territories[territoryId];

                if (!localTerritory) {
                    merged.territories[territoryId] = remoteTerritory;
                } else if (!remoteTerritory) {
                    merged.territories[territoryId] = localTerritory;
                } else {
                    // Both exist - use timestamp of individual territory updates
                    const localTime = localTerritory.lastUpdate || 0;
                    const remoteTime = remoteTerritory.lastUpdate || 0;

                    merged.territories[territoryId] = remoteTime >= localTime 
                        ? remoteTerritory 
                        : localTerritory;
                }
            });
        }

        // Always trust remote for turn/phase data (server is source of truth)
        merged.currentPlayer = remoteState.currentPlayer;
        merged.currentPhase = remoteState.currentPhase;
        merged.turnNumber = remoteState.turnNumber;

        // Update timestamp to now
        merged.timestamp = Date.now();
        merged.lastActionTimestamp = Date.now();

        return merged;
    }

    /**
     * Parse version string to number
     * @param {string} version - Version string (e.g., "1.0")
     * @returns {number} - Numeric version
     */
    parseVersion(version) {
        if (!version) return 0;
        const parts = version.split('.');
        return parseInt(parts[0]) * 100 + parseInt(parts[1] || 0);
    }

    /**
     * Log conflict for debugging
     * @param {string} resolutionType - How conflict was resolved
     * @param {Object} localState - Local state
     * @param {Object} remoteState - Remote state
     */
    logConflict(resolutionType, localState, remoteState) {
        const entry = {
            timestamp: Date.now(),
            resolution: resolutionType,
            localTimestamp: localState.timestamp,
            remoteTimestamp: remoteState.timestamp,
            localPlayer: localState.currentPlayer,
            remotePlayer: remoteState.currentPlayer
        };

        this.conflictLog.push(entry);

        // Keep log size manageable
        if (this.conflictLog.length > this.maxLogSize) {
            this.conflictLog.shift();
        }

        console.log('🔄 Conflict resolved:', resolutionType, entry);
    }

    /**
     * Get conflict statistics
     * @returns {Object} - Statistics about conflicts
     */
    getStatistics() {
        if (this.conflictLog.length === 0) {
            return {
                totalConflicts: 0,
                byType: {},
                averageTimeDelta: 0
            };
        }

        const byType = {};
        let totalTimeDelta = 0;

        this.conflictLog.forEach(entry => {
            byType[entry.resolution] = (byType[entry.resolution] || 0) + 1;
            totalTimeDelta += Math.abs(entry.localTimestamp - entry.remoteTimestamp);
        });

        return {
            totalConflicts: this.conflictLog.length,
            byType,
            averageTimeDelta: totalTimeDelta / this.conflictLog.length,
            recentConflicts: this.conflictLog.slice(-10)
        };
    }

    /**
     * Clear conflict log
     */
    clearLog() {
        this.conflictLog = [];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConflictResolver;
}
if (typeof window !== 'undefined') {
    window.ConflictResolver = ConflictResolver;
}
