# ZenFlow - Deployment Guide

## 🚀 Complete Step-by-Step Deployment

---

## STEP 1: Push to GitHub

### First-time setup:
```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: ZenFlow productivity & wellness app"

# Create repo on GitHub: github.com/new
# Name it: zenflow (or any name)
# Don't add README or .gitignore (you already have them)

# Link and push
git remote add origin https://github.com/YOUR_USERNAME/zenflow.git
git branch -M main
git push -u origin main
```

### Future updates:
```bash
git add .
git commit -m "Your change description"
git push
```

---

## STEP 2: Deploy on Vercel

### Option A: Vercel CLI (fastest)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (from project folder)
vercel

# Follow prompts:
# - Log in with GitHub
# - Link to existing project? No
# - Project name: zenflow
# - Directory: ./
# - Build command: npm run build
# - Output directory: out

# Production deploy:
vercel --prod
```

### Option B: Vercel Dashboard (easiest)
1. Go to **vercel.com** → Sign up with GitHub
2. Click **"Add New Project"**
3. Import your `zenflow` GitHub repo
4. Framework preset: **Next.js** (auto-detected)
5. Build settings (auto-filled):
   - Build Command: `npm run build`
   - Output Directory: `out`
6. Click **Deploy**
7. ✅ Live in ~60 seconds at `https://zenflow-xxx.vercel.app`

---

## STEP 3: Connect GitHub for Auto-Deployment

This is done automatically when you import via Vercel Dashboard!

Every time you `git push` to `main`:
- Vercel detects the push
- Builds your app automatically
- Deploys to production
- You get a notification

### Custom domain (optional):
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `zenflow.yourdomain.com`
3. Follow DNS instructions

---

## STEP 4: Install as Mobile App (PWA)

### 📱 Android (Chrome)
1. Open your Vercel URL in Chrome
2. Wait for the page to fully load
3. Tap the **menu (⋮)** → **"Add to Home screen"**
4. Or: Chrome shows an **"Install app"** banner at the bottom
5. Tap **Install** → App appears on home screen!

### 🍎 iPhone/iPad (Safari)
1. Open your Vercel URL in **Safari** (must be Safari)
2. Tap the **Share button (□↑)** at the bottom
3. Scroll down → **"Add to Home Screen"**
4. Tap **Add** → App appears on home screen!

### 💻 Desktop (Chrome/Edge)
1. Open your Vercel URL
2. Click the **install icon (⊕)** in the address bar
3. Or: Chrome menu → **"Install ZenFlow"**
4. Click **Install**

### Share with friends:
Just send them your Vercel URL! They follow the same steps above.
Example: `https://zenflow-abc123.vercel.app`

---

## STEP 5: Customize Your App

### Change app name/icon:
- Edit `public/manifest.json` → change `"name"` and `"short_name"`
- Replace icons in `public/icons/` (generate at realfavicongenerator.net)

### Add your name:
- Open the app → Settings → Enter your name

### Enable notifications:
- Settings → Notifications → Enable
- Allow when browser asks

---

## 📁 Project Structure

```
zenflow/
├── app/
│   ├── page.tsx              # Main app + routing
│   ├── layout.tsx            # HTML head, PWA meta
│   ├── globals.css           # Global styles
│   ├── lib/
│   │   ├── db.ts             # IndexedDB layer
│   │   ├── audio.ts          # Web Audio API engine
│   │   └── notifications.ts  # Push notifications
│   └── components/
│       ├── Dashboard.tsx     # Home dashboard
│       ├── TaskManager.tsx   # Full task system
│       ├── Notes.tsx         # Notes with reminders
│       ├── Calendar.tsx      # Dynamic calendar
│       ├── FocusTimer.tsx    # Pomodoro timer
│       ├── FrequencyTherapy.tsx  # Audio therapy
│       └── Settings.tsx      # App settings
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # App icons (all sizes)
├── next.config.ts            # Static export config
└── package.json
```

---

## 🔧 Tech Stack

| Feature | Technology |
|---------|-----------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS + CSS Variables |
| Data Storage | IndexedDB via `idb` library |
| Audio | Web Audio API (no external APIs) |
| Notifications | Web Notifications API |
| PWA | Service Worker + Web Manifest |
| Deployment | Vercel (free tier) |
| Backend | None required! |

---

## ✨ Features

- **Dashboard** — Stats, quick actions, priority tasks
- **Tasks** — Titles, descriptions, folders, tags, priorities, due dates, times, recurring, reminders, search, filters
- **Notes** — Rich notes with folder/tag organization and reminders
- **Calendar** — Monthly view synced with all tasks and note reminders
- **Focus Timer** — Pomodoro with custom durations, stats, session history
- **Frequency Therapy** — 19 audio presets using Web Audio API with binaural beats, visualizer, favorites, timers
- **Notifications** — Browser + audio alerts for tasks, notes, and timers
- **PWA** — Installable, offline-capable, native app-like experience

---

## 🆘 Troubleshooting

**Build fails on Vercel:**
- Check Node.js version: set to 18.x in Vercel settings

**Notifications not working:**
- Must be HTTPS (Vercel provides this)
- Click "Enable" in Settings tab
- Allow in browser popup

**Audio not playing:**
- Tap/click anywhere first (browser requires user interaction)
- Try iOS: use headphones for best binaural effect

**PWA not installing on iOS:**
- Must use Safari (not Chrome on iOS)
- Site must be HTTPS
