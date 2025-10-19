// Server-Side Analytics - Meta Safe
// No cookies, no fingerprinting, no PII, no external requests

module.exports = async function handler(req, res) {
    // CORS - restrict to your domain only
    res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).end();
    }
    
    try {
        const { event_type, session_id, data } = req.body;
        
        // Validate event type
        const validEvents = ['page_view', 'link_click', 'adult_content_accessed', 'session_end'];
        if (!validEvents.includes(event_type)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }
        
        // Log to server only (no external API calls, no cookies)
        const anonymizedEntry = {
            timestamp: new Date().toISOString(),
            event_type,
            session_id_hash: hashSessionId(session_id),
            ...data
        };
        
        // Log to stdout (will be captured by server logs)
        console.log(`[ANALYTICS] ${JSON.stringify(anonymizedEntry)}`);
        
        // Optional: Save to Postgres with anonymized data
        // const connectionString = process.env.POSTGRES_URL;
        // if (connectionString && event_type === 'page_view') {
        //     const sql = postgres(connectionString);
        //     try {
        //         await sql`
        //             INSERT INTO analytics_events (
        //                 event_type, session_hash, timestamp, event_data
        //             ) VALUES (
        //                 ${event_type}, 
        //                 ${hashSessionId(session_id)}, 
        //                 ${anonymizedEntry.timestamp},
        //                 ${JSON.stringify(anonymizedEntry)}
        //             )
        //         `;
        //     } catch (dbError) {
        //         console.error('DB error:', dbError);
        //         // Continue - don't fail the request
        //     }
        // }
        
        return res.status(200).json({ success: true });
        
    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Simple hash function (no crypto needed - just anonymization)
function hashSessionId(sessionId) {
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
        const char = sessionId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
}
