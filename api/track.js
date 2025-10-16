// Vercel Serverless Function - Telegram Visitor Tracking
export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error('Missing Telegram credentials');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const { type, data } = req.body;

        let message = '';

        if (type === 'page_view') {
            // Page visit notification
            const { location, device, browser, referrer, timestamp, userAgent } = data;
            
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

            message = `🔔 <b>New Visitor!</b>\n\n`;
            message += `📍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            message += `📱 <b>Device:</b> ${device || 'Unknown'}\n`;
            message += `🌐 <b>Browser:</b> ${browser || 'Unknown'}\n`;
            message += `🔗 <b>From:</b> ${platform}\n`;
            message += `⏰ <b>Time:</b> ${timestamp}\n`;
            
        } else if (type === 'link_click') {
            // Link click notification
            const { linkName, linkUrl, location, ageVerified, timestamp } = data;
            
            let emoji = '🔗';
            if (linkName.includes('Exclusive') || linkName.includes('OnlyFans')) emoji = '💗';
            else if (linkName.includes('Telegram')) emoji = '✈️';
            else if (linkName.includes('X') || linkName.includes('Twitter')) emoji = '𝕏';

            message = `🎯 <b>Link Clicked!</b>\n\n`;
            message += `${emoji} <b>Link:</b> ${linkName}\n`;
            message += `📍 <b>Visitor from:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            if (ageVerified !== undefined) {
                message += `✅ <b>Age verified:</b> ${ageVerified ? 'Yes' : 'Cancelled'}\n`;
            }
            message += `⏰ <b>Time:</b> ${timestamp}\n`;
            message += `🔗 <b>URL:</b> ${linkUrl}\n`;
            
        } else if (type === 'age_warning') {
            // Age warning shown
            const { location, timestamp } = data;
            
            message = `⚠️ <b>Age Warning Shown</b>\n\n`;
            message += `📍 <b>Visitor from:</b> ${location.city || 'Unknown'}, ${location.country || 'Unknown'}\n`;
            message += `⏰ <b>Time:</b> ${timestamp}\n`;
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

        if (!telegramResponse.ok) {
            const error = await telegramResponse.text();
            console.error('Telegram API error:', error);
            throw new Error('Failed to send Telegram message');
        }

        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Tracking error:', error);
        return res.status(500).json({ error: 'Failed to track event' });
    }
}

