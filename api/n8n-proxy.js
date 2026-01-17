// API route that proxies to n8n (for Vercel deployment)
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { webhookUrl, ...payload } = req.body;

        if (!webhookUrl) {
            res.status(400).json({ error: 'webhookUrl is required' });
            return;
        }

        console.log('Proxying to:', webhookUrl);

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*'
            },
            body: JSON.stringify(payload)
        });

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('image/') || contentType.includes('video/')) {
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const dataUrl = `data:${contentType.split(';')[0]};base64,${base64}`;
            res.status(200).json({
                [contentType.includes('image/') ? 'imageUrl' : 'videoUrl']: dataUrl,
                binaryType: contentType.includes('image/') ? 'image' : 'video'
            });
            return;
        }

        const text = await response.text();
        try {
            res.status(response.status).json(JSON.parse(text));
        } catch {
            res.status(response.status).json({ output: text });
        }

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
}
