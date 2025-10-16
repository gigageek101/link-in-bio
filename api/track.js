// Vercel Serverless Function - Telegram Visitor Tracking + Database
const postgres = require('postgres');
const { getVisitorName } = require('../lib/names.js');

// Get the connection string (Supabase uses prefixed vars)
const connectionString = process.env.POSTGRES_URL_POSTGRES_URL || 
                        process.env.POSTGRES_URL || 
                        process.env.DATABASE_URL;

// Create connection with pooling for better performance
const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
    idle_timeout: 20
});

// Simplified save function with proper null handling
async function saveEvent(eventData) {
    try {
        await sql`
            INSERT INTO analytics (
                event_type, visitor_id, is_new_visitor, visit_count,
                city, country, country_code, ip,
                device_type, browser, platform, screen_resolution, viewport, language, is_touch,
                referrer, source_platform, page_url,
                time_on_page, time_to_interaction, session_duration,
                link_name, link_url, age_verified,
                user_agent
            ) VALUES (
                ${eventData.event_type || null}, 
                ${eventData.visitor_id || null}, 
                ${eventData.is_new_visitor !== undefined ? eventData.is_new_visitor : null}, 
                ${eventData.visit_count || null},
                ${eventData.city || null}, 
                ${eventData.country || null}, 
                ${eventData.country_code || null}, 
                ${eventData.ip || null},
                ${eventData.device_type || null}, 
                ${eventData.browser || null}, 
                ${eventData.platform || null}, 
                ${eventData.screen_resolution || null}, 
                ${eventData.viewport || null}, 
                ${eventData.language || null}, 
                ${eventData.is_touch !== undefined ? eventData.is_touch : null},
                ${eventData.referrer || null}, 
                ${eventData.source_platform || null}, 
                ${eventData.page_url || null},
                ${eventData.time_on_page || null}, 
                ${eventData.time_to_interaction || null}, 
                ${eventData.session_duration || null},
                ${eventData.link_name || null}, 
                ${eventData.link_url || null}, 
                ${eventData.age_verified !== undefined ? eventData.age_verified : null},
                ${eventData.user_agent || null}
            )
        `;
    } catch (error) {
        console.error('Save error:', error.message);
    }
}

module.exports = async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return res.status(500).json({ 
            error: 'Server configuration error'
        });
    }

    try {
        const { type, data } = req.body;

        // Prepare database event data
        const dbEvent = {
            event_type: type,
            visitor_id: data.visitorId,
            is_new_visitor: data.isNewVisitor,
            visit_count: data.visitCount,
            city: data.location?.city,
            country: data.location?.country,
            country_code: data.location?.countryCode,
            ip: data.location?.ip,
            device_type: data.device || data.deviceInfo?.type,
            browser: data.browser,
            platform: data.deviceInfo?.platform,
            screen_resolution: data.deviceInfo?.screen,
            viewport: data.deviceInfo?.viewport,
            language: data.deviceInfo?.language,
            is_touch: data.deviceInfo?.touchScreen,
            referrer: data.referrer,
            source_platform: detectPlatform(data.userAgent, data.referrer),
            page_url: data.pageUrl,
            time_on_page: data.timeOnPage,
            time_to_interaction: data.timeOnPage,
            session_duration: data.timeOnPage,
            link_name: data.linkName,
            link_url: data.linkUrl,
            age_verified: data.ageVerified,
            user_agent: data.userAgent
        };

        // Save to database (async, don't wait)
        saveEvent(dbEvent).catch(err => console.error('DB save error:', err));

        let message = '';

        if (type === 'page_view') {
            // Page visit notification
            const { location, device, deviceInfo, browser, referrer, timestamp, userAgent, isNewVisitor, visitCount, visitorId, pageUrl } = data;
            
            // Get visitor name
            const visitorName = getVisitorName(visitorId);
            
            // Detect platform from user agent or referrer
            let platform = 'Direct';
            if (userAgent) {
                if (userAgent.includes('Instagram')) platform = 'Instagram 📸';
                else if (userAgent.includes('Barcelona') || userAgent.includes('Threads')) platform = 'Threads 🧵';
                else if (userAgent.includes('FBAV') || userAgent.includes('FBAN')) platform = 'Facebook 📘';
                else if (userAgent.includes('Twitter')) platform = 'X/Twitter 𝕏';
            }
            if (referrer && platform === 'Direct') {
                if (referrer.includes('instagram')) platform = 'Instagram 📸';
                else if (referrer.includes('threads')) platform = 'Threads 🧵';
                else if (referrer.includes('facebook')) platform = 'Facebook 📘';
                else if (referrer.includes('twitter') || referrer.includes('x.com')) platform = 'X/Twitter 𝕏';
            }

            // Different message for new vs returning visitors
            if (isNewVisitor) {
                message = `🎉 <b>NEW VISITOR: ${visitorName}</b>\n\n`;
            } else {
                message = `🔄 <b>${visitorName} Returned</b> (Visit #${visitCount})\n\n`;
            }
            
            message += `📍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            if (location.ip && location.ip !== 'Unknown') {
                message += `🌐 <b>IP:</b> ${location.ip}\n`;
            }
            message += `📱 <b>Device:</b> ${device || 'Unknown'}\n`;
            message += `🌐 <b>Browser:</b> ${browser || 'Unknown'}\n`;
            message += `🔗 <b>From:</b> ${platform}\n`;
            
            // Device details
            if (deviceInfo) {
                message += `\n📊 <b>Device Info:</b>\n`;
                message += `  • Screen: ${deviceInfo.screen || 'Unknown'}\n`;
                message += `  • Viewport: ${deviceInfo.viewport || 'Unknown'}\n`;
                message += `  • Language: ${deviceInfo.language || 'Unknown'}\n`;
                message += `  • Touch: ${deviceInfo.touchScreen ? 'Yes' : 'No'}\n`;
                message += `  • Online: ${deviceInfo.online ? 'Yes' : 'No'}\n`;
            }
            
            message += `\n⏰ <b>Time:</b> ${timestamp}\n`;
            message += `\n👤 <b>Visitor:</b> ${visitorName} (<code>${visitorId?.substring(0, 12)}...</code>)\n`;
            
        } else if (type === 'link_click') {
            // Link click notification
            const { linkName, linkUrl, location, ageVerified, timestamp, isNewVisitor, visitorId, visitCount, timeOnPage, timeToClick } = data;
            
            // Get visitor name
            const visitorName = getVisitorName(visitorId);
            
            let emoji = '🔗';
            if (linkName.includes('Exclusive') || linkName.includes('OnlyFans')) emoji = '💗';
            else if (linkName.includes('Telegram')) emoji = '✈️';
            else if (linkName.includes('X') || linkName.includes('Twitter')) emoji = '𝕏';

            message = `🎯 <b>${visitorName} Clicked a Link!</b>\n\n`;
            message += `${emoji} <b>Link:</b> ${linkName}\n`;
            message += `📍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            message += `👤 <b>Visitor:</b> ${visitorName}\n`;
            
            // Time to click
            if (timeToClick) {
                message += `⏱️ <b>Time to Click:</b> ${timeToClick}\n`;
            }
            
            if (ageVerified !== undefined) {
                message += `✅ <b>Age verified:</b> ${ageVerified ? 'Yes' : 'Cancelled'}\n`;
            }
            message += `⏰ <b>Time:</b> ${timestamp}\n`;
            message += `🔗 <b>URL:</b> ${linkUrl}\n`;
            
        } else if (type === 'age_warning') {
            // Age warning shown
            const { location, timestamp, timeOnPage, timeToInteraction, visitorId } = data;
            
            // Get visitor name
            const visitorName = getVisitorName(visitorId);
            
            message = `⚠️ <b>${visitorName} Saw Age Warning</b>\n\n`;
            message += `📍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            message += `👤 <b>Visitor:</b> ${visitorName}\n`;
            
            if (timeToInteraction) {
                message += `⏱️ <b>Time on page:</b> ${timeToInteraction}\n`;
            }
            
            message += `⏰ <b>Time:</b> ${timestamp}\n`;
            
        } else if (type === 'bounce') {
            // Bounce notification (user left without clicking)
            const { location, timestamp, timeOnPage, sessionDuration, isNewVisitor, visitorId } = data;
            
            // Get visitor name
            const visitorName = getVisitorName(visitorId);
            
            message = `🚪 <b>${visitorName} Bounced</b> (No clicks)\n\n`;
            message += `📍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            message += `👤 <b>Visitor:</b> ${visitorName}\n`;
            
            if (sessionDuration) {
                message += `⏱️ <b>Time on page:</b> ${sessionDuration}\n`;
            }
            
            message += `⏰ <b>Left at:</b> ${timestamp}\n`;
            
        } else if (type === 'session_end') {
            // Session end notification (user left after clicking)
            const { location, timestamp, timeOnPage, sessionDuration, hadInteraction, isNewVisitor, visitorId } = data;
            
            // Get visitor name
            const visitorName = getVisitorName(visitorId);
            
            message = `👋 <b>${visitorName} Left</b>\n\n`;
            message += `📍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            message += `👤 <b>Visitor:</b> ${visitorName}\n`;
            
            if (sessionDuration) {
                message += `⏱️ <b>Session duration:</b> ${sessionDuration}\n`;
            }
            
            message += `✅ <b>Had interaction:</b> Yes\n`;
            message += `⏰ <b>Left at:</b> ${timestamp}\n`;
        }

        if (!message) {
            return res.status(400).json({ error: 'Invalid tracking type' });
        }

        // Send to Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });

        const responseData = await telegramResponse.json();

        if (!telegramResponse.ok) {
            throw new Error('Telegram API error');
        }

        return res.status(200).json({ success: true });
        
    } catch (error) {
        return res.status(500).json({ 
            error: 'Failed to track event'
        });
    }
}

// Helper function to detect platform
function detectPlatform(userAgent, referrer) {
    if (!userAgent) return 'Direct';
    
    if (userAgent.includes('Instagram')) return 'Instagram';
    if (userAgent.includes('Barcelona') || userAgent.includes('Threads')) return 'Threads';
    if (userAgent.includes('FBAV') || userAgent.includes('FBAN')) return 'Facebook';
    if (userAgent.includes('Twitter')) return 'X/Twitter';
    
    if (referrer) {
        if (referrer.includes('instagram')) return 'Instagram';
        if (referrer.includes('threads')) return 'Threads';
        if (referrer.includes('facebook')) return 'Facebook';
        if (referrer.includes('twitter') || referrer.includes('x.com')) return 'X/Twitter';
    }
    
    return 'Direct';
}

