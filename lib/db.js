// Database helper functions
import { sql } from '@vercel/postgres';

// Initialize database tables
export async function initDatabase() {
    try {
        // Create analytics table
        await sql`
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                visitor_id VARCHAR(100),
                is_new_visitor BOOLEAN,
                visit_count INTEGER,
                
                -- Location data
                city VARCHAR(100),
                country VARCHAR(100),
                country_code VARCHAR(10),
                ip VARCHAR(50),
                
                -- Device data
                device_type VARCHAR(50),
                browser VARCHAR(50),
                platform VARCHAR(50),
                screen_resolution VARCHAR(20),
                viewport VARCHAR(20),
                language VARCHAR(20),
                is_touch BOOLEAN,
                
                -- Referrer data
                referrer TEXT,
                source_platform VARCHAR(50),
                page_url TEXT,
                
                -- Timing data
                time_on_page INTEGER,
                time_to_interaction INTEGER,
                session_duration INTEGER,
                
                -- Link click data
                link_name TEXT,
                link_url TEXT,
                age_verified BOOLEAN,
                
                -- Meta
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;
        
        // Create indexes for fast queries
        await sql`CREATE INDEX IF NOT EXISTS idx_event_type ON analytics(event_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_visitor_id ON analytics(visitor_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_created_at ON analytics(created_at)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_is_new_visitor ON analytics(is_new_visitor)`;
        
        return { success: true };
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Save tracking event to database
export async function saveEvent(eventData) {
    try {
        const result = await sql`
            INSERT INTO analytics (
                event_type, visitor_id, is_new_visitor, visit_count,
                city, country, country_code, ip,
                device_type, browser, platform, screen_resolution, viewport, language, is_touch,
                referrer, source_platform, page_url,
                time_on_page, time_to_interaction, session_duration,
                link_name, link_url, age_verified,
                user_agent
            ) VALUES (
                ${eventData.event_type},
                ${eventData.visitor_id || null},
                ${eventData.is_new_visitor || false},
                ${eventData.visit_count || 1},
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
                ${eventData.is_touch || false},
                ${eventData.referrer || null},
                ${eventData.source_platform || null},
                ${eventData.page_url || null},
                ${eventData.time_on_page || null},
                ${eventData.time_to_interaction || null},
                ${eventData.session_duration || null},
                ${eventData.link_name || null},
                ${eventData.link_url || null},
                ${eventData.age_verified || null},
                ${eventData.user_agent || null}
            )
            RETURNING id
        `;
        
        return result.rows[0];
    } catch (error) {
        console.error('Error saving event:', error);
        throw error;
    }
}

// Get analytics summary
export async function getAnalyticsSummary(timeRange = '24h') {
    try {
        let timeCondition = "created_at > NOW() - INTERVAL '24 hours'";
        
        if (timeRange === '7d') {
            timeCondition = "created_at > NOW() - INTERVAL '7 days'";
        } else if (timeRange === '30d') {
            timeCondition = "created_at > NOW() - INTERVAL '30 days'";
        }
        
        // Total visitors
        const totalVisitors = await sql`
            SELECT COUNT(DISTINCT visitor_id) as count
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'page_view'
        `;
        
        // New vs Returning
        const newVisitors = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'page_view'
            AND is_new_visitor = true
        `;
        
        // Total link clicks
        const totalClicks = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'link_click'
        `;
        
        // Bounces
        const bounces = await sql`
            SELECT COUNT(*) as count
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'bounce'
        `;
        
        // Average time to click
        const avgTimeToClick = await sql`
            SELECT AVG(time_to_interaction) as avg_seconds
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'link_click'
            AND time_to_interaction IS NOT NULL
        `;
        
        // Top locations
        const topLocations = await sql`
            SELECT city, country, COUNT(*) as visits
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'page_view'
            AND city IS NOT NULL
            GROUP BY city, country
            ORDER BY visits DESC
            LIMIT 10
        `;
        
        // Link click breakdown
        const linkClicks = await sql`
            SELECT link_name, COUNT(*) as clicks
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'link_click'
            GROUP BY link_name
            ORDER BY clicks DESC
        `;
        
        // Device breakdown
        const devices = await sql`
            SELECT device_type, COUNT(*) as count
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
            AND event_type = 'page_view'
            GROUP BY device_type
            ORDER BY count DESC
        `;
        
        // Browser breakdown
        const browsers = await sql`
            SELECT browser, COUNT(*) as count
            FROM analytics
            WHERE ${sql.raw(timeCondition)}
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
            avgTimeToClick: parseFloat(avgTimeToClick.rows[0]?.avg_seconds || 0),
            conversionRate: totalVisitors.rows[0]?.count > 0 
                ? ((totalClicks.rows[0]?.count / totalVisitors.rows[0]?.count) * 100).toFixed(1)
                : 0,
            bounceRate: totalVisitors.rows[0]?.count > 0
                ? ((bounces.rows[0]?.count / totalVisitors.rows[0]?.count) * 100).toFixed(1)
                : 0,
            topLocations: topLocations.rows,
            linkClicks: linkClicks.rows,
            devices: devices.rows,
            browsers: browsers.rows
        };
    } catch (error) {
        console.error('Error getting analytics summary:', error);
        throw error;
    }
}

// Get recent events (for real-time feed)
export async function getRecentEvents(limit = 20) {
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
        console.error('Error getting recent events:', error);
        throw error;
    }
}

