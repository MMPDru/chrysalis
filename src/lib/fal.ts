import { fal } from "@fal-ai/client";

// Initialize FAL with the key from environment
// NOTE: In a production app, this should be proxied to keep the key secret.
fal.config({
    credentials: import.meta.env.VITE_FAL_KEY,
});

export interface FalImageResult {
    images: string[];
    error?: string;
}

export interface FalVideoResult {
    videoUrl?: string;
    thumbnailUrl?: string; // Kling sometimes returns a cover
    status: 'completed' | 'failed' | 'processing';
    error?: string;
}

/**
 * Generate images using Nano Banana Pro
 */
export const generateImageWithFal = async (prompt: string, aspectRatio: '16:9' | '1:1' | '9:16' | '2:3' = '16:9', count: number = 1): Promise<FalImageResult> => {
    try {
        console.log(`[Fal.ai] Generating ${count} image(s) with Nano Banana Pro...`);
        console.log('[Fal.ai] Prompt:', prompt.substring(0, 100) + '...');

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Image generation timed out after 120 seconds')), 120000);
        });

        // Create generation promise
        const generationPromise = fal.subscribe("fal-ai/nano-banana-pro", {
            input: {
                prompt: prompt,
                aspect_ratio: aspectRatio,
                num_images: count,
                output_format: "png",
                resolution: "2K",
                enable_web_search: false
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === 'IN_PROGRESS') {
                    console.log('[Fal.ai] Generation in progress...');
                } else if (update.status === 'COMPLETED') {
                    console.log('[Fal.ai] Generation completed!');
                } else if (update.status === 'IN_QUEUE') {
                    console.log('[Fal.ai] Waiting in queue...');
                }
            },
        });

        // Race between generation and timeout
        const result: any = await Promise.race([generationPromise, timeoutPromise]);

        console.log('[Fal.ai] Response received');

        // Robust parsing to handle different response structures
        const images = result.images || result.data?.images;

        if (images && Array.isArray(images) && images.length > 0) {
            console.log(`[Fal.ai] Successfully generated ${images.length} image(s)`);
            return { images: images.map((img: any) => img.url) };
        }

        console.warn('[Fal.ai] No images in response:', result);
        return { images: [], error: 'No images returned in response' };

    } catch (error: any) {
        console.error("[Fal.ai] Error:", error);
        return { images: [], error: error.message || 'Unknown error' };
    }
};

/**
 * Generate video using Google Veo 3 Fast (via Fal.ai)
 * Faster and more cost effective version of Google's Veo 3!
 */
export const generateVideoWithFal = async (prompt: string, _duration: number = 8, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<FalVideoResult> => {
    try {
        console.log('Generating video with Google Veo 3 Fast on Fal.ai...');
        console.log('Prompt:', prompt);

        const result: any = await fal.subscribe("fal-ai/veo3/fast", {
            input: {
                prompt: prompt,
                aspect_ratio: aspectRatio,
                // Veo 3 Fast strictly accepts "4s" or "8s" as a string
                duration: "8s",
                resolution: "1080p",
                generate_audio: true,
                auto_fix: true
            },
            logs: true,
            onQueueUpdate: (update) => {
                console.log(`Veo 3 Fast status: ${update.status}`);
            },
        });

        console.log('Fal.ai Video Response Object:', JSON.stringify(result, null, 2));

        // Robust parsing
        // Veo model usually returns { video: { url: ... } } or { data: { video: { url: ... } } }
        const videoData = result.video || result.data?.video;

        if (videoData && videoData.url) {
            return {
                videoUrl: videoData.url,
                thumbnailUrl: videoData.thumbnail_url,
                status: 'completed'
            };
        }

        return { status: 'failed', error: 'No video URL returned in response' };

    } catch (error: any) {
        console.error("Fal.ai Veo 3 Fast error:", error);
        return { status: 'failed', error: error.message || 'Unknown error' };
    }
};
