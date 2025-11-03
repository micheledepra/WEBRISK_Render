# 🎲 Risk Multiplayer - MVP Setup Guide

Complete multiplayer implementation for the Risk board game digital edition.

## 📁 Project Structure

```
multiplayer/
├── server/
│   ├── server.js              # Main Express + Socket.IO server
│   └── SessionManager.js      # Game session management
├── client/
│   ├── lobby.html             # Game lobby (create/join sessions)
│   ├── multiplayer-game.html  # Multiplayer game wrapper
│   ├── MultiplayerClient.js   # Client-side server communication
│   ├── MultiplayerGameAdapter.js  # Adapts single-player game for multiplayer
│   └── multiplayer-ui.css     # Multiplayer UI styles
├── shared/
│   └── constants.js           # Shared constants between client/server
└── package.json               # Node.js dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

Open PowerShell in the `multiplayer` folder:

```powershell
cd multiplayer
npm install
```

### 2. Start the Server

```powershell
npm start
```

Or for development (auto-restart on changes):

```powershell
npm run dev
```

The server will start on **http://localhost:3000**

### 3. Access the Game

Open your browser and navigate to:

```
http://localhost:3000/multiplayer/client/lobby.html
```

## 🎮 How to Play Multiplayer

### Creating a Game

1. Go to **lobby.html**
2. The first player creates a session
3. Share the session code or link with friends
4. Wait for all players to join
5. All players click "Ready Up"
6. Host clicks "Start Game"

### Joining a Game

1. Open the shared link or enter session code
2. You'll automatically join the lobby
3. Click "Ready Up"
4. Wait for host to start

### During the Game

- **Your Turn**: You can interact with the map, deploy armies, attack, etc.
- **Not Your Turn**: The screen dims with "Waiting for opponent..." overlay
- **Turn Indicator**: Shows whose turn it is at the top of the screen
- **Player List**: Bottom-left shows all players and current turn
- **Connection Status**: Top-right shows server connection

## 🔧 Configuration

### Change Server Port

Edit `server/server.js`:

```javascript
const PORT = process.env.PORT || 3000;  // Change 3000 to your port
```

### Change Server URL (for remote hosting)

Edit `client/MultiplayerClient.js` and `client/lobby.html`:

```javascript
const client = new MultiplayerClient('http://your-server-url:3000');
```

## 📋 MVP Features Implemented

### ✅ Server Features

- [x] Express + Socket.IO server
- [x] Session management (create/join/leave)
- [x] Turn validation (only current player can act)
- [x] Game state synchronization
- [x] Player connection/disconnection handling
- [x] Session cleanup (old sessions removed after 24h)

### ✅ Client Features

- [x] Multiplayer client module
- [x] Game lobby with player list
- [x] "Waiting for opponent..." overlay
- [x] Turn indicator badge
- [x] Connection status display
- [x] Player list panel
- [x] Automatic game state sync
- [x] Turn-based control locking

### ✅ Game Integration

- [x] Intercepts single-player actions
- [x] Syncs with server on every action
- [x] Disables controls when not player's turn
- [x] Real-time updates from server
- [x] Error handling and notifications

## 🧪 Testing

### Test Locally (Same Computer)

1. Open **two browser windows** (or use incognito mode)
2. Window 1: Create a session
3. Window 2: Join the session using the link
4. Both ready up and start the game

### Test on Network (Different Devices)

1. Find your local IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update client URLs to use your IP:
   ```javascript
   const client = new MultiplayerClient('http://192.168.1.100:3000');
   ```

3. Friends on same network can connect using:
   ```
   http://192.168.1.100:3000/multiplayer/client/lobby.html
   ```

## 🐛 Troubleshooting

### Server Won't Start

**Problem**: Port already in use

**Solution**: Change the port in `server.js` or kill the process using port 3000:

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### Can't Connect to Server

**Problem**: Firewall blocking connections

**Solution**: Allow Node.js through Windows Firewall or temporarily disable firewall for testing

### Game State Not Syncing

**Problem**: Client not receiving updates

**Solution**: 
1. Check browser console for errors (F12)
2. Verify server is running
3. Refresh the page and reconnect

### "Session not found" Error

**Problem**: Session expired or doesn't exist

**Solution**: Create a new session from the lobby

## 🔐 Security Notes (For Production)

This MVP is designed for **local/trusted network play**. For public internet deployment:

- [ ] Add authentication (user accounts)
- [ ] Implement rate limiting
- [ ] Add HTTPS/WSS encryption
- [ ] Validate all client inputs server-side
- [ ] Add CORS restrictions
- [ ] Implement proper session expiration
- [ ] Add database for persistent storage

## 📊 Server Monitoring

### Check Server Status

```
GET http://localhost:3000/api/health
```

Returns:
```json
{
  "status": "ok",
  "sessions": 2,
  "timestamp": 1698765432000
}
```

### Get Session Info

```
GET http://localhost:3000/api/sessions/{SESSION_ID}
```

## 🎯 Next Steps (Beyond MVP)

1. **Reconnection Handling**: Allow players to rejoin if disconnected
2. **Save/Resume**: Save game state and resume later
3. **Chat System**: In-game chat between players
4. **Spectator Mode**: Watch games in progress
5. **Matchmaking**: Automatic player matching
6. **Turn Timer**: Add time limits per turn
7. **Game History**: Record and replay games

## 💡 Tips

- **Session Codes**: 6-character codes (e.g., ABC123)
- **Max Players**: Configurable, default is 6
- **Turn Order**: Follows player join order
- **Disconnections**: During lobby - player removed; during game - marked as disconnected
- **Host Transfer**: If host leaves lobby, next player becomes host

## 📝 Development Commands

```powershell
# Install dependencies
npm install

# Start server (production)
npm start

# Start server (development with auto-reload)
npm run dev

# Check for updates
npm outdated

# Update dependencies
npm update
```

## 🌐 Deployment Options

### Local Network (Easiest)
- Run server on one computer
- Others connect via LAN IP

### Cloud Hosting (For Internet Play)
- **Heroku**: Free tier available
- **Railway**: Simple Node.js deployment
- **DigitalOcean**: More control
- **AWS/Azure**: Enterprise options

### Example: Deploy to Heroku

```bash
# Install Heroku CLI
# Create account at heroku.com

heroku login
cd multiplayer
git init
heroku create your-app-name
git add .
git commit -m "Initial commit"
git push heroku main
```

## 📞 Support

For issues or questions:
1. Check browser console (F12) for errors
2. Check server terminal for logs
3. Verify all files are in correct directories
4. Ensure Node.js version >= 14.0.0

## ✅ Checklist

Before playing:
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Server running (`npm start`)
- [ ] Firewall allows port 3000
- [ ] Browser supports WebSockets
- [ ] Multiple browser windows/devices for testing

---

**Enjoy your multiplayer Risk game! 🎲🎉**
