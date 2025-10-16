// Database Configuration - Works with both Neon and Supabase
const { neon } = require('@neondatabase/serverless');
const { Pool } = require('@vercel/postgres');

// Get the database URL from various possible environment variables
function getDatabaseUrl() {
    return process.env.POSTGRES_URL || 
           process.env.DATABASE_URL || 
           process.env.SUPABASE_URL ||
           process.env.POSTGRES_PRISMA_URL;
}

// Check if we have a valid connection
function hasDatabase() {
    const url = getDatabaseUrl();
    return !!url && url.length > 0;
}

module.exports = {
    getDatabaseUrl,
    hasDatabase
};

