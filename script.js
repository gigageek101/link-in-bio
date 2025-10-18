// Telegram Tracking System
let userLocation = null;
let visitorInfo = null;
let pageLoadTime = Date.now();
let firstInteraction = null;
let hasInteracted = false;
let sessionActive = true;

// Check if visitor is new or returning
function getVisitorType() {
    const VISITOR_KEY = 'allison_visitor_id';
    const FIRST_VISIT_KEY = 'allison_first_visit';
    
    let visitorId = localStorage.getItem(VISITOR_KEY);
    let firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
    let isNewVisitor = false;
    
    if (!visitorId) {
        // New visitor - create unique ID
        visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        firstVisit = new Date().toISOString();
        localStorage.setItem(VISITOR_KEY, visitorId);
        localStorage.setItem(FIRST_VISIT_KEY, firstVisit);
        isNewVisitor = true;
    }
    
    return {
        visitorId,
        isNewVisitor,
        firstVisit,
        totalVisits: parseInt(localStorage.getItem('allison_visit_count') || '0') + 1
    };
}

// Increment visit count
function incrementVisitCount() {
    const count = parseInt(localStorage.getItem('allison_visit_count') || '0') + 1;
    localStorage.setItem('allison_visit_count', count.toString());
    return count;
}

// Get user location for tracking
async function getLocationForTracking() {
    if (userLocation) return userLocation;
    
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        userLocation = {
            city: data.city || 'Unknown',
            country: data.country_name || 'Unknown',
            countryCode: data.country_code,
            ip: data.ip || 'Unknown'
        };
        return userLocation;
    } catch (error) {
        return { city: 'Unknown', country: 'Unknown', ip: 'Unknown' };
    }
}

// Get comprehensive device and browser info
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'Unknown Device';
    
    if (/iPad/.test(ua)) deviceType = 'iPad';
    else if (/iPhone/.test(ua)) deviceType = 'iPhone';
    else if (/Android/.test(ua) && /Mobile/.test(ua)) deviceType = 'Android Phone';
    else if (/Android/.test(ua)) deviceType = 'Android Tablet';
    else if (/Mac/.test(ua)) deviceType = 'Mac';
    else if (/Windows/.test(ua)) deviceType = 'Windows PC';
    else if (/Linux/.test(ua)) deviceType = 'Linux';
    
    return {
        type: deviceType,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language || 'Unknown',
        platform: navigator.platform || 'Unknown',
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
        touchScreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
}

// Detect device type (legacy function for compatibility)
function getDeviceType() {
    return getDeviceInfo().type;
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
        const response = await fetch('/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, data })
        });
        
        const result = await response.json();
        
        // Silent tracking - no console logs for security
        return result;
    } catch (error) {
        // Silent failure - don't expose tracking errors to users
        return null;
    }
}

// Calculate time on page
function getTimeOnPage() {
    return Math.floor((Date.now() - pageLoadTime) / 1000); // in seconds
}

// Format duration
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
}

// Track page view
async function trackPageView() {
    const location = await getLocationForTracking();
    const deviceInfo = getDeviceInfo();
    const browser = getBrowserName();
    const referrer = document.referrer || 'Direct';
    const visitorType = getVisitorType();
    const visitCount = incrementVisitCount();
    
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
        device: deviceInfo.type,
        deviceInfo,
        browser,
        referrer,
        timestamp,
        userAgent: navigator.userAgent,
        isNewVisitor: visitorType.isNewVisitor,
        visitorId: visitorType.visitorId,
        visitCount: visitCount,
        firstVisit: visitorType.firstVisit,
        pageUrl: window.location.href
    });
}

// Track link click
async function trackLinkClick(linkName, linkUrl, ageVerified = undefined) {
    const location = await getLocationForTracking();
    const visitorType = getVisitorType();
    const timeOnPage = getTimeOnPage();
    
    // Track first interaction time
    if (!firstInteraction) {
        firstInteraction = Date.now();
    }
    hasInteracted = true;
    
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
        timestamp,
        isNewVisitor: visitorType.isNewVisitor,
        visitorId: visitorType.visitorId,
        visitCount: visitorType.totalVisits,
        timeOnPage: timeOnPage,
        timeToClick: formatDuration(timeOnPage)
    });
}

// Age Warning Modal
let pendingUrl = null;
let pendingLinkName = null;
let useDeepLinkForPending = false;

function showAgeWarning(event, url, linkName, useDeepLink = false) {
    event.preventDefault();
    pendingUrl = url || 'https://onlyfans.com/allison-gray/c35';
    pendingLinkName = linkName || 'My Exclusive Content';
    useDeepLinkForPending = useDeepLink;
    
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
    const timeOnPage = getTimeOnPage();
    const visitorType = getVisitorType();
    
    // Track first interaction
    if (!firstInteraction) {
        firstInteraction = Date.now();
    }
    
    const timestamp = new Date().toLocaleString('en-US', { 
        timeZone: 'UTC',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
    });
    
    await sendTelegramNotification('age_warning', {
        location,
        timestamp,
        timeOnPage: timeOnPage,
        timeToInteraction: formatDuration(timeOnPage),
        visitorId: visitorType.visitorId
    });
}

// Track bounce (user leaving without clicking)
async function trackBounce() {
    if (hasInteracted || !sessionActive) return;
    
    const location = await getLocationForTracking();
    const timeOnPage = getTimeOnPage();
    const visitorType = getVisitorType();
    
    const timestamp = new Date().toLocaleString('en-US', { 
        timeZone: 'UTC',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
    });
    
    await sendTelegramNotification('bounce', {
        location,
        timestamp,
        timeOnPage: timeOnPage,
        sessionDuration: formatDuration(timeOnPage),
        isNewVisitor: visitorType.isNewVisitor,
        visitorId: visitorType.visitorId
    });
    
    sessionActive = false;
}

// Track session end (with interaction)
async function trackSessionEnd() {
    if (!hasInteracted || !sessionActive) return;
    
    const location = await getLocationForTracking();
    const timeOnPage = getTimeOnPage();
    const visitorType = getVisitorType();
    
    const timestamp = new Date().toLocaleString('en-US', { 
        timeZone: 'UTC',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
    });
    
    await sendTelegramNotification('session_end', {
        location,
        timestamp,
        timeOnPage: timeOnPage,
        sessionDuration: formatDuration(timeOnPage),
        hadInteraction: true,
        isNewVisitor: visitorType.isNewVisitor,
        visitorId: visitorType.visitorId
    });
    
    sessionActive = false;
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
        // Store URL and link name before clearing
        const urlToOpen = pendingUrl;
        const linkName = pendingLinkName;
        const shouldUseDeepLink = useDeepLinkForPending;
        
        // Track age verification acceptance in Vercel Analytics
        if (window.va) {
            window.va('event', { name: 'age_verification_accepted' });
        }
        
        // Track link click with age verification in Telegram
        trackLinkClick(linkName, urlToOpen, true);
        
        // Clear modal
        hideAgeWarning();
        
        // Open link using deep linking if requested, otherwise use standard method
        if (shouldUseDeepLink && typeof openInExternalBrowser === 'function') {
            openInExternalBrowser(urlToOpen);
        } else {
            window.open(urlToOpen, '_blank', 'noopener,noreferrer');
        }
    } else {
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
    if (!url) return;
    
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
    
    // FORCE external browser opening for in-app browsers
    if (isInAppBrowser) {
        if (isAndroid) {
            // Android: Use intent:// URL to force Chrome
            const cleanUrl = url.replace('https://', '').replace('http://', '');
            const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
            window.location.href = intentUrl;
            return;
        } else if (isIOS) {
            // iOS: Use x-safari-https:// scheme to force Safari
            const safariUrl = url.replace('https://', 'x-safari-https://').replace('http://', 'x-safari-http://');
            window.location.href = safariUrl;
            return;
        }
    }
    
    // For normal browsers, use standard methods
    try {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            window.location.href = url;
        }
    } catch (e) {
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
        // Primary API failed, trying backup
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
        // Backup API failed
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
                video.play().catch(err => {});
                
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
let hasTrackedPageView = false;

document.addEventListener('DOMContentLoaded', function() {
    initSlideshow();
    updateLocationMessages();
    
    // Track page view only once
    if (!hasTrackedPageView) {
        hasTrackedPageView = true;
        trackPageView();
    }
    
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
    
    // Track bounces and session ends
    // Detect when user is leaving the page
    window.addEventListener('beforeunload', function() {
        if (hasInteracted) {
            trackSessionEnd();
        } else {
            trackBounce();
        }
    });
    
    // Detect when tab is closed or hidden for extended period
    let hiddenTime = null;
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            hiddenTime = Date.now();
        } else {
            // If tab was hidden for more than 30 seconds, consider it a bounce/session end
            if (hiddenTime && (Date.now() - hiddenTime) > 30000) {
                if (hasInteracted) {
                    trackSessionEnd();
                } else if (getTimeOnPage() > 3) { // Only track bounce if they were here for 3+ seconds
                    trackBounce();
                }
            }
            hiddenTime = null;
        }
    });
});

// User Education Overlay System
function showEducationOverlay() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detect platform (only show for in-app browsers)
    const isTwitter = ua.indexOf('TwitterAndroid') > -1 || ua.indexOf('Twitter') > -1 || ua.indexOf('XiPhone') > -1 || ua.indexOf('X-App') > -1;
    const isInstagram = ua.indexOf('Instagram') > -1;
    const isThreads = ua.indexOf('Barcelona') > -1 || ua.indexOf('Threads') > -1;
    
    // Don't show for direct links or regular browsers
    if (!isTwitter && !isInstagram && !isThreads) {
        return;
    }
    
    // Check if already dismissed in this session
    const dismissedKey = 'edu_overlay_dismissed';
    if (localStorage.getItem(dismissedKey)) {
        return;
    }
    
    const overlay = document.getElementById('education-overlay');
    const twitterEdu = document.getElementById('edu-twitter');
    const instagramEdu = document.getElementById('edu-instagram');
    const threadsEdu = document.getElementById('edu-threads');
    
    // Hide all education panels first
    [twitterEdu, instagramEdu, threadsEdu].forEach(el => {
        if (el) el.classList.add('hidden');
    });
    
    // Show appropriate panel and overlay
    if (isTwitter && twitterEdu) {
        overlay.classList.remove('hidden');
        twitterEdu.classList.remove('hidden');
        startCountdown('countdown-twitter', dismissedKey);
    } else if (isInstagram && instagramEdu) {
        overlay.classList.remove('hidden');
        instagramEdu.classList.remove('hidden');
        startCountdown('countdown-instagram', dismissedKey);
    } else if (isThreads && threadsEdu) {
        overlay.classList.remove('hidden');
        threadsEdu.classList.remove('hidden');
        startCountdown('countdown-threads', dismissedKey);
    }
}

function dismissEducation() {
    const overlay = document.getElementById('education-overlay');
    overlay.classList.add('hidden');
    localStorage.setItem('edu_overlay_dismissed', 'true');
}

function startCountdown(countdownId, dismissedKey) {
    let seconds = 30;
    const element = document.getElementById(countdownId);
    
    const interval = setInterval(() => {
        seconds--;
        if (element) {
            element.textContent = seconds;
        }
        
        if (seconds <= 0) {
            clearInterval(interval);
            dismissEducation();
        }
    }, 1000);
}

// Show education overlay when page loads (if applicable)
document.addEventListener('DOMContentLoaded', function() {
    // Show education overlay after a short delay to let page settle
    setTimeout(showEducationOverlay, 500);
});
