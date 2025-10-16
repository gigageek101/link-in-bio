# Telegram Tracking Setup Guide

Your Telegram tracking is now fully integrated! Follow these steps to activate it:

## 🤖 Your Bot Details

- **Bot Token:** `8254524001:AAHnCpHtIJnlORLjmynTblrQiAhQBl9MZ5E`
- **Chat ID:** `-4979182297` (Group chat)

## 🚀 Setup Steps

### 1. Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `link-in-bio`
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

**Variable 1:**
- **Name:** `TELEGRAM_BOT_TOKEN`
- **Value:** `8254524001:AAHnCpHtIJnlORLjmynTblrQiAhQBl9MZ5E`
- **Environment:** Select all (Production, Preview, Development)

**Variable 2:**
- **Name:** `TELEGRAM_CHAT_ID`
- **Value:** `-4979182297`
- **Environment:** Select all (Production, Preview, Development)

5. Click **Save**

### 2. Redeploy Your Site

After adding the environment variables:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**

OR just push new code (which you'll do in a moment)

---

## 📊 What You'll Receive

### 🔔 Page View Notification
Every time someone visits your page:
```
🔔 New Visitor!

📍 Location: Bangkok, Thailand
📱 Device: iPhone
🌐 Browser: Instagram (in-app)
🔗 From: Instagram 📸
⏰ Time: Oct 16, 2025, 02:30 PM
```

### ⚠️ Age Warning Shown
When someone clicks the OnlyFans link:
```
⚠️ Age Warning Shown

📍 Visitor from: Bangkok, Thailand
⏰ Time: 02:31 PM
```

### 🎯 Link Click Notification
When someone clicks any link:
```
🎯 Link Clicked!

💗 Link: My Exclusive Content 🥰
📍 Visitor from: Bangkok, Thailand
✅ Age verified: Yes
⏰ Time: 02:31:45 PM
🔗 URL: https://onlyfans.com/allison-gray/c35
```

### 🎯 Other Link Clicks
```
🎯 Link Clicked!

✈️ Link: Send me a message on Telegram 💌
📍 Visitor from: Los Angeles, USA
⏰ Time: 03:15:22 PM
🔗 URL: https://t.me/allisonsworld
```

---

## 🎯 What's Tracked

### For Each Visitor:
- ✅ **Location**: City, Country (from IP)
- ✅ **Device**: iPhone, Android, iPad, Desktop
- ✅ **Browser**: Chrome, Safari, Instagram (in-app), Threads (in-app), etc.
- ✅ **Platform**: Threads, Instagram, Facebook, X/Twitter, or Direct
- ✅ **Time**: Exact timestamp in UTC

### For Each Link Click:
- ✅ **Which link** was clicked
- ✅ **Visitor location**
- ✅ **Age verification** status (for OnlyFans)
- ✅ **Exact click time**
- ✅ **Full URL** they're going to

---

## 🔧 Technical Details

### Files Created/Modified:

1. **`/api/track.js`** - Vercel serverless function
   - Handles tracking requests
   - Sends formatted messages to Telegram
   - Secure (uses environment variables)

2. **`script.js`** - Updated with tracking functions
   - `trackPageView()` - Tracks page visits
   - `trackLinkClick()` - Tracks link clicks
   - `trackAgeWarning()` - Tracks age warning shown
   - `handleLinkClick()` - Handler for Telegram/X links

3. **`index.html`** - Updated link handlers
   - All links now pass link names for tracking
   - Age verification integrated with tracking

---

## 🧪 Testing

After deployment, test by:
1. Open your link: `https://www.searchformylinks.com/allisonsundress`
2. Check your Telegram group for the page view notification
3. Click any link
4. You should receive instant notifications!

---

## 📱 Group Chat

Your notifications go to your **group chat** (Chat ID: -4979182297).
- All members of the group will see the notifications
- Bot must be added to the group and have permission to send messages

---

## 🔐 Security

- ✅ Bot token stored in Vercel environment variables (secure)
- ✅ Never exposed in client-side code
- ✅ API endpoint only accepts POST requests
- ✅ No sensitive data logged

---

## 🎉 You're All Set!

Once you:
1. Add the environment variables to Vercel
2. Push this code (which will auto-deploy)

You'll start receiving **instant Telegram notifications** for every visitor and click! 🚀

