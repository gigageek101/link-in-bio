# Link in Bio Website

A beautiful, responsive link in bio website with an automatic slideshow feature.

## Features

- 📸 Auto-playing slideshow with 9 images
- ✈️ IP-based location detection - Shows "Travelling to [visitor's city] tomorrow"
- 🔗 3 customizable link buttons
- 📱 Fully responsive design
- ✨ Modern, gradient UI with animations
- 🌐 Opens in default browser from Threads and other apps

## Setup Instructions

### 1. Add Your Images

Create an `images` folder in this directory and add 9 images named:
- `slide1.jpg`
- `slide2.jpg`
- `slide3.jpg`
- `slide4.jpg`
- `slide5.jpg`
- `slide6.jpg`
- `slide7.jpg`
- `slide8.jpg`
- `slide9.jpg`

**Note:** Images can be in JPG, PNG, or other formats. Just update the file extensions in `index.html` if needed.

### 2. Customize Your Profile

Open `index.html` and edit:
```html
<h1 class="profile-name">Your Name</h1>
<p class="profile-bio">Your bio description goes here</p>
```

### 3. Add Your Links

In `index.html`, find the  i links section and update:
```html
<a href="https://example.com/link1" class="link-button" target="_blank" rel="noopener noreferrer">
    <span class="link-icon">🔗</span>
    <span class="link-text">Platform Link 1</span>
</a>
```

Change:
- `href="..."` - your destination URL
- `link-icon` - emoji or icon
- `link-text` - button text

### 4. Customize Colors (Optional)

To change the color scheme, edit `styles.css`:

**Background gradient:**
```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**Button gradient:**
```css
.link-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## Location Detection

The site automatically detects visitors' locations using their IP address and displays "Travelling to [City Name] tomorrow" below the slideshow.

**How it works:**
- Uses free IP geolocation APIs (ipapi.co as primary, ip-api.com as backup)
- No API keys required
- Shows "Travelling to your city tomorrow" as fallback if detection fails
- Works automatically - no configuration needed

**Privacy Note:** Only city-level location is detected, no precise coordinates.

## Slideshow Settings

The slideshow automatically changes every 3 seconds. To adjust:

Open `script.js` and change:
```javascript
}, 3000); // Change to desired milliseconds (e.g., 5000 = 5 seconds)
```

## Deployment

### Option 1: GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all files
3. Enable GitHub Pages in repository settings
4. Your site will be at: `https://yourusername.github.io/repository-name`

### Option 2: Netlify (Free)
1. Drag and drop the entire folder to [Netlify](https://netlify.com)
2. Get instant deployment with HTTPS

### Option 3: Vercel (Free)
1. Upload to [Vercel](https://vercel.com)
2. Get instant deployment

### Option 4: Any Web Hosting
Upload all files to your web hosting via FTP or cPanel file manager.

## Browser Compatibility

Works with:
- ✅ Chrome/Edge
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Samsung Internet
- ✅ Opens from Threads, Instagram, Twitter, etc.

## File Structure

```
LinkInBio/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── script.js           # Slideshow functionality
├── README.md          # This file
└── images/            # Create this folder
    ├── slide1.jpg
    ├── slide2.jpg
    ├── slide3.jpg
    ├── slide4.jpg
    ├── slide5.jpg
    ├── slide6.jpg
    ├── slide7.jpg
    ├── slide8.jpg
    └── slide9.jpg
```

## Customization Tips

### Add More Links
Copy and paste a link button block in `index.html`:
```html
<a href="https://example.com" class="link-button" target="_blank" rel="noopener noreferrer">
    <span class="link-icon">✨</span>
    <span class="link-text">Your Link Text</span>
</a>
```

### Remove Profile Section
Delete or comment out the profile section in `index.html` if not needed.

### Change Slideshow Height
In `styles.css`, modify:
```css
.slideshow-wrapper {
    height: 400px; /* Change this value */
}
```

## Support

For questions or issues, refer to the code comments in each file.

## License

Free to use and modify for personal and commercial projects.

