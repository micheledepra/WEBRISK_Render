# 🔧 Backend Connection Troubleshooting Guide

## Issue: Dashboard shows "Failed to load resource: 404"

### ✅ Solution: Server is Now Running!

The backend server is now running successfully on **http://localhost:3000**

### What Was Fixed

1. **Port Conflict Resolved**: Port 3000 was already in use by another process
2. **Backend URL Detection Improved**: Dashboard now correctly detects localhost regardless of the port your Live Server is using
3. **Server Restarted**: The backend is now running and ready to accept connections

---

## How to Test

### 1. **Refresh the Dashboard**
   - Reload your browser tab showing `Stats/dashboard.html`
   - You should now see in the console:
     ```
     📡 Attempting to connect to backend at: http://localhost:3000
     ✅ Loaded X historical game snapshots from backend
     ✅ Backend Connected
     ```

### 2. **Check Server Status**
   - Open: http://localhost:3000/api/health
   - You should see JSON response:
     ```json
     {
       "status": "ok",
       "sessions": 5,
       "timestamp": 1730000000000,
       "uptime": 123,
       "environment": "development"
     }
     ```

### 3. **Test Data Persistence**
   - Open `test-historical-persistence.html`
   - Click "Check Backend Status" → Should show "Online ✅"
   - Click "Save Test Data" → Should succeed
   - Click "Load All History" → Should show saved data

---

## Common Issues & Solutions

### ❌ Port 3000 Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```

**Solution:**
```powershell
# Kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Restart server
cd multiplayer/server
npm start
```

### ❌ Dashboard Shows 404 Error

**Symptoms:**
```
Failed to load resource: the server responded with a status of 404
```

**Possible Causes:**
1. Server not running on port 3000
2. Wrong backend URL

**Solution:**
1. Check if server is running: http://localhost:3000/api/health
2. If not running, start it: `npm start`
3. Refresh dashboard after server is running

### ❌ CORS Errors

**Symptoms:**
```
Access to fetch has been blocked by CORS policy
```

**Solution:**
The server is already configured to allow CORS from all origins. If you still see this error:
1. Ensure you're accessing dashboard via http://localhost (any port)
2. Check browser console for specific error details
3. Clear browser cache and reload

---

## Server Management

### Start Server
```bash
npm start
```

### Stop Server
Press `Ctrl+C` in the terminal running the server

### Restart Server
```powershell
# Kill and restart
cd "C:\Users\mchld\OneDrive\Desktop\OOO\Risk\mvp-stars2\multiplayer\server"
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
npm start
```

### Check Server Status
```bash
# In browser
http://localhost:3000/api/health

# Or in PowerShell
curl http://localhost:3000/api/health
```

---

## Verification Checklist

✅ Server running: Check console shows "🎲 Multiplayer Risk Game Server Running"
✅ Port 3000 accessible: Open http://localhost:3000/api/health
✅ Dashboard connects: Console shows "✅ Backend Connected"
✅ Data saves: Game console shows "✅ Game data saved to backend"
✅ History loads: Dashboard shows historical data after reload

---

## Understanding the Setup

### Server Architecture
```
Dashboard (Any Port via Live Server)
         ↓
  Always connects to
         ↓
Backend Server (Port 3000)
         ↓
Saves data to disk
         ↓
data/game-history/
```

### Why Port 3000?
- The backend server runs on **port 3000** by default
- Your Live Server can run on any port (5500, 5501, etc.)
- The dashboard always connects to port 3000 for backend data
- This is configured in the code: `http://localhost:3000`

### Live Server vs Backend Server
- **Live Server (port 5501)**: Serves HTML/CSS/JS files to browser
- **Backend Server (port 3000)**: Handles API requests and data storage
- Both can run simultaneously - they serve different purposes

---

## What's Running Now

Based on the terminal output, your backend server is:
- ✅ Running on port 3000
- ✅ Serving static files
- ✅ GameDataStore initialized
- ✅ Socket.IO enabled
- ✅ Session persistence active (5 sessions restored)
- ✅ Ready to accept connections

---

## Next Steps

1. **Refresh your dashboard** - The connection should now work!
2. **Test the functionality**:
   - Play some turns in `game.html`
   - Check console for "✅ Game data saved to backend"
   - Open dashboard and verify historical data loads
   - Close and reopen dashboard - data should persist!

3. **If still having issues**:
   - Check browser console for specific error messages
   - Verify server is still running: http://localhost:3000/api/health
   - Check the server terminal for any error messages

---

## Support

If you continue to have issues:
1. Check server terminal output for errors
2. Check browser console for connection errors
3. Verify both servers are running:
   - Live Server (for HTML files)
   - Backend Server on port 3000 (for API)
4. Review this troubleshooting guide

---

## Summary

✅ **Problem**: Port conflict and 404 errors
✅ **Solution**: Server restarted on port 3000
✅ **Status**: Backend is now running and ready!

**Your dashboard should now connect successfully and load historical game data! 🎉**
