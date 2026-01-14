const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { PredictionServiceClient } = require('@google-cloud/aiplatform');

admin.initializeApp();

const PROJECT_ID = 'gen-lang-client-0227182401';
const LOCATION = 'us-central1';

// Initialize the Vertex AI client (uses Application Default Credentials automatically)
const predictionClient = new PredictionServiceClient({
    apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`
});

/**
 * Generate images using Nano Banana Pro (Imagen 3) via Vertex AI
 * This function handles OAuth2 authentication automatically via ADC
 */
exports.generateImage = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { prompt, aspectRatio = '16:9', numberOfImages = 3 } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            console.log('Generating image with Nano Banana Pro:', prompt.substring(0, 100));

            const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-001`;

            const request = {
                endpoint,
                instances: [{ prompt }],
                parameters: {
                    structValue: {
                        fields: {
                            sampleCount: { numberValue: numberOfImages },
                            aspectRatio: { stringValue: aspectRatio },
                            safetyFilterLevel: { stringValue: 'block_few' },
                            personGeneration: { stringValue: 'dont_allow' }
                        }
                    }
                }
            };

            const [response] = await predictionClient.predict(request);

            const images = response.predictions.map(pred => {
                if (pred.structValue?.fields?.bytesBase64Encoded?.stringValue) {
                    return `data:image/png;base64,${pred.structValue.fields.bytesBase64Encoded.stringValue}`;
                }
                return null;
            }).filter(Boolean);

            console.log(`Generated ${images.length} images`);
            return res.status(200).json({ images });

        } catch (error) {
            console.error('Image generation error:', error);
            return res.status(500).json({
                error: error.message || 'Image generation failed',
                details: error.details || null
            });
        }
    });
});

/**
 * Generate video using Veo 3 via Vertex AI
 */
exports.generateVideo = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { prompt, durationSeconds = 20 } = req.body;

            if (!prompt) {
                return res.status(400).json({ error: 'Prompt is required' });
            }

            console.log('Generating video with Veo 3:', prompt.substring(0, 100));

            const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/veo-001`;

            const request = {
                endpoint,
                instances: [{ prompt }],
                parameters: {
                    structValue: {
                        fields: {
                            durationSeconds: { numberValue: durationSeconds },
                            aspectRatio: { stringValue: '16:9' },
                            resolution: { stringValue: '1080p' },
                            fps: { numberValue: 24 }
                        }
                    }
                }
            };

            const [response] = await predictionClient.predict(request);

            // Check if it's a long-running operation
            if (response.name) {
                return res.status(202).json({
                    status: 'processing',
                    operationId: response.name
                });
            }

            // Direct result
            const videoUrl = response.predictions?.[0]?.structValue?.fields?.videoUri?.stringValue;
            if (videoUrl) {
                return res.status(200).json({ status: 'completed', videoUrl });
            }

            return res.status(200).json({ status: 'pending' });

        } catch (error) {
            console.error('Video generation error:', error);
            return res.status(500).json({
                error: error.message || 'Video generation failed',
                details: error.details || null
            });
        }
    });
});

/**
 * Proxy for n8n webhook requests to handle CORS
 * This allows the frontend to call n8n webhooks without CORS issues
 */
exports.n8nProxy = functions.https.onRequest((req, res) => {
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
            const timeoutMs = payload.type === 'Video' ? 300000 : 120000; // 5 min for video, 2 min for others
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
