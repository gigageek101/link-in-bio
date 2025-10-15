// Analytics Tracking System
// This file tracks page views, link clicks, locations, and times

(function() {
    'use strict';

    const ANALYTICS_ENDPOINT = 'YOUR_ANALYTICS_API_ENDPOINT'; // We'll set this up

    // Track page view
    function trackPageView() {
        const data = {
            type: 'pageview',
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`
        };

        sendAnalytics(data);
    }

    // Track link click
    function trackLinkClick(linkName, url) {
        const data = {
            type: 'link_click',
            timestamp: new Date().toISOString(),
            linkName: linkName,
            destination: url,
            page: window.location.pathname
        };

        sendAnalytics(data);
    }

    // Track age verification
    function trackAgeVerification(action) {
        const data = {
            type: 'age_verification',
            timestamp: new Date().toISOString(),
            action: action, // 'shown', 'accepted', 'rejected'
            page: window.location.pathname
        };

        sendAnalytics(data);
    }

    // Send analytics data
    function sendAnalytics(data) {
        // Add session ID
        data.sessionId = getSessionId();

        // Get user location (will be determined by server IP)
        // This would be handled by your analytics backend

        // Send to analytics endpoint
        if (ANALYTICS_ENDPOINT && ANALYTICS_ENDPOINT !== 'YOUR_ANALYTICS_API_ENDPOINT') {
            fetch(ANALYTICS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                keepalive: true // Ensure tracking works even on page unload
            }).catch(err => console.log('Analytics error:', err));
        }

        // Also log to console for debugging
        console.log('Analytics:', data);

        // Store locally as backup
        storeLocalAnalytics(data);
    }

    // Generate or get session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }

    // Store analytics locally (backup)
    function storeLocalAnalytics(data) {
        try {
            const stored = JSON.parse(localStorage.getItem('local_analytics') || '[]');
            stored.push(data);
            // Keep only last 1000 events
            if (stored.length > 1000) {
                stored.shift();
            }
            localStorage.setItem('local_analytics', JSON.stringify(stored));
        } catch (e) {
            console.log('Could not store analytics locally');
        }
    }

    // Export functions globally
    window.trackLinkClick = trackLinkClick;
    window.trackAgeVerification = trackAgeVerification;

    // Track page view on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
        trackPageView();
    }

})();

