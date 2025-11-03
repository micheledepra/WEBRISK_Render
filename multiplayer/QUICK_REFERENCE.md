# 🎲 Risk Multiplayer - Quick Reference

## 🚀 Quick Start (3 Commands)

```powershell
cd multiplayer
npm install
.\start-server.ps1
```

Then open: `http://localhost:3000/multiplayer/client/index.html`

---

## 📁 File Locations

| Component | Path |
|-----------|------|
| **Launcher** | `multiplayer/client/index.html` |
| **Lobby** | `multiplayer/client/lobby.html` |
| **Game** | `multiplayer/client/multiplayer-game.html` |
| **Server** | `multiplayer/server/server.js` |

---

## 🎮 Player Flow

```
1. index.html      →  Create or Join
2. lobby.html      →  Wait & Ready Up
3. multiplayer-game.html  →  Play!
```

---

## 🔧 Common Configurations

### Change Port
**File:** `server/server.js`  
**Line:** 15  
```javascript
const PORT = process.env.PORT || 3000;
```

### Change Server URL
**Files:** 
- `client/MultiplayerClient.js` - Line 7
- `client/lobby.html` - Line 426
- `client/multiplayer-game.html` - Line 70

**Change:**
```javascript
'http://localhost:3000'  →  'http://YOUR_IP:3000'
```

### Max Players
**File:** `shared/constants.js`  
**Line:** 50  
```javascript
const MAX_PLAYERS = 6;  // 2-6
```

---

## 🧪 Testing Scenarios

### Scenario 1: Local (Same Computer)
1. Open Chrome window 1 → Create game
2. Open Chrome window 2 → Join game
3. Test turn-based gameplay

### Scenario 2: Network (Different Devices)
1. Get server IP: `ipconfig`
2. Update client URLs to use IP
3. Device 1 creates, Device 2 joins

### Scenario 3: Stress Test
1. Open 4-6 browser tabs
2. All join same session
3. Verify state syncs correctly

---

## 📊 Health Checks

### Server Status
```bash
curl http://localhost:3000/api/health
```

### Check Session
```bash
curl http://localhost:3000/api/sessions/ABC123
```

### Server Logs
Watch terminal for:
- `✅` Success events
- `📥` Incoming events
- `🎯` Actions processed
- `🔄` Turn changes
- `❌` Errors

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Change PORT in server.js |
| Can't connect | Check firewall, allow Node.js |
| Session not found | Create new session |
| State not syncing | Check browser console (F12) |
| Server won't start | Run `npm install` first |

---

## 🎯 Key URLs

| Purpose | URL |
|---------|-----|
| **Launcher** | `http://localhost:3000/multiplayer/client/index.html` |
| **Health** | `http://localhost:3000/api/health` |
| **Game Assets** | Served from project root |

---

## 📝 Session Codes

- **Format:** 6 uppercase characters (e.g., ABC123)
- **Generation:** Random (A-Z, 0-9)
- **Validity:** Until game ends or 24h timeout
- **Sharing:** Copy link button in lobby

---

## 🎨 UI Elements

### Turn Indicator (Top Center)
- 🎯 Green = Your turn
- ⏳ Yellow = Opponent's turn

### Connection Status (Top Right)
- 🟢 Connected
- 🔴 Disconnected

### Player List (Bottom Left)
- Shows all players
- Highlights current turn
- "You" badge for local player

### Waiting Overlay (Full Screen)
- Appears when not your turn
- Shows current player name
- Animated spinner

---

## 🔑 Key Features

✅ Real-time synchronization  
✅ Turn-based validation  
✅ Session management  
✅ 2-6 player support  
✅ Visual turn feedback  
✅ Connection monitoring  
✅ Error handling  

---

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "socket.io": "^4.6.1"
}
```

Install: `npm install`

---

## 🚀 Deployment Checklist

- [ ] Install Node.js (v14+)
- [ ] Run `npm install`
- [ ] Configure firewall
- [ ] Update client URLs (if remote)
- [ ] Start server
- [ ] Test connection
- [ ] Share URL with players

---

## 💡 Pro Tips

1. **Use Incognito** for local testing (separate sessions)
2. **Check Console** (F12) for detailed logs
3. **Copy Session Link** instead of typing code
4. **Ready Up** all players before starting
5. **Watch Terminal** for server events

---

## 📞 Quick Support

**Server not starting?**  
```powershell
npm install
node server/server.js
```

**Can't connect?**  
1. Check server is running
2. Verify URL is correct
3. Check firewall settings

**State not syncing?**  
1. Refresh page
2. Check console for errors
3. Verify WebSocket connection

---

## 🎊 Ready to Play!

1. Start server: `.\start-server.ps1`
2. Open browser: `localhost:3000/multiplayer/client/index.html`
3. Create or join game
4. Have fun! 🎲

---

**Quick Reference v1.0**  
For detailed docs, see: `README.md` & `ARCHITECTURE.md`
