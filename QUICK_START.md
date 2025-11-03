# 🚀 Quick Start - Deploy in 5 Minutes

## ✅ Already Done For You

I've configured:
- ✅ `package.json` with deployment scripts
- ✅ `.gitignore` to exclude unnecessary files
- ✅ Server with admin dashboard at `/admin`
- ✅ Auto-detection of production/development URLs
- ✅ Health check endpoint at `/api/health`

---

## 📝 Your 5-Step Checklist

### □ Step 1: Install Dependencies

```powershell
npm install
cd multiplayer
npm install
cd ..
```

### □ Step 2: Test Locally (Optional)

```powershell
npm start
```
Visit: http://localhost:3000/admin

---

### □ Step 3: Push to GitHub

**New repo?**
```powershell
git init
git add .
git commit -m "Setup multiplayer deployment"
git remote add origin https://github.com/YOUR_USERNAME/risk-multiplayer-game.git
git branch -M main
git push -u origin main
```

**Existing repo?**
```powershell
git add .
git commit -m "Setup multiplayer deployment"
git push
```

---

### □ Step 4: Deploy to Render

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. Fill in:
   ```
   Name: risk-multiplayer
   Environment: Node
   Build Command: npm install && cd multiplayer && npm install
   Start Command: npm start
   Instance Type: Free
   ```
5. Click **"Create Web Service"**
6. Wait 2-5 minutes ⏳

---

### □ Step 5: Share & Play!

Your URL: `https://risk-multiplayer.onrender.com`

**Share with friends:**
```
🎲 Let's play Risk!
https://risk-multiplayer.onrender.com/multiplayer/client/lobby.html
```

**Check admin panel:**
```
https://risk-multiplayer.onrender.com/admin
```

---

## 🎮 How to Play

**Host:**
1. Go to lobby → Create New Game
2. Share session code with friends

**Players:**
1. Go to lobby → Join Existing Game
2. Enter session code
3. Click Ready

**Start:**
- Host clicks "Start Game" when everyone is ready!

---

## 💡 Pro Tips

- **First connection takes 30-60 seconds** (free tier wakes up)
- **Use UptimeRobot** to keep server awake (optional)
- **Admin panel** shows all active games
- **Auto-deploys** when you push to GitHub

---

## 🆘 Need Help?

See full guide: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)

**Common Issues:**
- Can't connect? Wait 60 seconds for cold start
- Need to update? Just `git push` - auto-deploys!
- Want to upgrade? $7/month removes cold starts

---

**You're ready to go! 🎲🌍**
