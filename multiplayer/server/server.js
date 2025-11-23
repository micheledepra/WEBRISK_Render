/**
 * Multiplayer Risk Game Server
 * Handles game sessions, player connections, and state synchronization
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const SessionManager = require('./SessionManager');
const SessionPersistence = require('./SessionPersistence');
const GameDataStore = require('./GameDataStore');
const GameEngine = require('./GameEngine');
const { EVENTS, ACTION_TYPES } = require('../shared/constants');

// Configuration
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '../..');

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  allowUpgrades: true,
  perMessageDeflate: false,
  httpCompression: true,
  cookie: false,
  serveClient: true,  // ✅ FIXED: Changed from false to true
  path: '/socket.io/'
});

// Initialize Session Persistence
const sessionPersistence = new SessionPersistence();

// Initialize Session Manager with Persistence
const sessionManager = new SessionManager(sessionPersistence);

// Initialize Game Data Store for historical data
const gameDataStore = new GameDataStore();

// Initialize Game Engine (server-side game logic)
const gameEngine = new GameEngine();
console.log('🎮 Game Engine initialized - server is now authoritative');

// Clean up old game sessions every hour
setInterval(() => {
  gameEngine.cleanupOldSessions();
}, 60 * 60 * 1000);

// CORS middleware - Allow all origins for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serve static files from the root directory (all game assets)
console.log('📁 Serving static files from:', ROOT_DIR);
app.use(express.static(ROOT_DIR, {
  setHeaders: (res, path) => {
    // Fix MIME types for CSS files
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    // Fix MIME types for JS files
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Fix MIME types for image files
    if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    // Fix MIME types for audio files
    if (path.endsWith('.mp3')) {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
    if (path.endsWith('.ogg')) {
      res.setHeader('Content-Type', 'audio/ogg');
    }
    if (path.endsWith('.wav')) {
      res.setHeader('Content-Type', 'audio/wav');
    }
  }
}));
app.use(express.json());

// Explicit route for game.html
app.get('/game.html', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'game.html'));
});

// Explicit route for index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    sessions: sessionManager.getAllSessions().length,
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Admin Dashboard - Serve new admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin.html'));
});

// Alternative admin URL
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/admin.html'));
});

// API endpoint to get all sessions
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = sessionManager.getAllSessions().map(session => ({
      sessionId: session.sessionId,
      hostUserId: session.hostUserId,
      maxPlayers: session.maxPlayers,
      state: session.state,
      turnNumber: session.turnNumber,
      players: Array.from(session.players.values()).map(p => ({
        userId: p.userId,
        playerName: p.playerName,
        state: p.state
      }))
    }));
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    sessions: sessionManager.getAllSessions().length,
    timestamp: Date.now()
  });
});

app.post('/api/sessions/create', (req, res) => {
  try {
    const { hostUserId, hostPlayerName, playerCount } = req.body;
    
    if (!hostUserId || !hostPlayerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = sessionManager.createSession(hostUserId, hostPlayerName, playerCount || 2);
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      session: serializeSession(session)
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions/:sessionId', (req, res) => {
  try {
    const session = sessionManager.getSession(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session: serializeSession(session)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Game Data API Endpoints - Historical Data Persistence
// ============================================================

/**
 * Save game data snapshot
 * POST /api/game-data/save
 * Body: { gameId: string, gameData: object }
 */
app.post('/api/game-data/save', (req, res) => {
  try {
    const { gameId, gameData } = req.body;
    
    if (!gameId || !gameData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: gameId or gameData' 
      });
    }

    console.log(`📊 Saving game data for game: ${gameId}`);
    const result = gameDataStore.saveGameData(gameId, gameData);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('❌ Error saving game data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get all historical game data
 * GET /api/game-data/history?limit=100
 */
app.get('/api/game-data/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    console.log(`📊 Fetching game history (limit: ${limit})`);
    
    const history = gameDataStore.getAllGamesHistory(limit);
    
    res.json({
      success: true,
      count: history.length,
      games: history
    });
  } catch (error) {
    console.error('❌ Error fetching game history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get historical data for a specific game
 * GET /api/game-data/:gameId/history?limit=50
 */
app.get('/api/game-data/:gameId/history', (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    console.log(`📊 Fetching history for game: ${gameId} (limit: ${limit})`);
    const history = gameDataStore.getGameHistory(gameId, limit);
    
    res.json({
      success: true,
      gameId,
      count: history.length,
      snapshots: history
    });
  } catch (error) {
    console.error('❌ Error fetching game history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get latest snapshot for a specific game
 * GET /api/game-data/:gameId/latest
 */
app.get('/api/game-data/:gameId/latest', (req, res) => {
  try {
    const { gameId } = req.params;
    
    console.log(`📊 Fetching latest data for game: ${gameId}`);
    const data = gameDataStore.getLatestGameData(gameId);
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Game not found' 
      });
    }
    
    res.json({
      success: true,
      gameId,
      data
    });
  } catch (error) {
    console.error('❌ Error fetching game data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get storage statistics
 * GET /api/game-data/stats
 */
app.get('/api/game-data/stats', (req, res) => {
  try {
    const stats = gameDataStore.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================================
// End of Game Data API Endpoints
// ============================================================

// Socket.IO Connection Handling
io.on(EVENTS.CONNECTION, (socket) => {
  console.log(`🔌 Client connected: ${socket.id} | Transport: ${socket.conn.transport.name}`);

  // Log transport upgrades
  socket.conn.on('upgrade', (transport) => {
    console.log(`⬆️ Transport upgraded to: ${transport.name}`);
  });

  // Create Session Event
  socket.on('createSession', (data) => {
    try {
      console.log('📥 Received createSession request:', data);
      
      const { hostName, color, maxPlayers } = data;
      
      if (!hostName || !color || !maxPlayers) {
        throw new Error('Missing required fields: hostName, color, or maxPlayers');
      }
      
      // Create session with SessionManager (returns session object)
      const session = sessionManager.createSession(socket.id, hostName, maxPlayers);
      const sessionCode = session.sessionId;
      
      // Update host with color
      if (session.players) {
        const hostPlayer = session.players.get(socket.id);
        if (hostPlayer) {
          hostPlayer.color = color;
          hostPlayer.isHost = true;
          hostPlayer.socketId = socket.id;
        }
      }
      
      socket.join(sessionCode);
      
      console.log(`✅ Session created: ${sessionCode} by ${hostName}`);
      
      // Convert players Map to object for client
      const playersObj = {};
      if (session.players instanceof Map) {
        session.players.forEach((player, userId) => {
          playersObj[player.playerName] = {
            socketId: player.socketId || userId,
            color: player.color,
            isReady: player.state === 'ready',
            isHost: player.isHost || userId === socket.id,
            id: userId
          };
        });
      }
      
      // Send response with properly formatted data
      socket.emit('sessionCreated', { 
        sessionCode: sessionCode,
        session: {
          sessionId: sessionCode,
          hostUserId: socket.id,
          maxPlayers: maxPlayers,
          state: session.state,
          players: playersObj,
          createdAt: session.createdAt
        }
      });
      
      // Emit session update to room
      io.to(sessionCode).emit('sessionUpdate', {
        sessionCode: sessionCode,
        players: playersObj,
        playerCount: session.players.size,
        maxPlayers: maxPlayers
      });

    } catch (error) {
      console.error('❌ Create session error:', error);
      socket.emit('sessionError', { message: error.message });
    }
  });

  // Join Session Event
  socket.on('joinSession', (data) => {
    try {
      console.log('📥 Received joinSession request:', data);
      
      const { sessionCode, playerName, color } = data;
      
      if (!sessionCode || !playerName || !color) {
        throw new Error('Missing required fields: sessionCode, playerName, or color');
      }
      
      const session = sessionManager.getSession(sessionCode);
      
      if (!session) {
        socket.emit('joinError', { message: 'Session not found. Please check the code.' });
        return;
      }
      
      // Check if session is full
      if (session.players.size >= session.maxPlayers) {
        socket.emit('joinError', { message: 'Session is full' });
        return;
      }
      
      // Check if name is already taken
      let nameTaken = false;
      session.players.forEach((player) => {
        if (player.playerName === playerName) {
          nameTaken = true;
        }
      });
      
      if (nameTaken) {
        socket.emit('joinError', { message: 'Name already taken. Please choose another name.' });
        return;
      }
      
      // Check if color is already taken
      let colorTaken = false;
      session.players.forEach((player) => {
        if (player.color === color) {
          colorTaken = true;
        }
      });
      
      if (colorTaken) {
        socket.emit('joinError', { message: 'Color already taken. Please choose another color.' });
        return;
      }
      
      // Add player to session
      const playerIndex = session.players.size;
      session.players.set(socket.id, {
        userId: socket.id,
        playerName: playerName,
        socketId: socket.id,
        playerIndex: playerIndex,
        state: 'not_ready',
        color: color,
        isHost: false,
        joinedAt: Date.now()
      });
      
      socket.join(sessionCode);
      
      console.log(`✅ ${playerName} joined session ${sessionCode}`);
      
      // Convert players Map to object for client
      const playersObj = {};
      session.players.forEach((player, userId) => {
        playersObj[player.playerName] = {
          socketId: player.socketId || userId,
          color: player.color,
          isReady: player.state === 'ready',
          isHost: player.isHost || false,
          id: userId
        };
      });
      
      // Notify the joining player
      socket.emit('sessionJoined', { 
        sessionCode: sessionCode,
        session: {
          sessionId: sessionCode,
          hostUserId: session.hostUserId,
          maxPlayers: session.maxPlayers,
          state: session.state,
          players: playersObj,
          createdAt: session.createdAt
        }
      });

      // Notify all players in session
      io.to(sessionCode).emit('playerJoined', {
        player: {
          id: socket.id,
          name: playerName,
          color: color,
          ready: false,
          isHost: false
        }
      });
      
      // Send session update to all players
      io.to(sessionCode).emit('sessionUpdate', {
        sessionCode: sessionCode,
        players: playersObj,
        playerCount: session.players.size,
        maxPlayers: session.maxPlayers
      });
      
      // Save to persistence
      sessionManager.saveSessionToPersistence(sessionCode);

    } catch (error) {
      console.error('❌ Join session error:', error);
      socket.emit('joinError', { message: error.message });
    }
  });

  // Toggle Ready Event (legacy support)
  socket.on('toggleReady', (data) => {
    try {
      const { sessionCode, playerName, isReady } = data;
      const session = sessionManager.getSession(sessionCode);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.players || !session.players[playerName]) {
        throw new Error('Player not in session');
      }

      // Update ready status
      session.players[playerName].isReady = isReady;
      session.lastUpdate = Date.now();

      // Save to persistence
      sessionManager.saveSessionToPersistence(sessionCode);

      // Notify all players
      io.to(sessionCode).emit('playerReady', {
        playerName,
        isReady,
        players: session.players
      });

      console.log(`${isReady ? '✅' : '⏳'} ${playerName} is ${isReady ? 'ready' : 'not ready'}`);
    } catch (error) {
      console.error('❌ Toggle ready error:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // Player Ready Event (new format for lobby.html)
  socket.on('playerReady', (data) => {
    try {
      const { sessionCode, ready } = data;
      const session = sessionManager.getSession(sessionCode);
      
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Find player by socket ID
      const player = session.players.get(socket.id);
      if (!player) {
        socket.emit('error', { message: 'Player not in session' });
        return;
      }
      
      // Update ready status
      player.state = ready ? 'ready' : 'not_ready';
      session.lastUpdate = Date.now();
      
      console.log(`${ready ? '✅' : '⏳'} ${player.playerName} is ${ready ? 'ready' : 'not ready'} in ${sessionCode}`);
      
      // Convert players Map to object
      const playersObj = {};
      session.players.forEach((p, userId) => {
        playersObj[p.playerName] = {
          socketId: p.socketId || userId,
          color: p.color,
          isReady: p.state === 'ready',
          isHost: p.isHost || userId === session.hostUserId,
          id: userId
        };
      });
      
      // Notify all players in session
      io.to(sessionCode).emit('playerReady', {
        playerId: socket.id,
        playerName: player.playerName,
        ready: ready
      });
      
      // Send session update
      io.to(sessionCode).emit('sessionUpdate', {
        sessionCode: sessionCode,
        players: playersObj,
        playerCount: session.players.size,
        maxPlayers: session.maxPlayers
      });
      
      // Save to persistence
      sessionManager.saveSessionToPersistence(sessionCode);
      
    } catch (error) {
      console.error('❌ Player ready error:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Start Game Event
  socket.on('startGame', async (data) => {
    console.log('🎮 Start game request from', socket.id, 'with data:', data);
    
    try {
      const { sessionCode } = data;
      
      // Validate session code
      if (!sessionCode) {
        throw new Error('Session code required');
      }
      
      // Get session
      const session = sessionManager.getSession(sessionCode);
      if (!session) {
        console.error('❌ Session not found:', sessionCode);
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      console.log('📊 Session state:', {
        sessionId: session.sessionId,
        hostUserId: session.hostUserId,
        requesterId: socket.id,
        state: session.state,
        playerCount: session.players.size
      });
      
      // Verify requester is host
      if (session.hostUserId !== socket.id) {
        console.error('❌ Not host. Host:', session.hostUserId, 'Requester:', socket.id);
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }
      
      // Get all players
      const players = Array.from(session.players.values());
      console.log('👥 Players:', players.map(p => ({ name: p.playerName, ready: p.state === 'ready' })));
      
      // Check if all players are ready
      const allReady = players.every(p => p.state === 'ready');
      if (!allReady) {
        const notReady = players.filter(p => p.state !== 'ready').map(p => p.playerName);
        console.error('❌ Not all ready. Not ready:', notReady);
        socket.emit('error', { 
          message: `Not all players are ready. Waiting for: ${notReady.join(', ')}` 
        });
        return;
      }
      
      // Check minimum players
      if (players.length < 2) {
        console.error('❌ Not enough players:', players.length);
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }
      
      // Update session state
      session.state = 'playing';
      session.startedAt = Date.now();
      
      console.log(`✅ Game starting in session ${sessionCode}`);
      console.log(`   Players: ${players.length}`);
      console.log(`   All ready: ${allReady}`);
      
      // Notify all players
      io.to(sessionCode).emit('gameStarting', {
        sessionCode: sessionCode,
        countdown: 3,
        players: players.map(p => ({
          name: p.playerName,
          color: p.color,
          isHost: p.isHost || p.userId === session.hostUserId
        }))
      });
      
      console.log('📤 Broadcasted gameStarting to session:', sessionCode);
      
      // Save to persistence
      await sessionManager.saveSessionToPersistence(sessionCode);
      
    } catch (error) {
      console.error('❌ Error in startGame:', error);
      socket.emit('error', {
        message: error.message || 'Failed to start game'
      });
    }
  });

  // ========================================
  // GAME ENGINE ENDPOINTS (Server-Side Game Logic)
  // ========================================

  /**
   * Initialize Game State on Server
   * Server creates authoritative game state and broadcasts to all clients
   * Uses deterministic territory assignment to ensure all clients see same state
   */
  socket.on('game:initialize', async (data) => {
    console.log('🎮 Game initialization request:', data);
    
    try {
      const { sessionCode, players, playerColors, clientPlayerMapping } = data;
      
      if (!sessionCode || !players || players.length < 2) {
        throw new Error('Invalid game initialization data');
      }
      
      // Generate deterministic seed for territory assignment
      const initSeed = Date.now();
      
      // Initialize game on server with client-player mapping
      const result = gameEngine.initializeGame(
        sessionCode, 
        players, 
        playerColors, 
        clientPlayerMapping,
        initSeed
      );
      
      if (result.success) {
        // Broadcast authoritative initial state to ALL players in session
        io.to(sessionCode).emit('game:initialized', {
          success: true,
          gameState: result.initialState,
          seed: initSeed,
          message: 'Game initialized by server with deterministic territory assignment'
        });
        
        console.log(`✅ Game initialized for session ${sessionCode}`);
        console.log(`   Players: ${players.join(', ')}`);
        console.log(`   Seed: ${initSeed}`);
        console.log(`   Client-Player Mapping:`, clientPlayerMapping);
        
        // Persist to Firebase
        if (result.initialState) {
          await sessionPersistence.saveSessionState(sessionCode, {
            gameState: result.initialState,
            lastUpdate: Date.now(),
            phase: result.initialState.phase,
            currentPlayer: result.initialState.currentPlayer
          });
          console.log(`   💾 Persisted to Firebase`);
        }
      } else {
        socket.emit('game:error', { error: result.error });
      }
      
    } catch (error) {
      console.error('❌ Game initialization error:', error);
      socket.emit('game:error', { error: error.message });
    }
  });

  /**
   * Deploy Armies
   * Server validates and executes army deployment
   * Now includes client validation to ensure only controlling client can act
   */
  socket.on('game:deploy', async (data) => {
    try {
      const { sessionCode, userId, territoryId, armyCount } = data;
      const clientId = socket.id;
      
      console.log(`🪖 Deploy request: ${userId} → ${territoryId} (${armyCount} armies) [client: ${clientId}]`);
      
      // Pass clientId for validation
      const result = gameEngine.deployArmies(sessionCode, clientId, userId, territoryId, armyCount);
      
      if (result.success) {
        // Broadcast updated state to ALL players in session
        io.to(sessionCode).emit('game:stateUpdate', {
          gameState: result.gameState,
          action: result.action
        });
        
        console.log(`✅ Deployment successful, state broadcasted to ${sessionCode}`);
        
        // Persist to Firebase
        await sessionPersistence.saveSessionState(sessionCode, {
          gameState: result.gameState,
          lastUpdate: Date.now(),
          phase: result.gameState.phase,
          currentPlayer: result.gameState.currentPlayer
        });
      } else {
        // Send error only to requesting player
        socket.emit('game:actionFailed', { 
          error: result.error,
          action: 'deploy' 
        });
        console.warn(`❌ Deployment failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Deploy error:', error);
      socket.emit('game:error', { error: error.message });
    }
  });

  /**
   * Execute Attack
   * Server validates, rolls dice, and resolves battle
   */
  socket.on('game:attack', async (data) => {
    try {
      const { 
        sessionCode, 
        userId, 
        attackingTerritory, 
        defendingTerritory,
        attackerArmies 
      } = data;
      const clientId = socket.id;
      
      console.log(`⚔️ Attack request: ${userId} attacking ${defendingTerritory} from ${attackingTerritory} [client: ${clientId}]`);
      
      const result = gameEngine.executeAttack(
        sessionCode,
        clientId,
        userId,
        attackingTerritory,
        defendingTerritory,
        attackerArmies
      );
      
      if (result.success) {
        // Broadcast battle result to ALL players
        io.to(sessionCode).emit('game:battleResult', {
          gameState: result.gameState,
          battleResult: result.battleResult,
          attacker: userId,
          attackingTerritory,
          defendingTerritory
        });
        
        console.log(`✅ Battle resolved, result broadcasted to ${sessionCode}`);
        
        // Persist to Firebase
        await sessionPersistence.saveSessionState(sessionCode, {
          gameState: result.gameState,
          lastUpdate: Date.now(),
          phase: result.gameState.phase,
          currentPlayer: result.gameState.currentPlayer
        });
      } else {
        socket.emit('game:actionFailed', { 
          error: result.error,
          action: 'attack' 
        });
        console.warn(`❌ Attack failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Attack error:', error);
      socket.emit('game:error', { error: error.message });
    }
  });

  /**
   * Fortify Territory
   * Server validates and executes army movement
   */
  socket.on('game:fortify', async (data) => {
    try {
      const { sessionCode, userId, sourceTerritory, targetTerritory, armyCount } = data;
      const clientId = socket.id;
      
      console.log(`🔄 Fortify request: ${userId} moving ${armyCount} from ${sourceTerritory} to ${targetTerritory} [client: ${clientId}]`);
      
      const result = gameEngine.fortifyTerritory(
        sessionCode,
        clientId,
        userId,
        sourceTerritory,
        targetTerritory,
        armyCount
      );
      
      if (result.success) {
        // Broadcast to ALL players in session
        io.to(sessionCode).emit('game:stateUpdate', {
          gameState: result.gameState,
          action: result.action
        });
        
        console.log(`✅ Fortification successful, state broadcasted to ${sessionCode}`);
        
        // Persist to Firebase
        await sessionPersistence.saveSessionState(sessionCode, {
          gameState: result.gameState,
          lastUpdate: Date.now(),
          phase: result.gameState.phase,
          currentPlayer: result.gameState.currentPlayer
        });
      } else {
        socket.emit('game:actionFailed', { 
          error: result.error,
          action: 'fortify' 
        });
        console.warn(`❌ Fortification failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Fortify error:', error);
      socket.emit('game:error', { error: error.message });
    }
  });

  /**
   * Advance Phase
   * Server advances game phase and notifies all players
   */
  socket.on('game:advancePhase', async (data) => {
    try {
      const { sessionCode, userId } = data;
      const clientId = socket.id;
      
      console.log(`🔄 Phase advance request: ${userId} in session ${sessionCode} [client: ${clientId}]`);
      
      const result = gameEngine.advancePhase(sessionCode, clientId, userId);
      
      if (result.success) {
        // Broadcast phase change to ALL players in session
        io.to(sessionCode).emit('game:phaseChanged', {
          gameState: result.gameState,
          oldPhase: result.oldPhase,
          newPhase: result.newPhase,
          player: userId,
          currentPlayer: result.gameState.currentPlayer
        });
        
        console.log(`✅ Phase changed: ${result.oldPhase} → ${result.newPhase}`);
        console.log(`   Current player: ${result.gameState.currentPlayer}`);
        
        // Persist to Firebase
        await sessionPersistence.saveSessionState(sessionCode, {
          gameState: result.gameState,
          lastUpdate: Date.now(),
          phase: result.newPhase,
          currentPlayer: result.gameState.currentPlayer
        });
      } else {
        socket.emit('game:actionFailed', { 
          error: result.error,
          action: 'advancePhase' 
        });
        console.warn(`❌ Phase advance failed: ${result.error}`);
      }
      
    } catch (error) {
      console.error('❌ Phase advance error:', error);
      socket.emit('game:error', { error: error.message });
    }
  });

  // ========================================
  // END OF GAME ENGINE ENDPOINTS
  // ========================================
  
  // Request Session Data (for game initialization)
  socket.on('requestSessionData', (data) => {
    console.log('📥 Session data request from', socket.id, 'for session:', data.sessionCode);
    
    try {
      const { sessionCode } = data;
      
      if (!sessionCode) {
        throw new Error('Session code required');
      }
      
      const session = sessionManager.getSession(sessionCode);
      
      if (!session) {
        console.error('❌ Session not found:', sessionCode);
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      
      // Allow loading session data even if game is in progress (for reconnection)
      // But only if this socket is one of the players in the session
      if (session.state === 'playing') {
        console.log('✅ Loading data for game in progress:', sessionCode);
        
        // Join the session room for receiving updates
        socket.join(sessionCode);
        
        // Try to match player by finding their data in the session
        let matchedPlayer = null;
        for (const [userId, playerData] of session.players.entries()) {
          // Check if this socket's old ID matches (reconnection case)
          if (playerData.socketId !== socket.id) {
            const oldSocketConnected = io.sockets.sockets.get(playerData.socketId);
            if (!oldSocketConnected) {
              // Old socket disconnected, update to new socket ID
              matchedPlayer = { userId, oldSocketId: playerData.socketId };
              console.log(`🔄 Updating socket ID for ${playerData.playerName}: ${playerData.socketId} → ${socket.id}`);
              playerData.socketId = socket.id;
              break;
            }
          }
        }
      }
      
      console.log('✅ Sending session data for:', sessionCode);
      
      // Convert Map to object
      const playersObj = {};
      session.players.forEach((playerData, userId) => {
        playersObj[playerData.playerName] = {
          socketId: playerData.socketId,
          userId: userId,
          color: playerData.color,
          isHost: playerData.isHost || userId === session.hostUserId,
          isReady: playerData.state === 'ready',
          playerIndex: playerData.playerIndex
        };
      });
      
      // Send session data
      socket.emit('sessionData', {
        sessionId: session.sessionId,
        hostUserId: session.hostUserId,
        maxPlayers: session.maxPlayers,
        state: session.state,
        players: playersObj,
        createdAt: session.createdAt,
        startedAt: session.startedAt
      });
      
      console.log('📤 Sent session data with', Object.keys(playersObj).length, 'players');
      
    } catch (error) {
      console.error('❌ Error sending session data:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Join Session
  socket.on(EVENTS.SESSION_JOIN, ({ sessionId, userId, playerName }) => {
    try {
      console.log(`📥 Join request: ${playerName} → ${sessionId}`);
      
      const session = sessionManager.joinSession(sessionId, userId, playerName, socket.id);
      
      // Join socket room
      socket.join(sessionId);
      
      // Store session info in socket
      socket.sessionId = sessionId;
      socket.userId = userId;
      
      // Send session data to joining player
      socket.emit(EVENTS.SESSION_UPDATE, serializeSession(session));
      
      // Notify all players in session
      io.to(sessionId).emit(EVENTS.SESSION_PLAYER_UPDATE, {
        players: serializePlayers(session.players),
        action: 'joined',
        player: { userId, playerName }
      });

      console.log(`✅ ${playerName} joined session ${sessionId}`);
    } catch (error) {
      console.error('Join error:', error);
      socket.emit(EVENTS.SESSION_ERROR, { message: error.message });
    }
  });

  // Player Ready
  socket.on(EVENTS.PLAYER_READY, ({ sessionId, userId, ready }) => {
    try {
      const session = sessionManager.setPlayerReady(sessionId, userId, ready);
      
      // Notify all players
      io.to(sessionId).emit(EVENTS.SESSION_UPDATE, serializeSession(session));
      
      console.log(`${ready ? '✅' : '❌'} Player ready status: ${userId} in ${sessionId}`);
    } catch (error) {
      socket.emit(EVENTS.SESSION_ERROR, { message: error.message });
    }
  });

  // Start Game
  socket.on(EVENTS.SESSION_START, ({ sessionId, userId, initialGameState }) => {
    try {
      const session = sessionManager.getSession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      if (session.hostUserId !== userId) {
        throw new Error('Only host can start the game');
      }

      sessionManager.startSession(sessionId, initialGameState);
      
      // Notify all players game is starting
      io.to(sessionId).emit(EVENTS.SESSION_UPDATE, serializeSession(session));
      io.to(sessionId).emit(EVENTS.GAME_STATE_UPDATE, initialGameState);

      // Notify whose turn it is
      const currentPlayer = sessionManager.getCurrentPlayer(sessionId);
      io.to(sessionId).emit(EVENTS.TURN_START, {
        currentPlayerId: currentPlayer.userId,
        currentPlayerName: currentPlayer.playerName,
        turnNumber: session.turnNumber
      });

      console.log(`🎮 Game started in session ${sessionId}`);
    } catch (error) {
      socket.emit(EVENTS.SESSION_ERROR, { message: error.message });
    }
  });

  // Player Action (Deploy, Attack, Fortify, etc.)
  socket.on(EVENTS.PLAYER_ACTION, async ({ sessionId, userId, action }) => {
    try {
      // Validate turn
      const validation = sessionManager.canPlayerAct(sessionId, userId);
      
      if (!validation.valid) {
        socket.emit(EVENTS.TURN_VALIDATION_ERROR, { 
          message: validation.reason 
        });
        return;
      }

      const session = sessionManager.getSession(sessionId);
      
      console.log(`🎯 Action from ${userId}: ${action.type}`);

      // Process action based on type
      let newGameState = session.gameState;
      let turnComplete = false;

      switch (action.type) {
        case ACTION_TYPES.END_TURN:
        case ACTION_TYPES.END_PHASE:
          turnComplete = true;
          newGameState = action.gameState || session.gameState;
          
          // Advance to next player
          session.currentPlayerIndex = (session.currentPlayerIndex + 1) % session.players.size;
          session.turnNumber++;
          break;

        case ACTION_TYPES.DEPLOY_ARMY:
        case ACTION_TYPES.EXECUTE_ATTACK:
        case ACTION_TYPES.FORTIFY:
        case ACTION_TYPES.CLAIM_TERRITORY:
          // Update game state from action
          newGameState = action.gameState;
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }

      // Update session game state
      sessionManager.updateGameState(sessionId, newGameState);

      // Broadcast updated game state to all players
      io.to(sessionId).emit(EVENTS.GAME_STATE_UPDATE, newGameState);

      // If turn completed, notify next player
      if (turnComplete) {
        const nextPlayer = sessionManager.getCurrentPlayer(sessionId);
        io.to(sessionId).emit(EVENTS.TURN_START, {
          currentPlayerId: nextPlayer.userId,
          currentPlayerName: nextPlayer.playerName,
          turnNumber: session.turnNumber,
          phase: newGameState.phase
        });

        console.log(`🔄 Turn advanced to ${nextPlayer.playerName}`);
      }

    } catch (error) {
      console.error('Action error:', error);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });

  // Request Game State Sync
  socket.on(EVENTS.GAME_STATE_SYNC, ({ sessionId }) => {
    try {
      const session = sessionManager.getSession(sessionId);
      
      if (!session) {
        socket.emit(EVENTS.SESSION_ERROR, { message: 'Session not found' });
        return;
      }

      socket.emit(EVENTS.GAME_STATE_UPDATE, session.gameState);
      socket.emit(EVENTS.SESSION_UPDATE, serializeSession(session));

      const currentPlayer = sessionManager.getCurrentPlayer(sessionId);
      if (currentPlayer) {
        socket.emit(EVENTS.TURN_START, {
          currentPlayerId: currentPlayer.userId,
          currentPlayerName: currentPlayer.playerName,
          turnNumber: session.turnNumber
        });
      }
    } catch (error) {
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });

  // Leave Session
  socket.on(EVENTS.SESSION_LEAVE, ({ sessionId, userId }) => {
    handlePlayerLeave(sessionId, userId, socket);
  });

  // Disconnect
  socket.on(EVENTS.DISCONNECT, (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} | Reason: ${reason}`);
    
    if (socket.sessionId && socket.userId) {
      // Mark player as disconnected instead of removing immediately
      const session = sessionManager.getSession(socket.sessionId);
      if (session && session.players) {
        for (const [playerName, playerData] of Object.entries(session.players)) {
          if (playerData.socketId === socket.id) {
            playerData.disconnected = true;
            playerData.disconnectedAt = Date.now();
            
            io.to(socket.sessionId).emit('playerDisconnected', {
              playerName,
              players: session.players
            });
            
            console.log(`🔌 ${playerName} disconnected from ${socket.sessionId}`);
            
            // Remove after 5 minutes
            setTimeout(() => {
              const currentSession = sessionManager.getSession(socket.sessionId);
              if (currentSession && currentSession.players[playerName]?.disconnected) {
                handlePlayerLeave(socket.sessionId, socket.userId, socket);
                console.log(`👋 ${playerName} removed from ${socket.sessionId} after timeout`);
              }
            }, 5 * 60 * 1000);
            break;
          }
        }
      }
    }
  });

  // Handle socket errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', socket.id, error);
  });

  // ============================================================
  // Admin Panel Socket Handlers
  // ============================================================

  // Admin: Get all sessions
  socket.on('adminGetSessions', () => {
    try {
      console.log('📊 Admin: Request for session data');
      const allSessions = sessionManager.getAllSessions();
      
      // Format sessions for admin panel
      const formattedSessions = {};
      allSessions.forEach(session => {
        const sessionCode = session.sessionId || session.code;
        formattedSessions[sessionCode] = {
          code: sessionCode,
          sessionCode: sessionCode,
          status: session.state || 'waiting',
          maxPlayers: session.maxPlayers || 6,
          hostName: session.hostPlayerName || session.hostUserId,
          createdAt: session.createdAt || Date.now(),
          players: {}
        };
        
        // Convert players Map to object
        if (session.players && session.players instanceof Map) {
          session.players.forEach((player, userId) => {
            formattedSessions[sessionCode].players[player.playerName || userId] = {
              id: userId,
              socketId: player.socketId,
              color: player.color,
              isReady: player.ready || false,
              isHost: userId === session.hostUserId
            };
          });
        } else if (session.players && typeof session.players === 'object') {
          formattedSessions[sessionCode].players = session.players;
        }
      });
      
      socket.emit('adminSessionData', { sessions: formattedSessions });
      console.log('✅ Admin: Sent session data for', allSessions.length, 'sessions');
    } catch (error) {
      console.error('❌ Admin: Error getting sessions:', error);
      socket.emit('error', { message: 'Failed to get session data' });
    }
  });

  // Admin: End specific session
  socket.on('adminEndSession', ({ sessionCode }) => {
    try {
      console.log('⛔ Admin: Request to end session:', sessionCode);
      const session = sessionManager.getSession(sessionCode);
      
      if (!session) {
        console.log('❌ Admin: Session not found:', sessionCode);
        socket.emit('error', { message: 'Session not found: ' + sessionCode });
        return;
      }
      
      console.log('✅ Admin: Session found, notifying players...');
      
      // Notify all players in the session
      io.to(sessionCode).emit('sessionEnded', {
        sessionCode,
        reason: 'Admin ended the session'
      });
      
      // Remove players from the session room
      if (session.players && session.players instanceof Map) {
        session.players.forEach((player) => {
          const playerSocket = io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.leave(sessionCode);
          }
        });
      }
      
      // Delete the session from SessionManager's Map
      sessionManager.sessions.delete(sessionCode);
      
      // Delete from persistence
      if (sessionManager.persistence) {
        sessionManager.persistence.deleteSession(sessionCode);
      }
      
      // Confirm to admin
      socket.emit('sessionEnded', { sessionCode });
      console.log('✅ Admin: Session ended successfully:', sessionCode);
    } catch (error) {
      console.error('❌ Admin: Error ending session:', error);
      socket.emit('error', { message: 'Failed to end session: ' + error.message });
    }
  });

  // Admin: End all sessions
  socket.on('adminEndAllSessions', () => {
    try {
      console.log('⛔ Admin: Request to end all sessions');
      const allSessions = sessionManager.getAllSessions();
      let count = 0;
      
      allSessions.forEach(session => {
        const sessionCode = session.sessionId || session.code;
        
        console.log(`⛔ Ending session: ${sessionCode}`);
        
        // Notify players
        io.to(sessionCode).emit('sessionEnded', {
          sessionCode,
          reason: 'Admin ended all sessions'
        });
        
        // Remove players from room
        if (session.players && session.players instanceof Map) {
          session.players.forEach((player) => {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
              playerSocket.leave(sessionCode);
            }
          });
        }
        
        // Delete session from Map
        sessionManager.sessions.delete(sessionCode);
        
        // Delete from persistence
        if (sessionManager.persistence) {
          sessionManager.persistence.deleteSession(sessionCode);
        }
        
        count++;
      });
      
      console.log(`✅ Admin: Ended ${count} sessions`);
      socket.emit('adminSessionData', { sessions: {} });
    } catch (error) {
      console.error('❌ Admin: Error ending all sessions:', error);
      socket.emit('error', { message: 'Failed to end all sessions: ' + error.message });
    }
  });

  // Admin: Kick inactive players
  socket.on('adminKickInactive', () => {
    try {
      console.log('👢 Admin: Kicking inactive players');
      const allSessions = sessionManager.getAllSessions();
      let kickedCount = 0;
      
      allSessions.forEach(session => {
        if (!session.players || !(session.players instanceof Map)) return;
        
        const now = Date.now();
        const inactiveTimeout = 5 * 60 * 1000; // 5 minutes
        
        session.players.forEach((player, userId) => {
          const lastActive = player.lastActivity || player.joinedAt || 0;
          if (now - lastActive > inactiveTimeout) {
            console.log(`👢 Kicking inactive player: ${player.playerName}`);
            handlePlayerLeave(session.sessionId, userId, socket);
            kickedCount++;
          }
        });
      });
      
      console.log(`✅ Admin: Kicked ${kickedCount} inactive players`);
      socket.emit('adminSessionData', { sessions: sessionManager.getAllSessions() });
    } catch (error) {
      console.error('❌ Admin: Error kicking inactive players:', error);
      socket.emit('error', { message: 'Failed to kick inactive players' });
    }
  });

  // End of Admin Panel Socket Handlers
  // ============================================================
});

// Helper Functions

function handlePlayerLeave(sessionId, userId, socket) {
  try {
    const session = sessionManager.getSession(sessionId);
    if (!session) return;

    const player = session.players.get(userId);
    const playerName = player?.playerName || 'Unknown';

    sessionManager.leaveSession(sessionId, userId);
    socket.leave(sessionId);

    // Notify remaining players
    io.to(sessionId).emit(EVENTS.SESSION_PLAYER_UPDATE, {
      players: serializePlayers(session.players),
      action: 'left',
      player: { userId, playerName }
    });

    console.log(`👋 ${playerName} left session ${sessionId}`);
  } catch (error) {
    console.error('Leave error:', error);
  }
}

function serializeSession(session) {
  return {
    sessionId: session.sessionId,
    hostUserId: session.hostUserId,
    maxPlayers: session.maxPlayers,
    state: session.state,
    players: serializePlayers(session.players),
    currentPlayerIndex: session.currentPlayerIndex,
    turnNumber: session.turnNumber,
    createdAt: session.createdAt
  };
}

function serializePlayers(playersMap) {
  return Array.from(playersMap.values()).map(player => ({
    userId: player.userId,
    playerName: player.playerName,
    playerIndex: player.playerIndex,
    state: player.state,
    joinedAt: player.joinedAt
  }));
}

// Cleanup old sessions every hour
setInterval(() => {
  sessionManager.cleanupOldSessions(24);
}, 60 * 60 * 1000);

// Error handling for Socket.IO engine
io.engine.on('connection_error', (err) => {
  console.error('❌ Connection error:', err.req?.url, err.code, err.message, err.context);
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'development';
  const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   🎲 Multiplayer Risk Game Server Running    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n🌐 Environment: ${env}`);
  console.log(`🌐 Public URL: ${publicUrl}`);
  console.log(`📁 Serving files from: ${ROOT_DIR}`);
  console.log(`🔌 Socket.IO: Websocket + Polling enabled`);
  console.log(`\n💡 Main Menu: ${publicUrl}/`);
  console.log(`💡 Single Player: ${publicUrl}/game.html`);
  console.log(`💡 Admin Panel: ${publicUrl}/admin`);
  console.log(`💡 Game Lobby: ${publicUrl}/multiplayer/client/lobby.html`);
  console.log(`💡 Health Check: ${publicUrl}/api/health`);
  console.log(`\n⏳ Waiting for connections...\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
