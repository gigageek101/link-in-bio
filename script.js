// Telegram Tracking System
let userLocation = null;

// Get user location for tracking
async function getLocationForTracking() {
    if (userLocation) return userLocation;
    
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userLocation = {
            city: data.city || 'Unknown',
            country: data.country_name || 'Unknown',
            countryCode: data.country_code
        };
        return userLocation;
    } catch (error) {
        console.error('Location fetch error:', error);
        return { city: 'Unknown', country: 'Unknown' };
    }
}

// Detect device type
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/iPad/.test(ua)) return 'iPad';
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/Android/.test(ua) && /Mobile/.test(ua)) return 'Android Phone';
    if (/Android/.test(ua)) return 'Android Tablet';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown Device';
}

// Detect browser
function getBrowserName() {
    const ua = navigator.userAgent;
    if (ua.includes('Instagram')) return 'Instagram (in-app)';
    if (ua.includes('Barcelona') || ua.includes('Threads')) return 'Threads (in-app)';
    if (ua.includes('FBAV') || ua.includes('FBAN')) return 'Facebook (in-app)';
    if (ua.includes('Twitter')) return 'X/Twitter (in-app)';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
}

// Send tracking data to Telegram
async function sendTelegramNotification(type, data) {
    try {
        console.log('📤 Sending tracking data:', { type, data });
        
        const response = await fetch('/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, data })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error('❌ Tracking API error:', {
                status: response.status,
                result
            });
        } else {
            console.log('✅ Tracking sent successfully:', result);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Tracking notification error:', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Track page view
async function trackPageView() {
    const location = await getLocationForTracking();
    const device = getDeviceType();
    const browser = getBrowserName();
    const referrer = document.referrer || 'Direct';
    const timestamp = new Date().toLocaleString('en-US', { 
        timeZone: 'UTC',
        hour12: true,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    await sendTelegramNotification('page_view', {
        location,
        device,
        browser,
        referrer,
        timestamp,
        userAgent: navigator.userAgent
    });
}

// Track link click
async function trackLinkClick(linkName, linkUrl, ageVerified = undefined) {
    const location = await getLocationForTracking();
    const timestamp = new Date().toLocaleString('en-US', { 
        timeZone: 'UTC',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    await sendTelegramNotification('link_click', {
        linkName,
        linkUrl,
        location,
        ageVerified,
        timestamp
    });
}

// Age Warning Modal
let pendingUrl = null;
let pendingLinkName = null;

function showAgeWarning(event, url, linkName) {
    console.log('showAgeWarning - url:', url, 'linkName:', linkName);
    
    event.preventDefault();
    pendingUrl = url || 'https://onlyfans.com/allison-gray/c35';
    pendingLinkName = linkName || 'My Exclusive Content';
    
    console.log('Stored pendingUrl:', pendingUrl, 'pendingLinkName:', pendingLinkName);
    
    // Track age warning shown in Vercel Analytics
    if (window.va) {
        window.va('event', { name: 'age_warning_shown' });
    }
    
    // Track age warning in Telegram
    trackAgeWarning();
    
    const modal = document.getElementById('age-warning-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    return false;
}

// Track age warning shown
async function trackAgeWarning() {
    const location = await getLocationForTracking();
    const timestamp = new Date().toLocaleString('en-US', { 
        timeZone: 'UTC',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
    });
    
    await sendTelegramNotification('age_warning', {
        location,
        timestamp
    });
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
    console.log('confirmAge called - pendingUrl:', pendingUrl);
    
    if (pendingUrl) {
        // Store URL and link name before clearing
        const urlToOpen = pendingUrl;
        const linkName = pendingLinkName;
        console.log('Will open URL:', urlToOpen, 'Link:', linkName);
        
        // Track age verification acceptance in Vercel Analytics
        if (window.va) {
            window.va('event', { name: 'age_verification_accepted' });
        }
        
        // Track link click with age verification in Telegram
        trackLinkClick(linkName, urlToOpen, true);
        
        // Clear modal
        hideAgeWarning();
        
        // Open link in new tab (deep linking disabled)
        window.open(urlToOpen, '_blank', 'noopener,noreferrer');
    } else {
        console.error('No pendingUrl found!');
        hideAgeWarning();
    }
}

// Handler for non-age-gated links
function handleLinkClick(event, url, linkName) {
    event.preventDefault();
    
    // Track link click in Telegram
    trackLinkClick(linkName, url);
    
    // Track in Vercel Analytics
    if (window.va) {
        window.va('event', { 
            name: 'link_click',
            data: { link: linkName, url: url }
        });
    }
    
    // Open link
    window.open(url, '_blank', 'noopener,noreferrer');
    
    return false;
}

/* HIDDEN: Deep linking functions (uncomment to re-enable external browser forcing)

// Enhanced deep linking with x-safari and intent:// URLs for Threads/Instagram
function forceOpenInBrowser(url) {
    if (!url) {
        console.error('No URL provided to forceOpenInBrowser');
        return;
    }
    
    console.log('forceOpenInBrowser called with:', url);
    
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /android/i.test(ua);
    
    // Detect if in Threads/Instagram/Facebook in-app browser
    const isInAppBrowser = (
        ua.indexOf('Instagram') > -1 ||
        ua.indexOf('FBAV') > -1 ||
        ua.indexOf('FBAN') > -1 ||
        ua.indexOf('Barcelona') > -1 || // Threads internal name
        ua.indexOf('Threads') > -1
    );
    
    console.log('Browser detection - isInAppBrowser:', isInAppBrowser, 'isIOS:', isIOS, 'isAndroid:', isAndroid);
    console.log('User Agent:', ua);
    
    // FORCE external browser opening for in-app browsers
    if (isInAppBrowser) {
        if (isAndroid) {
            // Android: Use intent:// URL to force Chrome
            const cleanUrl = url.replace('https://', '').replace('http://', '');
            const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
            console.log('🚀 ANDROID: Forcing Chrome with intent URL:', intentUrl);
            window.location.href = intentUrl;
            return;
        } else if (isIOS) {
            // iOS: Use x-safari-https:// scheme to force Safari
            const safariUrl = url.replace('https://', 'x-safari-https://').replace('http://', 'x-safari-http://');
            console.log('🚀 iOS: Forcing Safari with x-safari scheme:', safariUrl);
            window.location.href = safariUrl;
            return;
        }
    }
    
    // For normal browsers, use standard methods
    console.log('Normal browser detected, using window.open');
    try {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Fallback to direct navigation
            console.log('window.open blocked, using location.href');
            window.location.href = url;
        }
    } catch (e) {
        console.error('window.open failed:', e);
        window.location.href = url;
    }
}

// Deep Link Handler - For other links (non-age-gated)
function openInBrowser(event, url) {
    if (event) {
        event.preventDefault();
        
        // Get link name from event
        const target = event.target.closest('a');
        if (target) {
            const linkText = target.querySelector('.link-text')?.textContent || 'unknown';
            
            // Track link click in Vercel Analytics
            if (window.va) {
                window.va('event', { 
                    name: 'link_click',
                    data: { link: linkText, url: url }
                });
            }
        }
    }
    
    // Use the enhanced deep linking function
    forceOpenInBrowser(url);
    
    return false;
}

END OF HIDDEN DEEP LINKING CODE */

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
    
    // Track page view in Telegram
    trackPageView();
    
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
