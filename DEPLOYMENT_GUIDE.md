# 🚀 Deployment Guide - Risk Multiplayer Game

## What I've Done For You ✅

I've automated most of the deployment setup! Here's what's been configured:

### 1. ✅ Updated Root `package.json`
- Added deployment scripts (`npm start`)
- Added Socket.IO and Express dependencies
- Set Node.js version requirement (14+)
- Updated repository information

### 2. ✅ Created `.gitignore`
- Excludes `node_modules/` from Git
- Ignores log files and environment variables
- Prevents IDE files from being committed

### 3. ✅ Enhanced Server for Production
- Added environment variable support (`process.env.PORT`)
- Created beautiful admin dashboard at `/admin`
- Added health check endpoint at `/api/health`
- Server now binds to `0.0.0.0` (required for Render)
- Added automatic public URL detection

### 4. ✅ Updated Multiplayer Client
- Auto-detects production vs development URLs
- Uses `localhost:3000` in development
- Uses current domain in production (automatic!)
- No manual URL changes needed

---

## 📝 What YOU Need to Do (5 Simple Steps)

### Step 1: Install Dependencies Locally

Open PowerShell in your project folder and run:

```powershell
# Install root dependencies
npm install

# Install multiplayer server dependencies
cd multiplayer
npm install
cd ..
```

### Step 2: Test Locally (Optional but Recommended)

```powershell
# Start the server
npm start
```

Then open your browser to:
- **Admin Panel**: http://localhost:3000/admin
- **Game Lobby**: http://localhost:3000/multiplayer/client/lobby.html

Press `Ctrl+C` to stop the server when done testing.

---

### Step 3: Push to GitHub

#### 3.1 Initialize Git (if not already done)

```powershell
git init
git add .
git commit -m "Setup multiplayer deployment configuration"
```

#### 3.2 Connect to GitHub

**Option A: If you already have a remote:**
```powershell
git push
```

**Option B: If this is a new repo:**

1. Go to [GitHub.com](https://github.com)
2. Click **"New Repository"** (or the + icon)
3. Name it: `risk-multiplayer-game` (or any name you want)
4. **Don't** initialize with README
5. Click **"Create repository"**

Then run these commands (replace YOUR_USERNAME):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/risk-multiplayer-game.git
git branch -M main
git push -u origin main
```

---

### Step 4: Deploy to Render.com

#### 4.1 Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with **GitHub** (recommended for easier setup)

#### 4.2 Create Web Service

1. After signing in, click **"New +"** (top right)
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select your `risk-multiplayer-game` repository
   - If you don't see it, click "Configure account" to grant access

#### 4.3 Configure the Service

Fill in these settings:

```
Name: risk-multiplayer
  (or any name you want - this becomes part of your URL)

Environment: Node

Region: Choose closest to you
  (e.g., Oregon USA, Frankfurt Europe, Singapore Asia)

Branch: main

Build Command: npm install && cd multiplayer && npm install

Start Command: npm start

Instance Type: Free
  (Perfect for playing with friends!)
```

#### 4.4 Advanced Settings (Optional)

Scroll down and click **"Advanced"**. You can add:

**Environment Variables (optional):**
- Key: `NODE_ENV`
- Value: `production`

**Auto-Deploy:** YES (deploys automatically when you push to GitHub)

#### 4.5 Deploy!

Click **"Create Web Service"** at the bottom.

Render will now:
1. ✅ Clone your repository
2. ✅ Install all dependencies
3. ✅ Start your server
4. ✅ Assign a public URL

**Wait 2-5 minutes** for the first deployment to complete.

---

### Step 5: Get Your Game URL & Share!

#### 5.1 Find Your URL

Once deployed, Render gives you a URL like:
```
https://risk-multiplayer.onrender.com
```

You can find it at the top of your Render dashboard.

#### 5.2 Test Your Deployment

Visit these URLs in your browser:

1. **Admin Panel**: `https://risk-multiplayer.onrender.com/admin`
   - See server status, active games, connected players

2. **Game Lobby**: `https://risk-multiplayer.onrender.com/multiplayer/client/lobby.html`
   - Create a game and get a session code

3. **Health Check**: `https://risk-multiplayer.onrender.com/api/health`
   - Should show `{"status":"ok",...}`

#### 5.3 Share With Friends

Send them this message:

```
🎲 Let's play Risk!

Go to: https://risk-multiplayer.onrender.com/multiplayer/client/lobby.html

I'll create a game and share the session code with you!
```

---

## 🎮 How to Play Multiplayer

### Host (You):

1. Go to the lobby URL
2. Click **"Create New Game"**
3. Enter your name
4. Choose number of players (2-6)
5. Share the **Session Code** with friends
6. Wait for everyone to join
7. Click **"Start Game"** when all players are ready

### Players (Your Friends):

1. Go to the same lobby URL
2. Click **"Join Existing Game"**
3. Enter their name
4. Enter the **Session Code** you shared
5. Click **"Ready"**
6. Wait for host to start

---

## 🔧 Important Notes

### Free Tier Limitations

Render's free tier:
- ✅ **750 hours/month** (enough for 24/7 uptime!)
- ⚠️ **Spins down after 15 minutes** of inactivity
- ⚠️ Takes **30-60 seconds to wake up** (cold start)

**What this means:**
- First player might see "Connecting..." for 30-60 seconds
- After that, everyone connects instantly
- Game stays awake while people are playing

### Keep Server Awake (Optional)

To avoid cold starts, use [UptimeRobot](https://uptimerobot.com) (free):

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create a new monitor:
   - Type: HTTP(s)
   - URL: `https://risk-multiplayer.onrender.com/api/health`
   - Interval: 5 minutes
3. It will ping your server every 5 minutes to keep it awake!

---

## 🔄 Updating Your Game

Made changes to your code? Deploy updates easily:

```powershell
# 1. Make your changes
# 2. Commit them
git add .
git commit -m "Added new feature"

# 3. Push to GitHub
git push

# 4. Render automatically deploys! ✨
```

Check the Render dashboard to see deployment progress.

---

## 📊 Monitoring Your Server

### View Logs

In your Render dashboard:
1. Click on your service
2. Go to **"Logs"** tab
3. See real-time server output
4. Debug any issues

### Check Status

Visit your admin panel anytime:
```
https://risk-multiplayer.onrender.com/admin
```

You can see:
- Server uptime
- Active game sessions
- Connected players
- Session details

---

## 🆘 Troubleshooting

### "Application failed to respond"

**Solution:**
1. Check Render logs for errors
2. Verify the start command is: `npm start`
3. Make sure dependencies installed correctly

### "Cannot connect to server"

**Solution:**
1. Check if server is running (visit `/api/health`)
2. Wait 60 seconds for cold start
3. Check browser console for errors

### "Session not found"

**Solution:**
- Sessions expire after 24 hours of inactivity
- Create a new game session

### Players can't join

**Solution:**
1. Make sure everyone uses the EXACT same URL
2. Check session code is correct (case-sensitive)
3. Verify game hasn't started yet

---

## 💰 Upgrade Options (Optional)

If your game becomes popular:

**Render Starter Plan - $7/month:**
- ✅ No cold starts (always on)
- ✅ Faster response times
- ✅ Priority support

**To upgrade:**
1. Go to Render dashboard
2. Click your service
3. Settings → Instance Type → Starter

---

## 🎉 You're All Set!

Your deployment is configured and ready to go. Just follow the 5 steps above to:
1. ✅ Install dependencies
2. ✅ Test locally (optional)
3. ✅ Push to GitHub
4. ✅ Deploy to Render
5. ✅ Share with friends!

**Questions?** Check the Render docs or feel free to ask!

**Have fun conquering the world! 🌍🎲**

---

## 📞 Quick Reference

| What | URL |
|------|-----|
| Admin Panel | `https://YOUR-APP.onrender.com/admin` |
| Game Lobby | `https://YOUR-APP.onrender.com/multiplayer/client/lobby.html` |
| Health Check | `https://YOUR-APP.onrender.com/api/health` |
| Render Dashboard | [https://dashboard.render.com](https://dashboard.render.com) |
| GitHub Repo | [https://github.com/YOUR_USERNAME/risk-multiplayer-game](https://github.com) |

Replace `YOUR-APP` with your actual Render app name!
