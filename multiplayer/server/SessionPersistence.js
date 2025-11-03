/**
 * 💾 Server-Side Session Persistence
 * Saves sessions to JSON files for recovery after server restart
 * Integrates with existing SessionManager
 */

const fs = require('fs').promises;
const path = require('path');

class SessionPersistence {
    constructor(dataDir = './data/sessions') {
        this.dataDir = dataDir;
        this.initialized = false;
    }

    /**
     * 🚀 Initialize persistence (create directories)
     */
    async initialize() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            console.log('✅ Session persistence initialized:', this.dataDir);
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize persistence:', error);
            this.initialized = false;
            return false;
        }
    }

    /**
     * 💾 Save session to file
     * Compatible with SessionManager data structure
     */
    async saveSession(sessionData) {
        if (!this.initialized) {
            console.warn('⚠️ Persistence not initialized');
            return false;
        }

        try {
            const sessionId = sessionData.sessionId;
            const filePath = path.join(this.dataDir, `${sessionId}.json`);

            // Convert Map to plain object for JSON serialization
            const data = {
                sessionId: sessionData.sessionId,
                hostUserId: sessionData.hostUserId,
                maxPlayers: sessionData.maxPlayers,
                state: sessionData.state,
                createdAt: sessionData.createdAt,
                startedAt: sessionData.startedAt,
                savedAt: new Date().toISOString(),
                timestamp: Date.now(),
                players: {},
                gameState: sessionData.gameState || null,
                currentPlayerIndex: sessionData.currentPlayerIndex || 0,
                turnNumber: sessionData.turnNumber || 0
            };

            // Convert players Map to object
            if (sessionData.players instanceof Map) {
                sessionData.players.forEach((player, userId) => {
                    data.players[userId] = {
                        ...player,
                        socketId: null // Don't persist socket IDs
                    };
                });
            } else if (typeof sessionData.players === 'object') {
                data.players = { ...sessionData.players };
            }

            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            console.log('💾 Session saved to file:', sessionId);
            return true;
        } catch (error) {
            console.error('❌ Failed to save session:', error);
            return false;
        }
    }

    /**
     * 📂 Load session from file
     */
    async loadSession(sessionId) {
        if (!this.initialized) {
            console.warn('⚠️ Persistence not initialized');
            return null;
        }

        try {
            const filePath = path.join(this.dataDir, `${sessionId}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            const sessionData = JSON.parse(data);

            // Convert players back to Map for compatibility with SessionManager
            if (sessionData.players && typeof sessionData.players === 'object') {
                const playersMap = new Map();
                Object.entries(sessionData.players).forEach(([userId, player]) => {
                    playersMap.set(userId, player);
                });
                sessionData.players = playersMap;
            }

            console.log('✅ Session loaded from file:', sessionId);
            return sessionData;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Failed to load session:', error);
            }
            return null;
        }
    }

    /**
     * 🗑️ Delete session file
     */
    async deleteSession(sessionId) {
        if (!this.initialized) return false;

        try {
            const filePath = path.join(this.dataDir, `${sessionId}.json`);
            await fs.unlink(filePath);
            console.log('🗑️ Session file deleted:', sessionId);
            return true;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('❌ Failed to delete session:', error);
            }
            return false;
        }
    }

    /**
     * 📋 List all saved sessions
     */
    async listSessions() {
        if (!this.initialized) return [];

        try {
            const files = await fs.readdir(this.dataDir);
            const sessions = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const sessionId = file.replace('.json', '');
                    const sessionData = await this.loadSession(sessionId);
                    if (sessionData) {
                        sessions.push({
                            sessionId,
                            savedAt: sessionData.savedAt,
                            state: sessionData.state,
                            players: Object.keys(sessionData.players || {}).length,
                            started: sessionData.state !== 'waiting',
                            age: Date.now() - sessionData.timestamp
                        });
                    }
                }
            }

            return sessions;
        } catch (error) {
            console.error('❌ Failed to list sessions:', error);
            return [];
        }
    }

    /**
     * 🧹 Clean old sessions (older than 24 hours)
     */
    async cleanOldSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
        if (!this.initialized) return 0;

        const cutoffTime = Date.now() - maxAgeMs;
        let cleaned = 0;

        try {
            const sessions = await this.listSessions();

            for (const session of sessions) {
                if (session.age > maxAgeMs) {
                    await this.deleteSession(session.sessionId);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                console.log(`🧹 Cleaned ${cleaned} old session(s)`);
            }
        } catch (error) {
            console.error('❌ Failed to clean old sessions:', error);
        }

        return cleaned;
    }

    /**
     * 📊 Get session statistics
     */
    async getStatistics() {
        const sessions = await this.listSessions();

        return {
            total: sessions.length,
            active: sessions.filter(s => s.state === 'in_progress').length,
            waiting: sessions.filter(s => s.state === 'waiting').length,
            completed: sessions.filter(s => s.state === 'completed').length,
            totalPlayers: sessions.reduce((sum, s) => sum + s.players, 0)
        };
    }

    /**
     * 🔄 Restore all active sessions
     * Returns array of session data to be restored in SessionManager
     */
    async restoreActiveSessions() {
        if (!this.initialized) return [];

        try {
            const sessions = await this.listSessions();
            const activeSessions = [];

            for (const sessionInfo of sessions) {
                // Only restore sessions that are in progress
                if (sessionInfo.state === 'in_progress' || sessionInfo.state === 'waiting') {
                    const sessionData = await this.loadSession(sessionInfo.sessionId);
                    if (sessionData) {
                        activeSessions.push(sessionData);
                    }
                }
            }

            console.log(`🔄 Restored ${activeSessions.length} active session(s)`);
            return activeSessions;
        } catch (error) {
            console.error('❌ Failed to restore sessions:', error);
            return [];
        }
    }
}

module.exports = SessionPersistence;
