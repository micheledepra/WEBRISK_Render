/**
 * Multiplayer Risk Game Server
 * Handles game sessions, player connections, and state synchronization
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const SessionManager = require('./SessionManager');
const { EVENTS, ACTION_TYPES } = require('../shared/constants');

// Configuration
const PORT = process.env.PORT || 3000;
const CLIENT_PATH = path.join(__dirname, '../../');

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Session Manager
const sessionManager = new SessionManager();

// Serve static files (game assets)
app.use(express.static(CLIENT_PATH));
app.use(express.json());

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

// Admin Dashboard
app.get('/admin', (req, res) => {
  const sessions = sessionManager.getAllSessions();
  const activeSessions = sessions.filter(s => s.state !== 'completed');
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Risk Server Admin</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px; 
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #eee;
          min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { 
          color: #ffd700; 
          text-align: center; 
          margin-bottom: 30px;
          font-size: 2.5em;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card { 
          background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
          padding: 20px; 
          border-radius: 10px;
          border-left: 4px solid #ffd700;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .stat-value { 
          font-size: 2.5em; 
          color: #0f3; 
          font-weight: bold;
          margin: 10px 0;
        }
        .stat-label { 
          color: #aaa; 
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .status { color: #0f3; font-size: 1.2em; }
        .status::before { 
          content: '●'; 
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .url-box {
          background: rgba(15, 243, 0, 0.1);
          padding: 20px;
          border: 2px solid #0f3;
          border-radius: 10px;
          margin: 20px 0;
          text-align: center;
        }
        .url-box h3 { color: #0f3; margin-bottom: 15px; }
        .url-box a {
          color: #0f3;
          font-size: 1.3em;
          word-break: break-all;
          text-decoration: none;
          font-weight: bold;
        }
        .url-box a:hover { text-decoration: underline; }
        .session-card {
          background: #0f3460;
          padding: 15px;
          margin: 10px 0;
          border-radius: 8px;
          border-left: 4px solid #e94560;
        }
        .session-header {
          font-size: 1.2em;
          color: #ffd700;
          margin-bottom: 10px;
        }
        .session-info { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          color: #ccc;
        }
        .buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
          margin: 20px 0;
        }
        button { 
          background: linear-gradient(135deg, #e94560 0%, #ff6b81 100%);
          color: white; 
          padding: 12px 24px; 
          border: none; 
          cursor: pointer;
          border-radius: 5px;
          font-size: 1em;
          font-weight: bold;
          transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        button:hover { 
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .btn-primary { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
        .section {
          background: rgba(22, 33, 62, 0.5);
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .section h2 {
          color: #ffd700;
          margin-bottom: 15px;
          font-size: 1.5em;
        }
        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎲 Risk Multiplayer Server</h1>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Server Status</div>
            <div class="status">Running</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Sessions</div>
            <div class="stat-value" id="sessionCount">${activeSessions.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Connected Players</div>
            <div class="stat-value" id="playerCount">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Uptime</div>
            <div class="stat-value" id="uptime">${Math.floor(process.uptime())}s</div>
          </div>
        </div>

        <div class="url-box">
          <h3>🌐 Share This URL With Friends</h3>
          <a id="publicUrl" href="/" target="_blank">${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}</a>
          <p style="margin-top: 10px; color: #888; font-size: 0.9em;">
            Players connect here to join games
          </p>
        </div>

        <div class="buttons">
          <button class="btn-primary" onclick="window.location.href='/multiplayer/client/lobby.html'">
            🎮 Launch Game Lobby
          </button>
          <button onclick="refreshStatus()">🔄 Refresh Status</button>
        </div>

        <div class="section">
          <h2>🎮 Active Game Sessions</h2>
          <div id="sessionList">
            ${activeSessions.length === 0 ? '<div class="empty-state">No active games - waiting for players to create sessions</div>' : ''}
          </div>
        </div>

        <div class="footer">
          <p>Risk Multiplayer Server v1.0.0</p>
          <p>Environment: ${process.env.NODE_ENV || 'development'} | Port: ${PORT}</p>
        </div>
      </div>

      <script>
        function formatUptime(seconds) {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = Math.floor(seconds % 60);
          if (hours > 0) return hours + 'h ' + minutes + 'm';
          if (minutes > 0) return minutes + 'm ' + secs + 's';
          return secs + 's';
        }

        function updateSessions(sessions) {
          const listEl = document.getElementById('sessionList');
          
          if (!sessions || sessions.length === 0) {
            listEl.innerHTML = '<div class="empty-state">No active games</div>';
            return;
          }

          const html = sessions.map(session => {
            const players = session.players || [];
            return \`
              <div class="session-card">
                <div class="session-header">Session: \${session.sessionId}</div>
                <div class="session-info">
                  <div><strong>Players:</strong> \${players.length}/\${session.maxPlayers}</div>
                  <div><strong>Status:</strong> \${session.state}</div>
                  <div><strong>Host:</strong> \${session.hostUserId}</div>
                  <div><strong>Turn:</strong> #\${session.turnNumber || 0}</div>
                </div>
              </div>
            \`;
          }).join('');
          
          listEl.innerHTML = html;
        }

        function refreshStatus() {
          fetch('/api/health')
            .then(r => r.json())
            .then(data => {
              document.getElementById('uptime').textContent = formatUptime(data.uptime);
              document.getElementById('sessionCount').textContent = data.sessions;
            })
            .catch(err => console.error('Error fetching health:', err));

          fetch('/api/sessions')
            .then(r => r.json())
            .then(data => {
              if (data.sessions) {
                const activeSessions = data.sessions.filter(s => s.state !== 'completed');
                updateSessions(activeSessions);
                document.getElementById('sessionCount').textContent = activeSessions.length;
                
                // Count total players
                const totalPlayers = activeSessions.reduce((sum, s) => sum + (s.players?.length || 0), 0);
                document.getElementById('playerCount').textContent = totalPlayers;
              }
            })
            .catch(err => console.error('Error fetching sessions:', err));
        }

        // Initial load
        refreshStatus();
        
        // Auto-refresh every 5 seconds
        setInterval(refreshStatus, 5000);
      </script>
    </body>
    </html>
  `);
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

// Socket.IO Connection Handling
io.on(EVENTS.CONNECTION, (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

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
  socket.on(EVENTS.DISCONNECT, () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    if (socket.sessionId && socket.userId) {
      handlePlayerLeave(socket.sessionId, socket.userId, socket);
    }
  });
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

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'development';
  const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   🎲 Multiplayer Risk Game Server Running    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n🌐 Environment: ${env}`);
  console.log(`🌐 Public URL: ${publicUrl}`);
  console.log(`📁 Serving files from: ${CLIENT_PATH}`);
  console.log(`\n💡 Admin Panel: ${publicUrl}/admin`);
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
