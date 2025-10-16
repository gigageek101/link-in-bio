// Debug connection string format
module.exports = async function handler(req, res) {
    const url = process.env.POSTGRES_URL_POSTGRES_URL;
    
    if (!url) {
        return res.status(200).json({
            error: 'No POSTGRES_URL_POSTGRES_URL found'
        });
    }
    
    // Show only first 30 chars and last 20 chars for security
    const first30 = url.substring(0, 30);
    const last20 = url.substring(url.length - 20);
    const length = url.length;
    
    // Parse URL to check format
    let protocol = '';
    let host = '';
    try {
        const parsed = new URL(url);
        protocol = parsed.protocol;
        host = parsed.hostname;
    } catch (e) {
        protocol = 'Invalid URL';
    }
    
    return res.status(200).json({
        connectionStringInfo: {
            starts: first30,
            ends: last20,
            length,
            protocol,
            host,
            isValidUrl: protocol !== 'Invalid URL'
        }
    });
}

