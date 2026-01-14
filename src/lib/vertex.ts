/**
 * Nano Banana Pro (Imagen) via Gemini API
 * Using correct endpoint format from documentation
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface ImageGenerationResult {
    images: string[];
    error?: string;
}

export interface VideoGenerationResult {
    videoUrl?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    operationId?: string;
    error?: string;
}

/**
 * Generate images using Imagen via Gemini API
 * Using correct format from official docs: x-goog-api-key header
 */
export const generateImageWithNanoBanana = async (
    prompt: string,
    _aspectRatio: '1:1' | '16:9' | '9:16' | '2:3' = '16:9',
    numberOfImages: number = 3
): Promise<ImageGenerationResult> => {
    if (!GEMINI_API_KEY) {
        console.error('VITE_GEMINI_API_KEY not found');
        return { images: [], error: 'Gemini API key not configured' };
    }

    console.log('Generating with Nano Banana Pro (Imagen)');
    console.log('Prompt:', prompt.substring(0, 100));

    // Try imagen-4 (latest), then imagen-3 versions
    const models = [
        'imagen-4.0-generate-001',
        'imagen-3.0-generate-002',
        'imagen-3.0-generate-001'
    ];

    for (const model of models) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

        try {
            console.log(`Trying model: ${model}`);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY
                },
                body: JSON.stringify({
                    instances: [{ prompt }],
                    parameters: {
                        sampleCount: numberOfImages
                    }
                })
            });

            const responseText = await response.text();
            console.log(`Response (${response.status}):`, responseText.substring(0, 300));

            if (response.ok) {
                const data = JSON.parse(responseText);

                // Extract images from predictions
                const images: string[] = [];
                if (data.predictions) {
                    for (const pred of data.predictions) {
                        if (pred.bytesBase64Encoded) {
                            images.push(`data:image/png;base64,${pred.bytesBase64Encoded}`);
                        }
                    }
                }

                if (images.length > 0) {
                    console.log(`Generated ${images.length} images with ${model}`);
                    return { images };
                }
            }
        } catch (error) {
            console.log(`Error with ${model}:`, error);
        }
    }

    return {
        images: [],
        error: 'Imagen not available. Your API key may not have access to image generation models.'
    };
};

/**
 * Generate video using Veo 3
 */
export const generateVideoWithVeo = async (
    prompt: string,
    _durationSeconds: number = 20
): Promise<VideoGenerationResult> => {
    console.log('Veo 3 generation requested:', prompt.substring(0, 80));

    // Veo 3 requires Vertex AI
    return {
        status: 'failed',
        error: 'Veo 3 requires Vertex AI with OAuth2. Upgrade to Firebase Blaze plan for Cloud Functions.'
    };
};

export const checkVeoOperationStatus = async (_operationId: string): Promise<VideoGenerationResult> => {
    return { status: 'failed', error: 'Video generation not available' };
};
