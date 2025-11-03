/**
 * 🔥 Firebase Realtime Database Manager
 * Integrates Firebase persistence with existing multiplayer architecture
 * Works alongside MultiplayerClient for hybrid server/Firebase approach
 */

class FirebaseManager {
    constructor() {
        this.db = null;
        this.sessionRef = null;
        this.currentSessionCode = null;
        this.listeners = {};
        this.initialized = false;
        this.autoSaveInterval = null;
        this.storageKey = 'riskMultiplayerSession';
    }

    /**
     * 🚀 Initialize Firebase with your config
     */
    initialize(config) {
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                console.warn('⚠️ Firebase SDK not loaded - persistence disabled');
                return false;
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
                console.log('✅ Firebase initialized');
            }

            // Get database reference
            this.db = firebase.database();
            this.initialized = true;

            console.log('✅ Firebase Realtime Database connected');
            return true;
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            return false;
        }
    }

    /**
     * 💾 Save game session to Firebase
     * Integrates with existing SessionManager data structure
     */
    async saveSession(sessionData) {
        if (!this.initialized) {
            return this.saveToLocalStorage(sessionData);
        }

        try {
            const sessionCode = sessionData.sessionId || sessionData.code;
            
            // Convert Map to plain object for Firebase
            const firebaseData = {
                sessionId: sessionCode,
                hostUserId: sessionData.hostUserId,
                maxPlayers: sessionData.maxPlayers,
                state: sessionData.state,
                createdAt: sessionData.createdAt,
                lastUpdate: Date.now(),
                players: {},
                gameState: sessionData.gameState || null,
                currentPlayerIndex: sessionData.currentPlayerIndex || 0,
                turnNumber: sessionData.turnNumber || 0
            };

            // Convert players Map to object
            if (sessionData.players instanceof Map) {
                sessionData.players.forEach((player, userId) => {
                    firebaseData.players[userId] = {
                        ...player,
                        socketId: null // Don't save socket IDs
                    };
                });
            } else if (typeof sessionData.players === 'object') {
                firebaseData.players = { ...sessionData.players };
            }

            await this.db.ref(`sessions/${sessionCode}`).set(firebaseData);
            
            // Also save to localStorage as backup
            this.saveToLocalStorage(sessionData);

            console.log('💾 Session saved to Firebase:', sessionCode);
            return true;
        } catch (error) {
            console.error('❌ Failed to save to Firebase, using localStorage:', error);
            return this.saveToLocalStorage(sessionData);
        }
    }

    /**
     * 📂 Load game session from Firebase
     */
    async loadSession(sessionCode) {
        if (!this.initialized) {
            return this.loadFromLocalStorage(sessionCode);
        }

        try {
            const snapshot = await this.db.ref(`sessions/${sessionCode}`).once('value');
            
            if (!snapshot.exists()) {
                console.log('📭 No Firebase session found, checking localStorage');
                return this.loadFromLocalStorage(sessionCode);
            }

            const data = snapshot.val();
            
            // Convert back to Map for compatibility with SessionManager
            const sessionData = {
                ...data,
                players: new Map(Object.entries(data.players || {}))
            };

            console.log('✅ Session loaded from Firebase:', sessionCode);
            return sessionData;
        } catch (error) {
            console.error('❌ Failed to load from Firebase:', error);
            return this.loadFromLocalStorage(sessionCode);
        }
    }

    /**
     * 👂 Listen for real-time session updates
     */
    onSessionUpdate(sessionCode, callback) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase not initialized, real-time updates disabled');
            return;
        }

        const sessionRef = this.db.ref(`sessions/${sessionCode}`);
        
        sessionRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Convert players back to Map
                const sessionData = {
                    ...data,
                    players: new Map(Object.entries(data.players || {}))
                };
                
                console.log('📡 Firebase session updated');
                callback(sessionData);
            }
        });

        this.sessionRef = sessionRef;
        this.currentSessionCode = sessionCode;
        console.log('👂 Listening for Firebase updates:', sessionCode);
    }

    /**
     * 🎮 Update game state in Firebase
     */
    async updateGameState(sessionCode, gameState) {
        if (!this.initialized) {
            return false;
        }

        try {
            await this.db.ref(`sessions/${sessionCode}/gameState`).set({
                ...gameState,
                timestamp: Date.now()
            });

            await this.db.ref(`sessions/${sessionCode}/lastUpdate`).set(Date.now());

            console.log('✅ Game state updated in Firebase');
            return true;
        } catch (error) {
            console.error('❌ Failed to update game state:', error);
            return false;
        }
    }

    /**
     * 🗑️ Delete session from Firebase
     */
    async deleteSession(sessionCode) {
        if (!this.initialized) {
            return this.clearLocalStorage(sessionCode);
        }

        try {
            await this.db.ref(`sessions/${sessionCode}`).remove();
            this.clearLocalStorage(sessionCode);
            console.log('🗑️ Session deleted from Firebase:', sessionCode);
            return true;
        } catch (error) {
            console.error('❌ Failed to delete session:', error);
            return false;
        }
    }

    /**
     * 🔌 Stop listening to updates
     */
    stopListening() {
        if (this.sessionRef) {
            this.sessionRef.off();
            this.sessionRef = null;
        }
        
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        
        console.log('🔌 Stopped listening to Firebase updates');
    }

    // ============================================
    // LocalStorage Fallback Methods
    // ============================================

    /**
     * 💾 Save to localStorage (fallback)
     */
    saveToLocalStorage(sessionData) {
        try {
            const sessionCode = sessionData.sessionId || sessionData.code;
            const storageData = {
                ...sessionData,
                timestamp: Date.now(),
                lastSaved: new Date().toISOString()
            };

            // Convert Map to Object for JSON serialization
            if (sessionData.players instanceof Map) {
                storageData.players = Object.fromEntries(sessionData.players);
            }

            localStorage.setItem(
                `${this.storageKey}_${sessionCode}`,
                JSON.stringify(storageData)
            );

            console.log('💾 Session saved to localStorage:', sessionCode);
            return true;
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
            return false;
        }
    }

    /**
     * 📂 Load from localStorage (fallback)
     */
    loadFromLocalStorage(sessionCode) {
        try {
            const data = localStorage.getItem(`${this.storageKey}_${sessionCode}`);
            
            if (!data) {
                console.log('📭 No localStorage session found:', sessionCode);
                return null;
            }

            const sessionData = JSON.parse(data);

            // Check if data is too old (24 hours)
            const age = Date.now() - (sessionData.timestamp || 0);
            if (age > 24 * 60 * 60 * 1000) {
                console.warn('⚠️ Session data is too old, discarding');
                this.clearLocalStorage(sessionCode);
                return null;
            }

            // Convert players back to Map
            if (sessionData.players && !(sessionData.players instanceof Map)) {
                sessionData.players = new Map(Object.entries(sessionData.players));
            }

            console.log('✅ Session loaded from localStorage:', sessionCode);
            return sessionData;
        } catch (error) {
            console.error('❌ Failed to load from localStorage:', error);
            return null;
        }
    }

    /**
     * 🗑️ Clear localStorage
     */
    clearLocalStorage(sessionCode) {
        try {
            if (sessionCode) {
                localStorage.removeItem(`${this.storageKey}_${sessionCode}`);
            } else {
                // Clear all sessions
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.storageKey)) {
                        localStorage.removeItem(key);
                    }
                });
            }
            console.log('🗑️ localStorage cleared for:', sessionCode || 'all sessions');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear localStorage:', error);
            return false;
        }
    }

    /**
     * 📋 List all saved sessions (both Firebase and localStorage)
     */
    async listSessions() {
        const sessions = [];

        // Get from Firebase
        if (this.initialized) {
            try {
                const snapshot = await this.db.ref('sessions').once('value');
                const firebaseSessions = snapshot.val() || {};
                
                Object.entries(firebaseSessions).forEach(([code, data]) => {
                    sessions.push({
                        sessionCode: code,
                        source: 'firebase',
                        lastUpdate: data.lastUpdate,
                        players: Object.keys(data.players || {}).length,
                        state: data.state
                    });
                });
            } catch (error) {
                console.error('❌ Failed to list Firebase sessions:', error);
            }
        }

        // Get from localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storageKey + '_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    const code = key.replace(this.storageKey + '_', '');
                    
                    // Avoid duplicates
                    if (!sessions.find(s => s.sessionCode === code)) {
                        sessions.push({
                            sessionCode: code,
                            source: 'localStorage',
                            lastUpdate: data.timestamp,
                            players: Object.keys(data.players || {}).length,
                            state: data.state
                        });
                    }
                }
            });
        } catch (error) {
            console.error('❌ Failed to list localStorage sessions:', error);
        }

        return sessions.sort((a, b) => b.lastUpdate - a.lastUpdate);
    }

    /**
     * 🧹 Clean old sessions (24+ hours)
     */
    async cleanOldSessions() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const cutoff = Date.now() - maxAge;
        let cleaned = 0;

        // Clean Firebase
        if (this.initialized) {
            try {
                const snapshot = await this.db.ref('sessions').once('value');
                const sessions = snapshot.val() || {};
                
                const deletions = [];
                Object.entries(sessions).forEach(([code, data]) => {
                    if ((data.lastUpdate || 0) < cutoff) {
                        deletions.push(this.db.ref(`sessions/${code}`).remove());
                        cleaned++;
                    }
                });

                await Promise.all(deletions);
                console.log(`🧹 Cleaned ${cleaned} old Firebase session(s)`);
            } catch (error) {
                console.error('❌ Failed to clean Firebase sessions:', error);
            }
        }

        // Clean localStorage
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.storageKey + '_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if ((data.timestamp || 0) < cutoff) {
                        localStorage.removeItem(key);
                        cleaned++;
                    }
                }
            });
            console.log(`🧹 Total cleaned: ${cleaned} old session(s)`);
        } catch (error) {
            console.error('❌ Failed to clean localStorage:', error);
        }

        return cleaned;
    }

    /**
     * ⏰ Start auto-save (call periodically)
     */
    startAutoSave(sessionCode, getSessionDataFn, intervalMs = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            const sessionData = getSessionDataFn();
            if (sessionData) {
                await this.saveSession(sessionData);
            }
        }, intervalMs);

        console.log(`⏰ Auto-save started (every ${intervalMs / 1000}s)`);
    }

    /**
     * ⏸️ Stop auto-save
     */
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏸️ Auto-save stopped');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseManager;
}
