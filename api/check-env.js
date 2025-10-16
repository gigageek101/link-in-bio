// Check what environment variables are available
module.exports = async function handler(req, res) {
    // List all postgres-related env vars (without showing actual values for security)
    const envVars = Object.keys(process.env).filter(key => 
        key.includes('POSTGRES') || 
        key.includes('DATABASE') || 
        key.includes('SUPABASE') ||
        key.includes('DB')
    );
    
    const envStatus = {};
    envVars.forEach(key => {
        envStatus[key] = '✅ SET (hidden for security)';
    });
    
    return res.status(200).json({
        availableEnvVars: envStatus,
        totalFound: envVars.length,
        hint: 'If you see SUPABASE_ vars but no POSTGRES_ vars, we need to update the code'
    });
}

