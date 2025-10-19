// Meta-Safe Tracking System
// - No client-side fingerprinting
// - No localStorage tracking across domains
// - Server-side only analytics
// - Safe for Meta/Facebook crawlers

// Session management - memory only, no persistent storage
let sessionData = {
    sessionId: generateSessionId(),
    pageLoadTime: Date.now(),
    hasInteracted: false,
    isActive: true
};

// Generate a session ID (memory only - not persisted)
function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Safe consent gate - no auto-redirects
let pendingRedirect = null;

function showConsentGate(platform, linkName, targetUrl) {
    pendingRedirect = {
        platform,
        linkName,
        targetUrl
    };
    
    const modal = document.getElementById('age-consent-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideConsentGate() {
    const modal = document.getElementById('age-consent-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    pendingRedirect = null;
}

function confirmConsent() {
    if (pendingRedirect) {
        // Log the consent and redirect via backend
        const { linkName, targetUrl, platform } = pendingRedirect;
        
        // Send analytics to server (no tracking params in URL)
        sendServerAnalytics('adult_content_accessed', {
            platform,
            linkName,
            consentGiven: true
        });
        
        hideConsentGate();
        
        // Redirect via our safe backend endpoint (301 redirect, no tracking)
        window.location.href = `/safe-redirect?target=${encodeURIComponent(targetUrl)}`;
    }
}

// Server-side analytics (no cookies, no fingerprinting)
async function sendServerAnalytics(eventType, eventData) {
    try {
        // Minimal data to backend - server logs it anonymously
        const payload = {
            event_type: eventType,
            session_id: sessionData.sessionId,
            timestamp: new Date().toISOString(),
            ...eventData
        };
        
        // Fire and forget - don't wait for response
        fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true // Ensure request completes even if page unloads
        }).catch(() => {}); // Silent failure
        
    } catch (e) {
        // Fail silently
    }
}

// Slideshow functionality (safe for Meta crawlers)
let currentSlide = 0;
let autoSlideInterval = null;
let isUserInteracting = false;

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
    
    // Update slides
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'prev', 'next', 'hidden');
        
        const totalSlides = slides.length;
        const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
        const nextIndex = (currentSlide + 1) % totalSlides;
        
        if (i === currentSlide) {
            slide.classList.add('active');
        } else if (i === prevIndex) {
            slide.classList.add('prev');
        } else if (i === nextIndex) {
            slide.classList.add('next');
        } else {
            slide.classList.add('hidden');
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
    if (!isUserInteracting) {
        showSlide(currentSlide + 1);
    }
}

function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(nextSlide, 2000);
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
}

function resumeSlideshow() {
    isUserInteracting = false;
    startAutoSlide();
}

function initSlideshow() {
    const container = document.getElementById('slideshow-container');
    if (!container) return;
    
    showSlide(0);
    startAutoSlide();
    
    const dots = document.querySelectorAll('.dot');
    
    // Touch events
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
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                showSlide(currentSlide + 1);
            } else {
                showSlide(currentSlide - 1);
            }
        }
        
        setTimeout(resumeSlideshow, 500);
    });
    
    // Mouse events
    container.addEventListener('mouseenter', pauseSlideshow);
    container.addEventListener('mouseleave', resumeSlideshow);
    
    // Dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            pauseSlideshow();
            showSlide(index);
            setTimeout(resumeSlideshow, 2000);
        });
    });
    
    // Visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoSlide();
        } else if (!isUserInteracting) {
            startAutoSlide();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initSlideshow();
    
    // Setup consent gate buttons
    const confirmBtn = document.getElementById('age-confirm-btn');
    const cancelBtn = document.getElementById('age-cancel-btn');
    const modal = document.getElementById('age-consent-modal');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmConsent);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideConsentGate);
    }
    
    // Close modal if clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideConsentGate();
            }
        });
    }
    
    // Close modal with Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideConsentGate();
        }
    });
    
    // Track page view (minimal analytics)
    sendServerAnalytics('page_view', {
        pageUrl: window.location.pathname
    });
    
    // Track when user leaves
    window.addEventListener('beforeunload', () => {
        if (sessionData.hasInteracted) {
            sendServerAnalytics('session_end', {
                interacted: true
            });
        }
    });
});
