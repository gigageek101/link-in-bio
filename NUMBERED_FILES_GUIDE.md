# 📁 Numbered Files System

Your slideshow now uses numbered files (0, 1, 2, 3, etc.) for easy management!

## 📋 Current Files

Your slideshow currently has:
- **0.MOV** (video)
- **1.png** (image)
- **2.jpg** (image)
- **3.jpg** (image)
- **4.jpg** (image)
- **5.jpg** (image)

## 🎬 Video Behavior

### Videos:
- ✅ Play **once** through (no loop, no sound)
- ✅ Automatically advance to next slide when video ends
- ✅ Keep the 3-image overlapping effect

### Images:
- ✅ Show for **2 seconds** each
- ✅ Automatically advance to next slide
- ✅ Keep the 3-image overlapping effect

## ➕ How to Add More Files

### To Add a New Slide:

1. **Add your file to the images folder:**
   - Name it with the next number (e.g., `6.jpg`, `7.mp4`, `8.png`)
   - Supported formats: .jpg, .png, .mp4, .mov, .webm

2. **Update index.html:**

Find the slideshow section and add a new slide:

```html
<div class="slide-item" data-index="6">
    <img src="images/6.jpg" alt="Slide 6">
</div>
```

Or for a video:

```html
<div class="slide-item" data-index="7">
    <video src="images/7.mp4" muted playsinline></video>
</div>
```

3. **Add a dot indicator:**

In the dots section, add:

```html
<span class="dot" data-slide="6"></span>
```

### 📝 Complete Example:

**Adding slides 6 (image) and 7 (video):**

```html
<!-- In the slideshow-wrapper section: -->
<div class="slide-item" data-index="6">
    <img src="images/6.jpg" alt="Slide 6">
</div>
<div class="slide-item" data-index="7">
    <video src="images/7.mp4" muted playsinline></video>
</div>

<!-- In the slideshow-dots section: -->
<span class="dot" data-slide="6"></span>
<span class="dot" data-slide="7"></span>
```

## 🔄 To Replace an Existing File:

Simply replace the file in the `images` folder with the same name and number. The slideshow will automatically use the new file!

Example:
- Delete old `3.jpg`
- Add new `3.jpg` or `3.mp4`
- Update HTML if changing from image to video or vice versa

## 🎯 Tips:

1. **Keep numbering sequential**: 0, 1, 2, 3, 4, 5, 6, 7...
2. **Videos**: Recommend keeping under 10MB for fast loading
3. **Videos**: Will be cropped to 1:1 square automatically
4. **Order**: Files play in numeric order (0 → 1 → 2 → 3...)

## 📱 File Format Recommendations:

### Images:
- **.jpg** - Best for photos (smaller file size)
- **.png** - Best for graphics with transparency

### Videos:
- **.mp4** - Best compatibility (recommended)
- **.mov** - Works but larger files
- **.webm** - Good compression

## ⚡ Current Setup:

Your slideshow starts with **0.MOV** (video that plays through once), then moves to images 1-5 with 2-second intervals, maintaining the beautiful 3-image overlapping carousel effect!

