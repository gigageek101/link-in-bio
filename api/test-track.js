// Test tracking endpoint
const postgres = require('postgres');

module.exports = async function handler(req, res) {
    const connectionString = process.env.POSTGRES_URL_POSTGRES_URL || 
                            process.env.POSTGRES_URL || 
                            process.env.DATABASE_URL;
    
    const sql = postgres(connectionString, {
        ssl: 'require',
        max: 1
    });
    
    try {
        // Insert a test visitor
        await sql`
            INSERT INTO analytics (
                event_type, visitor_id, is_new_visitor, visit_count,
                city, country, device_type, browser
            ) VALUES (
                'page_view', 
                'test_' || NOW()::text,
                true,
                1,
                'Test City',
                'Test Country',
                'Test Device',
                'Test Browser'
            )
        `;
        
        // Get count
        const count = await sql`SELECT COUNT(*) as total FROM analytics`;
        const recentVisits = await sql`
            SELECT event_type, visitor_id, city, country, created_at 
            FROM analytics 
            ORDER BY created_at DESC 
            LIMIT 5
        `;
        
        return res.status(200).json({
            success: true,
            message: 'Test visitor added',
            totalRecords: parseInt(count[0].total),
            recentVisits: recentVisits
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    } finally {
        await sql.end();
    }
}

