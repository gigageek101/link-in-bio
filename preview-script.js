// Preview page script - No tracking, just demo

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
}

function resumeSlideshow() {
    isUserInteracting = false;
    startAutoSlide();
}

// Initialize slideshow
function initSlideshow() {
    const container = document.getElementById('slideshow-container');
    const dots = document.querySelectorAll('.dot');
    
    if (!container) return;
    
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
});

