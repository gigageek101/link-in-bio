// Database Connection Test
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
    try {
        // Test basic connection
        const result = await sql`SELECT NOW()`;
        
        // Check if analytics table exists
        const tableCheck = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'analytics'
            )
        `;
        
        return res.status(200).json({
            success: true,
            connected: true,
            currentTime: result.rows[0],
            tableExists: tableCheck.rows[0].exists,
            env: {
                hasPostgresUrl: !!process.env.POSTGRES_URL,
                hasDatabaseUrl: !!process.env.DATABASE_URL
            }
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack,
            env: {
                hasPostgresUrl: !!process.env.POSTGRES_URL,
                hasDatabaseUrl: !!process.env.DATABASE_URL
            }
        });
    }
}

