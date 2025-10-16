// Database diagnostic - Supabase connection test
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
    // Set the connection string as env var if not set (Supabase uses prefixed vars)
    if (!process.env.POSTGRES_URL && process.env.POSTGRES_URL_POSTGRES_URL) {
        process.env.POSTGRES_URL = process.env.POSTGRES_URL_POSTGRES_URL;
    }
    const results = {};
    
    try {
        // 1. Check environment variables
        results.envVars = {
            POSTGRES_URL_POSTGRES_URL: !!process.env.POSTGRES_URL_POSTGRES_URL,
            POSTGRES_URL: !!process.env.POSTGRES_URL,
            DATABASE_URL: !!process.env.DATABASE_URL,
            usingSupabase: !!process.env.POSTGRES_URL_POSTGRES_URL
        };
        
        // 2. Test connection
        try {
            const timeTest = await sql`SELECT NOW() as current_time`;
            results.connection = {
                status: 'Connected',
                time: timeTest.rows[0].current_time
            };
        } catch (err) {
            results.connection = {
                status: 'Failed',
                error: err.message
            };
        }
        
        // 3. Check if table exists
        try {
            const tableCheck = await sql`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'analytics'
                )
            `;
            results.table = {
                exists: tableCheck.rows[0].exists
            };
            
            // 4. If table exists, count records
            if (tableCheck.rows[0].exists) {
                const count = await sql`SELECT COUNT(*) as total FROM analytics`;
                results.table.totalRecords = count.rows[0].total;
                
                const recentCount = await sql`
                    SELECT COUNT(*) as recent 
                    FROM analytics 
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                `;
                results.table.last24Hours = recentCount.rows[0].recent;
            }
        } catch (err) {
            results.table = {
                error: err.message
            };
        }
        
        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}

