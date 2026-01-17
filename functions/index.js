// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");

/**
 * Proxy for n8n webhook requests to handle CORS
 */
exports.n8nProxy = onRequest(
    {
        cors: true,
        timeoutSeconds: 540,
        memory: "256MiB"
    },
    async (req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        try {
            const { webhookUrl, ...payload } = req.body;

            if (!webhookUrl) {
                res.status(400).json({ error: 'webhookUrl is required in request body' });
                return;
            }

            console.log('Proxying request to n8n:', webhookUrl);
            console.log('Payload type:', payload.type);

            // Forward the request to n8n
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify(payload)
            });

            console.log('n8n response status:', response.status);
            const contentType = response.headers.get('content-type') || '';
            console.log('n8n content-type:', contentType);

            // Handle binary responses (images/videos)
            if (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('application/octet-stream')) {
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const dataUrl = `data:${contentType.split(';')[0]};base64,${base64}`;

                if (contentType.includes('image/')) {
                    res.status(200).json({ imageUrl: dataUrl, binaryType: 'image' });
                } else {
                    res.status(200).json({ videoUrl: dataUrl, binaryType: 'video' });
                }
                return;
            }

            // Handle text/JSON responses
            const text = await response.text();
            console.log('n8n response (first 500):', text.substring(0, 500));

            try {
                const json = JSON.parse(text);
                res.status(response.status).json(json);
            } catch (e) {
                res.status(response.status).json({ output: text });
            }

        } catch (error) {
            console.error('n8n proxy error:', error);
            res.status(500).json({
                error: error.message || 'Proxy request failed'
            });
        }
    }
);
