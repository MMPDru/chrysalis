// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
// const { PredictionServiceClient } = require('@google-cloud/aiplatform');

admin.initializeApp();

// const PROJECT_ID = 'gen-lang-client-0227182401';
// const LOCATION = 'us-central1';

// Initialize the Vertex AI client (uses Application Default Credentials automatically)
// const predictionClient = new PredictionServiceClient({
//     apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`
// });

/**
 * Generate images using Nano Banana Pro (Imagen 3) via Vertex AI
 * This function handles OAuth2 authentication automatically via ADC
 */
// exports.generateImage = functions.https.onRequest(async (req, res) => {
//     return cors(req, res, async () => {
//         res.status(501).json({ error: 'Function disabled' });
//     });
// });

/**
 * Generate video using Veo 3 via Vertex AI
 */
// exports.generateVideo = functions.https.onRequest((req, res) => {
//     cors(req, res, async () => {
//         res.status(501).json({ error: 'Function disabled' });
//     });
// });

/**
 * Proxy for n8n webhook requests to handle CORS
 * This allows the frontend to call n8n webhooks without CORS issues
 */
exports.n8nProxyV2 = functions.https.onRequest((req, res) => {
    // Handle CORS preflight explicitly for Gen 2 functions
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.set('Access-Control-Max-Age', '3600');

    if (req.method === 'OPTIONS') {
        // Preflight request - respond immediately
        res.status(204).send('');
        return;
    }

    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { webhookUrl, ...payload } = req.body;

            if (!webhookUrl) {
                return res.status(400).json({ error: 'webhookUrl is required in request body' });
            }

            console.log('Proxying request to n8n:', webhookUrl);
            console.log('Payload type:', payload.type);

            // Forward the request to n8n with a long timeout for videos
            const controller = new AbortController();
            const timeoutMs = payload.type === 'Video' ? 600000 : 120000; // 10 min for video, 2 min for others
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('n8n response status:', response.status);
            console.log('n8n response content-type:', response.headers.get('content-type'));

            const contentType = response.headers.get('content-type') || '';

            // Handle binary responses (images/videos)
            if (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('application/octet-stream')) {
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');
                const dataUrl = `data:${contentType.split(';')[0]};base64,${base64}`;

                if (contentType.includes('image/')) {
                    return res.status(200).json({ imageUrl: dataUrl, binaryType: 'image' });
                } else {
                    return res.status(200).json({ videoUrl: dataUrl, binaryType: 'video' });
                }
            }

            // Handle text/JSON responses
            const text = await response.text();

            try {
                const json = JSON.parse(text);
                return res.status(response.status).json(json);
            } catch (e) {
                // Return as raw output if not JSON
                return res.status(response.status).json({ output: text });
            }

        } catch (error) {
            console.error('n8n proxy error:', error);

            if (error.name === 'AbortError') {
                return res.status(504).json({
                    error: 'Request timeout - the generation is taking longer than expected. It may still be processing.',
                    timeout: true
                });
            }

            return res.status(500).json({
                error: error.message || 'Proxy request failed',
                details: error.cause || null
            });
        }
    });
});

/**
 * Secure Proxy for Fal.ai
 * Prevents exposing API credentials in the browser
 */
exports.falProxy = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        // FAL_KEY from environment 
        const FAL_KEY = process.env.FAL_KEY;

        if (!FAL_KEY) {
            console.error('FAL_KEY not set in environment variables');
            return res.status(500).json({ error: 'Server misconfiguration: Missing credentials' });
        }

        // The path usually comes as /fal-ai/model-name
        // Be robust about path parsing. 
        // If accessed via /api/fal/proxy/fal-ai/model-name, req.path might be just /fal-ai/model-name depending on rewrite

        const targetPath = req.path.replace('/api/fal/proxy', '');
        const targetUrl = `https://queue.fal.run${targetPath}`;

        console.log(`[Fal Proxy] Forwarding to: ${targetUrl}`);

        try {
            const response = await fetch(targetUrl, {
                method: req.method,
                headers: {
                    ...req.headers,
                    "Authorization": `Key ${FAL_KEY}`,
                    "Content-Type": "application/json",
                    "host": "queue.fal.run" // standard behavior
                },
                body: JSON.stringify(req.body)
            });

            console.log(`[Fal Proxy] Response status: ${response.status}`);

            // Stream the response back
            const data = await response.json();
            return res.status(response.status).json(data);

        } catch (error) {
            console.error('[Fal Proxy] Error:', error);
            return res.status(500).json({ error: error.message });
        }
    });
});
