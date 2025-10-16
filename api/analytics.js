// Analytics API Endpoint
import { getAnalyticsSummary, getRecentEvents, initDatabase } from '../lib/db.js';

export default async function handler(req, res) {
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
            message: error.message 
        });
    }
}

