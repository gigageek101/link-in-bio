// Analytics API Endpoint
const { createPool } = require('@vercel/postgres');

// Get the correct connection string (Supabase uses prefixed vars)
const connectionString = process.env.POSTGRES_URL_POSTGRES_URL || 
                        process.env.POSTGRES_URL || 
                        process.env.DATABASE_URL;

const pool = createPool({ connectionString });
const sql = pool.sql;

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
            WHERE event_type = 'page_view'
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
        `;
        
        const newVisitors = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE event_type = 'page_view'
            AND is_new_visitor = true
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
        `;
        
        const totalClicks = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE event_type = 'link_click'
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
        `;
        
        const visitorsWhoClicked = await sql`
            SELECT COUNT(DISTINCT visitor_id) as count
            FROM analytics
            WHERE event_type = 'link_click'
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
        `;
        
        const bounces = await sql`
            SELECT COUNT(DISTINCT visitor_id) as count
            FROM analytics
            WHERE event_type = 'bounce'
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
        `;
        
        const avgTime = await sql`
            SELECT AVG(time_to_interaction) as avg_seconds
            FROM analytics
            WHERE event_type = 'link_click'
            AND time_to_interaction IS NOT NULL
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
        `;
        
        const topLocs = await sql`
            SELECT city, country, COUNT(*) as visits
            FROM analytics
            WHERE event_type = 'page_view'
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
            GROUP BY city, country
            ORDER BY visits DESC
            LIMIT 10
        `;
        
        const links = await sql`
            SELECT link_name, COUNT(*) as clicks
            FROM analytics
            WHERE event_type = 'link_click'
            AND link_name IS NOT NULL
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
            GROUP BY link_name
            ORDER BY clicks DESC
        `;
        
        const devices = await sql`
            SELECT device_type, COUNT(*) as count
            FROM analytics
            WHERE event_type = 'page_view'
            AND device_type IS NOT NULL
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
            GROUP BY device_type
            ORDER BY count DESC
        `;
        
        const browsers = await sql`
            SELECT browser, COUNT(*) as count
            FROM analytics
            WHERE event_type = 'page_view'
            AND browser IS NOT NULL
            AND city IS NOT NULL 
            AND city != '' 
            AND city != 'Unknown'
            AND country IS NOT NULL 
            AND country != '' 
            AND country != 'Unknown'
            GROUP BY browser
            ORDER BY count DESC
        `;
        
        const totalVisitorsCount = parseInt(totalVisitors.rows[0]?.count || 0);
        const visitorsWhoClickedCount = parseInt(visitorsWhoClicked.rows[0]?.count || 0);
        const bouncesCount = parseInt(bounces.rows[0]?.count || 0);
        
        return {
            totalVisitors: totalVisitorsCount,
            newVisitors: parseInt(newVisitors.rows[0]?.count || 0),
            returningVisitors: totalVisitorsCount - parseInt(newVisitors.rows[0]?.count || 0),
            totalClicks: parseInt(totalClicks.rows[0]?.count || 0),
            bounces: bouncesCount,
            avgTimeToClick: parseFloat(avgTime.rows[0]?.avg_seconds || 0),
            conversionRate: totalVisitorsCount > 0 
                ? Math.min(((visitorsWhoClickedCount / totalVisitorsCount) * 100), 100).toFixed(1)
                : 0,
            bounceRate: totalVisitorsCount > 0
                ? Math.min(((bouncesCount / totalVisitorsCount) * 100), 100).toFixed(1)
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

async function getRecentEvents(limit = 50, sourceFilter = null) {
    try {
        let events;
        if (sourceFilter && sourceFilter !== 'all') {
            events = await sql`
                SELECT 
                    id, event_type, visitor_id, city, country, device_type, browser,
                    link_name, link_url, referrer, user_agent, source_platform,
                    time_on_page, time_to_interaction, session_duration, is_new_visitor, visit_count,
                    created_at
                FROM analytics
                WHERE source_platform = ${sourceFilter}
                AND city IS NOT NULL 
                AND city != '' 
                AND city != 'Unknown'
                AND country IS NOT NULL 
                AND country != '' 
                AND country != 'Unknown'
                ORDER BY created_at DESC
                LIMIT ${limit}
            `;
        } else {
            events = await sql`
                SELECT 
                    id, event_type, visitor_id, city, country, device_type, browser,
                    link_name, link_url, referrer, user_agent, source_platform,
                    time_on_page, time_to_interaction, session_duration, is_new_visitor, visit_count,
                    created_at
                FROM analytics
                WHERE city IS NOT NULL 
                AND city != '' 
                AND city != 'Unknown'
                AND country IS NOT NULL 
                AND country != '' 
                AND country != 'Unknown'
                ORDER BY created_at DESC
                LIMIT ${limit}
            `;
        }
        return events.rows;
    } catch (error) {
        return [];
    }
}

async function getUserJourneys(sourceFilter = null) {
    try {
        let events;
        if (sourceFilter && sourceFilter !== 'all') {
            events = await sql`
                SELECT 
                    visitor_id, event_type, city, country, device_type, browser,
                    link_name, link_url, referrer, user_agent, source_platform,
                    time_on_page, time_to_interaction, session_duration, is_new_visitor,
                    created_at
                FROM analytics
                WHERE source_platform = ${sourceFilter}
                AND city IS NOT NULL 
                AND city != '' 
                AND city != 'Unknown'
                AND country IS NOT NULL 
                AND country != '' 
                AND country != 'Unknown'
                ORDER BY visitor_id, created_at ASC
            `;
        } else {
            events = await sql`
                SELECT 
                    visitor_id, event_type, city, country, device_type, browser,
                    link_name, link_url, referrer, user_agent, source_platform,
                    time_on_page, time_to_interaction, session_duration, is_new_visitor,
                    created_at
                FROM analytics
                WHERE city IS NOT NULL 
                AND city != '' 
                AND city != 'Unknown'
                AND country IS NOT NULL 
                AND country != '' 
                AND country != 'Unknown'
                ORDER BY visitor_id, created_at ASC
            `;
        }
        
        // Group events by visitor_id
        const journeys = {};
        events.rows.forEach(event => {
            if (!event.visitor_id) return;
            
            if (!journeys[event.visitor_id]) {
                journeys[event.visitor_id] = {
                    visitorId: event.visitor_id,
                    firstSeen: event.created_at,
                    lastSeen: event.created_at,
                    location: `${event.city || 'Unknown'}, ${event.country || 'Unknown'}`,
                    device: event.device_type,
                    browser: event.browser,
                    source: event.source_platform,
                    events: [],
                    totalTimeSpent: 0,
                    clicked: false,
                    clickedLinks: []
                };
            }
            
            journeys[event.visitor_id].events.push(event);
            journeys[event.visitor_id].lastSeen = event.created_at;
            
            if (event.time_on_page) {
                journeys[event.visitor_id].totalTimeSpent += parseInt(event.time_on_page) || 0;
            }
            
            if (event.event_type === 'link_click') {
                journeys[event.visitor_id].clicked = true;
                if (event.link_name) {
                    journeys[event.visitor_id].clickedLinks.push(event.link_name);
                }
            }
        });
        
        // Convert to array and sort by most recent
        return Object.values(journeys)
            .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
            .slice(0, 100);
    } catch (error) {
        console.error('Get user journeys error:', error);
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
        const sourceFilter = req.query.source || null;
        
        // Initialize database if needed (first run)
        try {
            await initDatabase();
        } catch (error) {
            // Database might already be initialized
        }
        
        // Get analytics data
        const summary = await getAnalyticsSummary(timeRange);
        const recentEvents = await getRecentEvents(50, sourceFilter);
        const userJourneys = await getUserJourneys(sourceFilter);
        
        return res.status(200).json({
            summary,
            recentEvents,
            userJourneys,
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

