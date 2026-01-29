# Testing Guide: Multiplayer and Single-Player Functionality

## Single-Player Testing

Single-player mode should work exactly as before without any multiplayer dependencies.

### How to Test Single-Player:

1. **Start a local web server** (if not already running):
   ```bash
   python3 server.py
   ```
   Or use any other static file server on port 8000.

2. **Navigate to the game**:
   - Open browser: `http://localhost:8000/index.html`
   - Click "SINGLE PLAYER"
   - Or directly: `http://localhost:8000/singleplayer.html`

3. **Setup the game**:
   - Select number of players (2-6)
   - Enter player names
   - Select colors for each player
   - Click "Start Game"

4. **Verify single-player works**:
   - Game loads without errors
   - No multiplayer UI elements visible (no waiting overlay, turn indicator, etc.)
   - All game phases work normally (deployment, attack, fortify)
   - Turn management works locally
   - Can save and load games

## Multiplayer Testing

Multiplayer mode requires the multiplayer server to be running.

### Prerequisites:

1. **Install server dependencies** (one time):
   ```bash
   cd multiplayer
   npm install
   ```

2. **Start the multiplayer server**:
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

### How to Test Multiplayer:

#### Option 1: Same Computer (Two Browser Windows)

1. **Window 1 - Create Game**:
   - Open: `http://localhost:3000/multiplayer/client/lobby.html`
   - Enter your name
   - Select player count
   - Click "Create New Game"
   - Note the session code (e.g., ABC123)
   - Click "Ready Up"
   - Wait for other players

2. **Window 2 - Join Game**:
   - Open: `http://localhost:3000/multiplayer/client/lobby.html` (new window or incognito)
   - Enter your name
   - Enter the session code from Window 1
   - Click "Join Existing Game"
   - Click "Ready Up"

3. **Start Game**:
   - In Window 1 (host), click "Start Game"
   - Both windows should redirect to the game

4. **Verify multiplayer works**:
   - Multiplayer UI elements appear (waiting overlay, turn indicator, connection status)
   - Only the current player's window is interactive
   - Other player(s) see "Waiting for opponent..." overlay
   - Actions sync between windows in real-time
   - Turn changes properly
   - Connection status shows "Connected"

#### Option 2: Different Devices on Same Network

1. **Find server IP address**:
   ```bash
   # On the server computer
   ipconfig   # Windows
   ifconfig   # Linux/Mac
   # Look for IPv4 address (e.g., 192.168.1.100)
   ```

2. **Update client URLs** (if needed):
   - Edit `multiplayer/client/multiplayer-game.html` line ~24
   - Change `http://localhost:3000` to `http://192.168.1.100:3000`
   - Edit `multiplayer/client/lobby.html` similarly

3. **Connect from other device**:
   - Other device: `http://192.168.1.100:3000/multiplayer/client/lobby.html`
   - Follow same steps as Option 1

## Expected Behavior

### Single-Player Mode:
- ✅ No multiplayer dependencies loaded
- ✅ Game runs entirely locally
- ✅ All features work as before
- ✅ No network calls except for optional Firebase saves

### Multiplayer Mode:
- ✅ Server connection established
- ✅ Lobby shows all connected players
- ✅ Only current player can interact with the game
- ✅ Waiting overlay shows for non-active players
- ✅ Turn indicator shows current player name
- ✅ Connection status badge visible
- ✅ Actions sync in real-time
- ✅ Turn changes broadcast to all players
- ✅ Disconnections handled gracefully

## Troubleshooting

### Server Won't Start
**Error**: `EADDRINUSE: address already in use`

**Solution**: Kill process on port 3000:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Can't Connect to Server
**Problem**: Client shows "Connecting..." forever

**Solutions**:
1. Verify server is running: `http://localhost:3000/api/health`
2. Check firewall settings
3. Check browser console for errors (F12)
4. Verify server logs for connection attempts

### Game State Not Syncing
**Problem**: Changes in one window don't appear in another

**Solutions**:
1. Check browser console for errors
2. Verify server is receiving actions (check server logs)
3. Refresh both windows and rejoin session
4. Check network tab to see WebSocket connection status

### Single-Player Accidentally Loads Multiplayer
**Problem**: Single-player shows multiplayer UI

**Solution**: 
- Clear browser cache and localStorage
- Ensure URL doesn't have `?session=` parameter
- Start from `singleplayer.html` not lobby

### Multiplayer Adapter Not Initializing
**Problem**: Multiplayer game shows no waiting overlay or turn indicator

**Solutions**:
1. Check browser console for initialization errors
2. Verify iframe loaded game.html correctly
3. Check that `window.parent.multiplayerAdapter` exists
4. Verify session parameter in URL

## Console Debug Commands

### In Browser Console:

```javascript
// Check if in multiplayer mode
console.log('Multiplayer:', window.parent !== window);

// Check adapter status
console.log('Adapter:', window.parent.multiplayerAdapter);

// Check game state
console.log('Game State:', window.gameState);

// Check connection
console.log('Connected:', window.parent.multiplayerClient?.isConnected);

// Check current turn
console.log('My Turn:', window.parent.multiplayerAdapter?.isMyTurn);
```

### Server Logs:

The server logs show:
- Connection events: `🔌 Client connected`
- Session events: `🎮 Session created`, `👥 Player joined`
- Game actions: `📤 Action received`, `📊 Game state updated`
- Turn changes: `🔄 Turn advanced to [player]`
- Errors: `❌ Error: [message]`

## Feature Checklist

### Single-Player ✓
- [ ] Can access from index.html → Single Player
- [ ] Player registration works
- [ ] Game loads without errors
- [ ] Territory selection works
- [ ] Army deployment works
- [ ] Attack phase works
- [ ] Combat UI functions properly
- [ ] Fortification works
- [ ] Turn advancement works
- [ ] Phase transitions work
- [ ] Can save game
- [ ] Can load saved game

### Multiplayer ✓
- [ ] Can create multiplayer session
- [ ] Can join existing session
- [ ] Lobby shows all players
- [ ] Ready-up system works
- [ ] Host can start game
- [ ] Game loads in multiplayer wrapper
- [ ] Waiting overlay shows for non-active players
- [ ] Turn indicator displays current player
- [ ] Connection status badge shows
- [ ] Only active player can interact
- [ ] Actions sync to all players
- [ ] Turn changes work correctly
- [ ] Reconnection works (if implemented)
- [ ] Leave game works properly

## Known Limitations (MVP)

1. **No reconnection**: If disconnected, must rejoin from lobby
2. **No spectators**: Can't watch ongoing games
3. **No chat**: No in-game communication
4. **Local server only**: Not production-ready for public internet
5. **No authentication**: Anyone with session code can join
6. **No persistence**: Server restart loses all sessions

## Next Steps for Production

1. Add user authentication
2. Implement reconnection logic
3. Add database for session persistence
4. Add HTTPS/WSS for security
5. Add rate limiting
6. Add spectator mode
7. Add in-game chat
8. Deploy to cloud hosting (Heroku, Railway, etc.)
