// One-time database setup for Supabase
const postgres = require('postgres');

module.exports = async function handler(req, res) {
    // Get the connection string (Supabase uses prefixed vars)
    const connectionString = process.env.POSTGRES_URL_POSTGRES_URL || 
                            process.env.POSTGRES_URL || 
                            process.env.DATABASE_URL;
    
    const sql = postgres(connectionString, {
        ssl: 'require',
        max: 1
    });
    try {
        // Create analytics table
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
        
        // Create indexes
        await sql`CREATE INDEX IF NOT EXISTS idx_event_type ON analytics(event_type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_visitor_id ON analytics(visitor_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_created_at ON analytics(created_at)`;
        
        // Check if table was created
        const check = await sql`SELECT COUNT(*) as count FROM analytics`;
        
        return res.status(200).json({
            success: true,
            message: 'Database setup complete!',
            tableCreated: true,
            currentRecords: parseInt(check[0].count)
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

