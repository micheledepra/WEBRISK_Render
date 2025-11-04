# Historical Game Data Persistence

## Overview

This implementation provides **backend-based historical game data persistence** for the Risk dashboard, ensuring that game data and analytics are maintained even when the dashboard tab is closed and reopened.

## Architecture

### Components

1. **GameDataStore Module** (`multiplayer/server/GameDataStore.js`)
   - Manages persistent storage of game snapshots
   - Stores data both in-memory and on disk
   - Provides APIs for retrieving historical data
   - Automatically cleans up old files

2. **Backend API Endpoints** (`multiplayer/server/server.js`)
   - `POST /api/game-data/save` - Save game data snapshot
   - `GET /api/game-data/history` - Get all historical game data
   - `GET /api/game-data/:gameId/history` - Get history for specific game
   - `GET /api/game-data/:gameId/latest` - Get latest snapshot for game
   - `GET /api/game-data/stats` - Get storage statistics

3. **Frontend Integration**
   - **game.html**: Automatically sends game data to backend after each update
   - **dashboard.html**: Loads historical data from backend on page load

## Features

### ✅ Historical Data Persistence
- Game data is saved to the backend server after every game state update
- Data persists across browser sessions and tab closures
- Supports up to 100 historical game snapshots

### ✅ Automatic Synchronization
- Game sends data to backend automatically (no manual intervention needed)
- Dashboard loads historical data on startup
- Falls back to localStorage if backend is unavailable

### ✅ Dual Storage Strategy
- **Backend Storage**: Persistent across sessions and devices
- **localStorage**: Fast local access and fallback mechanism

## Usage

### Starting the Server

```bash
# Install dependencies (first time only)
npm install

# Start the server
npm start
```

The server will run on **http://localhost:3000**

### Playing the Game

1. Open `game.html` in your browser
2. Play the game normally
3. Game data is automatically saved to backend every update

### Viewing the Dashboard

1. Open `Stats/dashboard.html` in your browser (can be in a separate tab/window)
2. Historical data loads automatically from backend
3. Dashboard shows all historical game data, even after closing and reopening

### Without the Server

If the backend server is not running:
- Game still works normally
- Dashboard uses localStorage only
- Data persists within the same browser session
- A warning appears in console: "Backend not available for data persistence"

## API Documentation

### Save Game Data
```http
POST /api/game-data/save
Content-Type: application/json

{
  "gameId": "risk-1234567890",
  "gameData": {
    "timestamp": 1234567890,
    "phase": "attack",
    "turnNumber": 5,
    "players": {...},
    "territories": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "gameId": "risk-1234567890",
  "timestamp": 1234567890
}
```

### Get Historical Data
```http
GET /api/game-data/history?limit=100
```

**Response:**
```json
{
  "success": true,
  "count": 50,
  "games": [
    {
      "gameId": "risk-1234567890",
      "timestamp": 1234567890,
      "savedAt": "2025-11-04T12:00:00.000Z",
      "phase": "attack",
      "players": {...},
      "territories": {...}
    },
    ...
  ]
}
```

### Get Game Statistics
```http
GET /api/game-data/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSnapshots": 150,
    "uniqueGames": 12,
    "activeGamesInMemory": 3,
    "dataDirectory": "/path/to/data/game-history"
  }
}
```

## Data Storage

### Location
Game history is stored in: `data/game-history/`

### File Format
Files are named: `game_{gameId}_{timestamp}.json`

Example: `game_risk-1699025600000_1699025600123.json`

### Automatic Cleanup
- Keeps the most recent **100 game snapshots**
- Older files are automatically deleted
- Can be configured in `GameDataStore.js` (`maxHistoricalGames`)

## Configuration

### Change Maximum Historical Games

Edit `multiplayer/server/GameDataStore.js`:

```javascript
constructor(dataDir = path.join(__dirname, '../../data/game-history')) {
  // ...
  this.maxHistoricalGames = 100; // Change this value
}
```

### Change Data Directory

Pass a custom directory when initializing:

```javascript
// In server.js
const gameDataStore = new GameDataStore('/path/to/custom/directory');
```

### Backend URL Configuration

The frontend auto-detects the backend URL:
- **localhost**: Uses `http://localhost:3000`
- **Production**: Uses `window.location.origin`

To override, edit the `backendUrl` in:
- `game.html` - `sendGameDataToBackend()` function
- `Stats/dashboard.html` - `loadHistoricalDataFromBackend()` function

## Benefits

### ✅ Data Persistence
- Historical data survives browser closures
- Dashboard can be closed and reopened without losing data
- Multiple dashboard instances can view the same data

### ✅ Cross-Device Access
- Game data accessible from any device (when using deployed server)
- Centralized data storage

### ✅ Analytics & History
- Track game progression over time
- Compare multiple games
- Historical charts and statistics

### ✅ Graceful Degradation
- Works without backend (falls back to localStorage)
- No impact on game functionality if server is down
- Automatic reconnection when server becomes available

## Troubleshooting

### Dashboard shows "No Data"
1. Check if the server is running: `npm start`
2. Check console for errors
3. Verify game data exists: `GET http://localhost:3000/api/game-data/history`

### Data not saving to backend
1. Check server console for errors
2. Verify game is sending data (check browser console)
3. Check network tab for failed API calls

### Old data not loading
1. Clear browser cache
2. Restart the server
3. Check `data/game-history/` directory exists and has files

### Server won't start
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Start server
npm start
```

## Testing

### Test Backend Connection
```bash
# Check server health
curl http://localhost:3000/api/health

# Check game data stats
curl http://localhost:3000/api/game-data/stats
```

### Test in Browser Console
```javascript
// Check if backend is accessible
fetch('http://localhost:3000/api/game-data/stats')
  .then(r => r.json())
  .then(console.log);
```

## Future Enhancements

Potential improvements:
- Database integration (PostgreSQL, MongoDB)
- User authentication and game ownership
- Game replay functionality
- Real-time multiplayer synchronization
- Cloud storage integration
- Data export/import features
- Advanced analytics and ML insights

## Support

For issues or questions:
1. Check server logs in terminal
2. Check browser console for errors
3. Verify API endpoints are responding
4. Review this documentation

## Summary

This implementation provides robust, persistent storage for game data with:
- ✅ Automatic backend synchronization
- ✅ Historical data retention
- ✅ Graceful fallback to localStorage
- ✅ Simple API for data access
- ✅ Zero configuration required for basic usage

The dashboard now maintains full historical data persistence even when closed and reopened! 🎉
