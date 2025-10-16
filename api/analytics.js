// Analytics API Endpoint
const { sql } = require('@vercel/postgres');

// Simplified inline functions for Neon compatibility
async function initDatabase() {
    try {
        await sql`SELECT 1`;
        await sql`
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                visitor_id VARCHAR(100),
                is_new_visitor BOOLEAN,
                visit_count INTEGER,
                city VARCHAR(100),
                country VARCHAR(100),
                country_code VARCHAR(10),
                ip VARCHAR(50),
                device_type VARCHAR(50),
                browser VARCHAR(50),
                platform VARCHAR(50),
                screen_resolution VARCHAR(20),
                viewport VARCHAR(20),
                language VARCHAR(20),
                is_touch BOOLEAN,
                referrer TEXT,
                source_platform VARCHAR(50),
                page_url TEXT,
                time_on_page INTEGER,
                time_to_interaction INTEGER,
                session_duration INTEGER,
                link_name TEXT,
                link_url TEXT,
                age_verified BOOLEAN,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        
        await sql`CREATE INDEX IF NOT EXISTS idx_event_type ON analytics(event_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_visitor_id ON analytics(visitor_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_created_at ON analytics(created_at)`;
        
        return { success: true };
    } catch (error) {
        console.error('DB init error:', error.message);
        return { success: false, error: error.message };
    }
}

async function getAnalyticsSummary(timeRange = '24h') {
    try {
        const tableCheck = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'analytics'
            )
        `;
        
        if (!tableCheck.rows[0].exists) {
            return {
                totalVisitors: 0,
                newVisitors: 0,
                returningVisitors: 0,
                totalClicks: 0,
                bounces: 0,
                avgTimeToClick: 0,
                conversionRate: 0,
                bounceRate: 0,
                topLocations: [],
                linkClicks: [],
                devices: [],
                browsers: []
            };
        }
        
        let interval = '24 hours';
        if (timeRange === '7d') interval = '7 days';
        else if (timeRange === '30d') interval = '30 days';
        
        const totalVisitors = await sql`
            SELECT COUNT(DISTINCT visitor_id) as count
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'page_view'
        `;
        
        const newVisitors = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'page_view'
            AND is_new_visitor = true
        `;
        
        const totalClicks = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'link_click'
        `;
        
        const bounces = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'bounce'
        `;
        
        const avgTime = await sql`
            SELECT AVG(time_to_interaction) as avg_seconds
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'link_click'
            AND time_to_interaction IS NOT NULL
        `;
        
        const topLocs = await sql`
            SELECT city, country, COUNT(*) as visits
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'page_view'
            AND city IS NOT NULL
            GROUP BY city, country
            ORDER BY visits DESC
            LIMIT 10
        `;
        
        const links = await sql`
            SELECT link_name, COUNT(*) as clicks
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'link_click'
            GROUP BY link_name
            ORDER BY clicks DESC
        `;
        
        const devices = await sql`
            SELECT device_type, COUNT(*) as count
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'page_view'
            GROUP BY device_type
            ORDER BY count DESC
        `;
        
        const browsers = await sql`
            SELECT browser, COUNT(*) as count
            FROM analytics
            WHERE created_at > NOW() - INTERVAL ${interval}
            AND event_type = 'page_view'
            GROUP BY browser
            ORDER BY count DESC
        `;
        
        return {
            totalVisitors: parseInt(totalVisitors.rows[0]?.count || 0),
            newVisitors: parseInt(newVisitors.rows[0]?.count || 0),
            returningVisitors: parseInt(totalVisitors.rows[0]?.count || 0) - parseInt(newVisitors.rows[0]?.count || 0),
            totalClicks: parseInt(totalClicks.rows[0]?.count || 0),
            bounces: parseInt(bounces.rows[0]?.count || 0),
            avgTimeToClick: parseFloat(avgTime.rows[0]?.avg_seconds || 0),
            conversionRate: totalVisitors.rows[0]?.count > 0 
                ? ((totalClicks.rows[0]?.count / totalVisitors.rows[0]?.count) * 100).toFixed(1)
                : 0,
            bounceRate: totalVisitors.rows[0]?.count > 0
                ? ((bounces.rows[0]?.count / totalVisitors.rows[0]?.count) * 100).toFixed(1)
                : 0,
            topLocations: topLocs.rows,
            linkClicks: links.rows,
            devices: devices.rows,
            browsers: browsers.rows
        };
    } catch (error) {
        console.error('Summary error:', error.message);
        return {
            totalVisitors: 0,
            newVisitors: 0,
            returningVisitors: 0,
            totalClicks: 0,
            bounces: 0,
            avgTimeToClick: 0,
            conversionRate: 0,
            bounceRate: 0,
            topLocations: [],
            linkClicks: [],
            devices: [],
            browsers: []
        };
    }
}

async function getRecentEvents(limit = 20) {
    try {
        const events = await sql`
            SELECT 
                id, event_type, city, country, device_type, browser,
                link_name, time_on_page, session_duration, is_new_visitor,
                created_at
            FROM analytics
            ORDER BY created_at DESC
            LIMIT ${limit}
        `;
        return events.rows;
    } catch (error) {
        return [];
    }
}

module.exports = async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Simple password protection
    const ANALYTICS_PASSWORD = process.env.ANALYTICS_PASSWORD || 'allison2024';
    const providedPassword = req.headers['x-analytics-password'] || req.query.password;
    
    if (providedPassword !== ANALYTICS_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const timeRange = req.query.range || '24h';
        
        // Initialize database if needed (first run)
        try {
            await initDatabase();
        } catch (error) {
            // Database might already be initialized
        }
        
        // Get analytics data
        const summary = await getAnalyticsSummary(timeRange);
        const recentEvents = await getRecentEvents(20);
        
        return res.status(200).json({
            summary,
            recentEvents,
            timeRange
        });
        
    } catch (error) {
        console.error('Analytics API error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch analytics',
            message: error.message,
            stack: error.stack,
            details: error.toString()
        });
    }
}

