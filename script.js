// Age Warning Modal
let pendingUrl = null;

function showAgeWarning(event, url) {
    event.preventDefault();
    pendingUrl = url;
    
    const modal = document.getElementById('age-warning-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    return false;
}

function hideAgeWarning() {
    const modal = document.getElementById('age-warning-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    pendingUrl = null;
}

function confirmAge() {
    if (pendingUrl) {
        // Close modal first
        hideAgeWarning();
        
        // Small delay to ensure modal is closed, then open link with deep linking
        setTimeout(() => {
            forceOpenInBrowser(pendingUrl);
        }, 100);
    } else {
        hideAgeWarning();
    }
}

// Enhanced deep linking function - more aggressive approach
function forceOpenInBrowser(url) {
    // Try multiple methods to break out of in-app browsers
    
    // Method 1: Create and click a link element (works best on mobile)
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // For iOS devices - add specific attributes
    if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
        link.setAttribute('data-safariviewcontroller', 'false');
    }
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Method 2: Also try window.open as backup (desktop/some mobile browsers)
    setTimeout(() => {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
            console.log('Fallback open failed:', e);
        }
    }, 50);
    
    // Method 3: For Instagram/Facebook in-app browser - try to force external browser
    if (isInAppBrowser()) {
        setTimeout(() => {
            window.location.href = url;
        }, 100);
    }
}

// Detect if running in an in-app browser
function isInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    
    // Check for common in-app browsers
    return (
        ua.indexOf('FBAN') > -1 || // Facebook App
        ua.indexOf('FBAV') > -1 || // Facebook App
        ua.indexOf('Instagram') > -1 || // Instagram
        ua.indexOf('Threads') > -1 || // Threads
        ua.indexOf('Twitter') > -1 || // Twitter
        ua.indexOf('Line') > -1 // Line
    );
}

// Deep Link Handler - For other links (non-age-gated)
function openInBrowser(event, url) {
    if (event) {
        event.preventDefault();
    }
    
    // Use the enhanced deep linking function
    forceOpenInBrowser(url);
    
    return false;
}

// Get user's location based on IP
async function getUserLocation() {
    try {
        // Try primary API (ipapi.co - no API key required, good free tier)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.city && data.country_name) {
            return {
                city: data.city,
                country: data.country_name,
                countryCode: data.country_code,
                region: data.region
            };
        }
    } catch (error) {
        console.log('Primary location API failed, trying backup...');
    }
    
    try {
        // Backup API (ip-api.com - free, no key required)
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        
        if (data.city && data.country) {
            return {
                city: data.city,
                country: data.country,
                countryCode: data.countryCode,
                region: data.regionName
            };
        }
    } catch (error) {
        console.log('Backup location API failed');
    }
    
    // Fallback if both APIs fail
    return null;
}

// Update location messages
async function updateLocationMessages() {
    const travelMessageElement = document.getElementById('travel-message');
    
    const location = await getUserLocation();
    
    if (location && travelMessageElement) {
        // Update travel message with user's location - with colored city name
        travelMessageElement.innerHTML = `Travelling to <span class="travel-city">${location.city}</span> tomorrow`;
    } else if (travelMessageElement) {
        // Keep default message if location detection fails
        travelMessageElement.innerHTML = 'Travelling to <span class="travel-city">your city</span> tomorrow';
    }
}

// Slideshow functionality
let currentSlide = 0;
let autoSlideInterval = null;
let isUserInteracting = false;
let videoPlaybackInProgress = false;

function showSlide(index) {
    const slides = document.querySelectorAll('.slide-item');
    const dots = document.querySelectorAll('.dot');
    
    if (!slides.length) return;
    
    // Wrap around
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }
    
    // Update slides to show 3 at once (prev, active, next)
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev', 'next', 'hidden');
        
        const totalSlides = slides.length;
        
        // Calculate positions
        const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
        const nextIndex = (currentSlide + 1) % totalSlides;
        
        // Handle video elements
        const video = slide.querySelector('video');
        
        if (i === currentSlide) {
            slide.classList.add('active');
            
            // Play video if it's in the active slide
            if (video && !isUserInteracting) {
                videoPlaybackInProgress = true;
                stopAutoSlide(); // Stop the timer while video plays
                
                video.currentTime = 0; // Start from beginning
                video.play().catch(err => console.log('Video play failed:', err));
                
                // When video ends, advance to next slide
                video.onended = () => {
                    videoPlaybackInProgress = false;
                    if (!isUserInteracting) {
                        setTimeout(() => {
                            showSlide(currentSlide + 1);
                            startAutoSlide(); // Resume auto-sliding for images
                        }, 100);
                    }
                };
            } else if (!video) {
                // It's an image, use normal timer
                videoPlaybackInProgress = false;
            }
        } else {
            // Pause and reset video if it's not active
            if (video) {
                video.pause();
                video.currentTime = 0;
                video.onended = null; // Clear event handler
            }
            
            if (i === prevIndex) {
                slide.classList.add('prev');
            } else if (i === nextIndex) {
                slide.classList.add('next');
            } else {
                slide.classList.add('hidden');
            }
        }
    });
    
    // Update dots
    dots.forEach((dot, i) => {
        if (i === currentSlide) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function nextSlide() {
    if (!isUserInteracting && !videoPlaybackInProgress) {
        showSlide(currentSlide + 1);
    }
}

function startAutoSlide() {
    stopAutoSlide(); // Clear any existing interval
    autoSlideInterval = setInterval(nextSlide, 2000); // 2 seconds
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

function pauseSlideshow() {
    isUserInteracting = true;
    stopAutoSlide();
    
    // Also pause any playing videos
    const activeSlide = document.querySelector('.slide-item.active');
    if (activeSlide) {
        const video = activeSlide.querySelector('video');
        if (video) {
            video.pause();
        }
    }
}

function resumeSlideshow() {
    isUserInteracting = false;
    
    // Check if current slide is a video
    const activeSlide = document.querySelector('.slide-item.active');
    if (activeSlide) {
        const video = activeSlide.querySelector('video');
        if (video && video.paused) {
            // Resume video playback
            videoPlaybackInProgress = true;
            video.play().catch(err => console.log('Video play failed:', err));
        } else {
            // It's an image or video ended, resume normal slideshow
            startAutoSlide();
        }
    } else {
        startAutoSlide();
    }
}

// Initialize slideshow
function initSlideshow() {
    const container = document.getElementById('slideshow-container');
    const dots = document.querySelectorAll('.dot');
    
    if (!container) return;
    
    // Setup all videos in the slideshow
    const videos = container.querySelectorAll('video');
    videos.forEach(video => {
        video.muted = true; // Mute videos for autoplay
        video.loop = false; // Don't loop - play once
        video.playsInline = true; // For iOS
        video.setAttribute('playsinline', ''); // For iOS
        video.preload = 'auto'; // Preload video
    });
    
    // Show first slide
    showSlide(0);
    
    // Start auto-sliding
    startAutoSlide();
    
    // Touch events for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    container.addEventListener('touchstart', (e) => {
        pauseSlideshow();
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    container.addEventListener('touchmove', (e) => {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    container.addEventListener('touchend', () => {
        // Swipe detection
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - next slide
                showSlide(currentSlide + 1);
            } else {
                // Swiped right - previous slide
                showSlide(currentSlide - 1);
            }
        }
        
        // Resume after a short delay
        setTimeout(resumeSlideshow, 500);
    });
    
    // Mouse events for desktop
    container.addEventListener('mouseenter', pauseSlideshow);
    container.addEventListener('mouseleave', resumeSlideshow);
    
    // Click on dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            pauseSlideshow();
            showSlide(index);
            setTimeout(resumeSlideshow, 2000);
        });
    });
    
    // Pause when page is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoSlide();
        } else if (!isUserInteracting) {
            startAutoSlide();
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initSlideshow();
    updateLocationMessages();
    
    // Setup age warning modal buttons
    const confirmBtn = document.getElementById('age-confirm-btn');
    const cancelBtn = document.getElementById('age-cancel-btn');
    const modal = document.getElementById('age-warning-modal');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmAge);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAgeWarning);
    }
    
    // Close modal if clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideAgeWarning();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAgeWarning();
        }
    });
});
