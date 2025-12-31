# 💪 Pushup Tracker - Simple & Dark

A super simple, dark-mode pushup tracker for your phone. One tap to mark your daily pushups as done!

## ✨ Features

- **One-Tap Tracking**: Just tap "Done for Today" - no typing needed!
- **Auto Date**: Shows today's date automatically based on your location
- **Dark Mode**: Easy on the eyes
- **Streak Tracking**: See how many days in a row you've completed
- **Daily Reminder**: Get notified at 8 PM if you haven't done your pushups
- **Works Offline**: All data stored locally on your phone
- **Installable**: Add to home screen like a real app

## 🚀 Quick Start

### 1. Start the Server

```bash
cd /Users/bjoni/Desktop/pushup-tracker/app
python3 -m http.server 8080
```

### 2. Open on Your Phone

**Find your computer's IP:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On your phone (same WiFi):**

- Open browser
- Go to: `http://YOUR_IP:8080/pages/index.html`
- Example: `http://192.168.1.100:8080/pages/index.html`

### 3. Install on Home Screen

**iPhone:**

1. Tap Share button
2. "Add to Home Screen"
3. Tap "Add"

**Android:**

1. Tap menu (⋮)
2. "Add to Home Screen" or "Install App"
3. Tap "Install"

### 3. Enable Notifications (Optional)

1. Open the app
2. Scroll to "Daily Reminder"
3. Tap "Enable Notifications"
4. Allow when prompted

## 📱 How to Use

1. **Open the app** - You'll see today's date
2. **Did your pushups?** - Tap "✓ Done for Today"
3. **That's it!** - You'll see "Great job! See you tomorrow 💪"
4. **Made a mistake?** - Tap "Undo"

## 🎯 Daily Goal

- Minimum: **20 pushups per day**
- One tap marks it as done
- Get reminded at **8 PM** if you haven't completed it
- Build your streak! 🔥

## 📊 Track Your Progress

- **Day Streak**: Consecutive days completed
- **Total Days**: All days you've completed
- **History**: See all your past completions

## 💾 Data Storage

- All data saved locally in SQLite database
- No internet required
- Data persists even when offline
- Stored in your browser's local storage

## 🔔 Notifications

- **Daily Reminder**: 8 PM if goal not met
- **Congratulations**: When you complete your goal
- **Works in background**: Even when app is closed (if installed)

## 🌐 Deploy Online (Optional)

### GitHub Pages (Free)

1. Create GitHub repo
2. Upload `app` folder
3. Enable GitHub Pages
4. Access from anywhere!

### Netlify (Free, Easiest)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop `app` folder
3. Get instant URL

## 🛠️ Technical Details

- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: SQL.js (SQLite in browser)
- **Storage**: LocalStorage
- **PWA**: Service Worker for offline
- **Notifications**: Web Notifications API
- **Dark Mode**: Pure CSS

## 📁 Project Structure

```
pushup-tracker/
└── app/
    ├── pages/index.html      # Main app
    ├── scripts/
    │   ├── app.js            # App logic (simplified)
    │   ├── db.js             # Database
    │   └── notifications.js  # Notifications
    ├── styles/main.css       # Dark mode styling
    ├── icons/                # App icons
    ├── manifest.json         # PWA config
    └── service-worker.js     # Offline support
```

## 🎨 Customization

Want to change something?

**Daily Goal**: Edit `app/pages/index.html` - change "20" to your goal

**Notification Time**: Edit `app/scripts/notifications.js` - change `hour: 20` (8 PM)

**Colors**: Edit `app/styles/main.css` - change CSS variables at top

## 💡 Tips

1. **Install on home screen** for best experience
2. **Enable notifications** to stay on track
3. **Check your streak** to stay motivated
4. **Use Undo** if you tap by mistake
5. **Works offline** - no internet needed!

## 🐛 Troubleshooting

### Can't connect from phone?

- Same WiFi network?
- Firewall blocking?
- Try computer's IP address

### Notifications not working?

- Enabled in app?
- Browser permissions granted?
- Installed as PWA?

### Data not saving?

- Not in Private/Incognito mode?
- LocalStorage enabled?

## 🎉 That's It!

Super simple. No typing. No complexity. Just:

1. Open app
2. Tap "Done"
3. See "See you tomorrow 💪"

**Keep pushing! 💪**

---

Made with ❤️ for simple fitness tracking
