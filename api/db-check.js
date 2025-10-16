// Database diagnostic - Supabase connection test
const postgres = require('postgres');

module.exports = async function handler(req, res) {
    // Get the connection string (Supabase uses prefixed vars)
    const connectionString = process.env.POSTGRES_URL_POSTGRES_URL || 
                            process.env.POSTGRES_URL || 
                            process.env.DATABASE_URL;
    
    const sql = postgres(connectionString, {
        ssl: 'require',
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10
    });
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
                time: timeTest[0].current_time
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
                exists: tableCheck[0].exists
            };
            
            // 4. If table exists, count records
            if (tableCheck[0].exists) {
                const count = await sql`SELECT COUNT(*) as total FROM analytics`;
                results.table.totalRecords = parseInt(count[0].total);
                
                const recentCount = await sql`
                    SELECT COUNT(*) as recent 
                    FROM analytics 
                    WHERE created_at > NOW() - INTERVAL '24 hours'
                `;
                results.table.last24Hours = parseInt(recentCount[0].recent);
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
    } finally {
        await sql.end();
    }
}

