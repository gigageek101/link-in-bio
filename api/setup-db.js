// One-time database setup for Supabase
const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
    // Set the connection string as env var if not set
    if (!process.env.POSTGRES_URL && process.env.POSTGRES_URL_POSTGRES_URL) {
        process.env.POSTGRES_URL = process.env.POSTGRES_URL_POSTGRES_URL;
    }
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
            currentRecords: check.rows[0].count
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
}

