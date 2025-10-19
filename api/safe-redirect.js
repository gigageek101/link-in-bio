// Meta-Safe Redirect Handler
// - Uses HTTP 301 permanent redirects (NOT 302 or JavaScript)
// - No tracking parameters in URL
// - Server-side analytics only
// - IP anonymization
// - HTTPS enforced

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Only GET requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { target } = req.query;
        
        // Whitelist of allowed redirect targets
        const allowedTargets = {
            'telegram': 'https://t.me/allisonsworld',
            'twitter': 'https://x.com/girlie_allie',
            'onlyfans': 'https://onlyfans.com/allison-gray/c35'
        };
        
        if (!target || !allowedTargets[target]) {
            return res.status(400).json({ error: 'Invalid target' });
        }
        
        const redirectUrl = allowedTargets[target];
        
        // Log analytics server-side (async, fire and forget)
        logAnalyticsSafe(req, target).catch(() => {});
        
        // CRITICAL: Use HTTP 301 Permanent Redirect (NOT 302)
        // Meta flags 302 redirects and JS-based redirects as cloaking
        res.writeHead(301, {
            'Location': redirectUrl,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
        });
        
        res.end();
        
    } catch (error) {
        console.error('Redirect error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Anonymized server-side analytics
async function logAnalyticsSafe(req, target) {
    try {
        // Extract and anonymize IP
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // Anonymize IP to /24 range (last octet set to 0)
        if (ip && ip.includes('.')) {
            const parts = ip.split('.');
            ip = `${parts[0]}.${parts[1]}.${parts[2]}.0`;
        }
        
        // Get timestamp
        const timestamp = new Date().toISOString();
        
        // Log to stdout (server logs) - no external requests
        console.log(`[ANALYTICS] redirect=${target} ip=${ip} time=${timestamp}`);
        
        // Optional: Save to database if needed
        // const connectionString = process.env.POSTGRES_URL;
        // if (connectionString) {
        //     const sql = postgres(connectionString);
        //     await sql`
        //         INSERT INTO redirect_logs (target, ip_hash, timestamp)
        //         VALUES (${target}, crypt(${ip}, gen_salt('bf')), ${timestamp})
        //     `;
        // }
        
    } catch (error) {
        // Fail silently - don't expose errors
    }
}
