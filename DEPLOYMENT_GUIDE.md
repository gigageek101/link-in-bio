# 🚀 Deployment Guide - GitHub + Vercel

Your website is ready to deploy! Follow these steps:

---

## 📋 Step 1: Push to GitHub

### 1.1 Create a New Repository on GitHub

1. Go to **[github.com](https://github.com)** and log in
2. Click the **"+"** button (top right) → **"New repository"**
3. Fill in:
   - **Repository name**: `link-in-bio` (or any name you like)
   - **Description**: "Link in bio website with slideshow"
   - **Visibility**: ✅ Public (or Private if you prefer)
   - ❌ **Don't** check "Add README" or any other files
4. Click **"Create repository"**

### 1.2 Copy the Repository URL

After creating, GitHub will show you setup commands. Copy the **repository URL** that looks like:
```
https://github.com/YOUR-USERNAME/link-in-bio.git
```

### 1.3 Push Your Code

**Open your terminal and run these commands:**

```bash
cd /Users/alexanderposch/Desktop/LinkInBio

# Add GitHub repository as remote
git remote add origin https://github.com/YOUR-USERNAME/link-in-bio.git

# Push your code
git branch -M main
git push -u origin main
```

**Replace `YOUR-USERNAME` with your actual GitHub username!**

### 1.4 Verify

Refresh your GitHub repository page - you should see all your files uploaded! ✅

---

## 🌐 Step 2: Deploy to Vercel

### 2.1 Sign Up / Log In to Vercel

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"** or **"Log In"**
3. **Choose "Continue with GitHub"** (this is important!)
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Repository

1. After logging in, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"link-in-bio"** (or whatever you named it)
4. Click **"Import"**

### 2.3 Configure Project (Usually No Changes Needed)

Vercel will auto-detect your project settings:
- **Framework Preset**: None (or Other)
- **Root Directory**: `./`
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)

Just click **"Deploy"**! 🚀

### 2.4 Wait for Deployment

- Vercel will build and deploy your site (takes ~30 seconds)
- You'll see a success screen with confetti! 🎉

### 2.5 Get Your Live URL

Your website will be live at:
```
https://link-in-bio-xxx.vercel.app
```

Vercel will show you the exact URL. Click on it to see your live website!

---

## 🎯 Step 3: Test Your Live Website

Visit your Vercel URL and test:

✅ **Slideshow** - Should auto-play with videos and images  
✅ **Age verification** - Click first link, modal should appear  
✅ **Deep linking** - After clicking "I'm 18+", OnlyFans should open in default browser  
✅ **Location detection** - "Travelling to [City]" should show your city  
✅ **All 3 links** - Should work and open in default browser  

---

## 📱 Step 4: Share Your Link

Now you can share your Vercel URL anywhere:
- 📷 Instagram bio
- 🧵 Threads bio
- 🐦 Twitter/X bio
- 👻 Snapchat
- 💬 Anywhere!

The deep linking will ensure links open in the default browser, even when clicked from Instagram/Threads in-app browsers!

---

## 🔄 Updating Your Website

Whenever you want to update your website:

```bash
cd /Users/alexanderposch/Desktop/LinkInBio

# Make your changes to files
# Then commit and push:

git add .
git commit -m "Update slideshow images"
git push
```

**Vercel will automatically redeploy** your site within seconds! ⚡

---

## 🎨 Optional: Custom Domain

Want a custom domain like `allison.com` instead of `vercel.app`?

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow Vercel's instructions to update DNS

---

## ✅ Quick Checklist

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Connected Vercel to GitHub
- [ ] Deployed project on Vercel
- [ ] Tested live website
- [ ] Added URL to Instagram/Threads bio

---

## 🆘 Troubleshooting

### "Permission denied" when pushing to GitHub
- You may need to set up SSH keys or use a Personal Access Token
- See: https://docs.github.com/en/authentication

### Videos not loading on live site
- Check file sizes (keep under 10MB)
- Make sure videos are in the `images` folder
- Try different video format (.mp4 works best)

### Location not detecting
- This is normal for the first few seconds
- IP geolocation APIs need time to respond
- Some VPNs may block location detection

---

## 🎉 You're Done!

Your link in bio website is now live and accessible worldwide!

**Your deployment URLs:**
- GitHub: `https://github.com/YOUR-USERNAME/link-in-bio`
- Vercel: `https://your-project.vercel.app`

Enjoy! 🚀

