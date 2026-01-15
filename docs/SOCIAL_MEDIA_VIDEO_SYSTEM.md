# Social Media Video Creation System

## Overview

The **Social Media Repurpose** page (`/social-media`) enables users to transform their memoir content into social media posts, images, and videos. This document focuses specifically on the **video creation system**, which uses **n8n webhooks** to generate AI videos from chapter content.

> **Note:** This system is completely separate from the Visual Studio's image/video generation, which uses Fal.ai and Vertex AI directly.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SOCIAL MEDIA REPURPOSE                             │
│                     src/pages/SocialMediaRepurpose.tsx                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           sendToN8N('Video')                                │
│                                                                              │
│  Builds payload with:                                                        │
│  - type: 'Video'                                                            │
│  - content: generatedVideoScene (AI-analyzed scene description)              │
│  - chapter_title, author_name, brand, tone                                  │
│  - Context fields: chapter_context, butterfly_theme, wisdom_lessons         │
│  - video_scene, source_text                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           N8N WEBHOOK                                       │
│             https://m2ai.app.n8n.cloud/webhook/antigravity-webhook           │
│                                                                              │
│  n8n Workflow:                                                               │
│  1. Receives POST request with payload                                       │
│  2. Routes based on 'type' field                                            │
│  3. For Video: Generates AI video using configured tools                     │
│  4. Returns response with video URL                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESPONSE HANDLING                                     │
│                                                                              │
│  Expected Response Formats:                                                  │
│                                                                              │
│  Format A (JSON):                                                            │
│  {                                                                           │
│    "video_url": "https://...",                                              │
│    "Video_URL": "https://...",  // Alternative key                          │
│    "video_prompt": "...",                                                   │
│    "twitter": "...",                                                        │
│    "instagram": "...",                                                      │
│    ...                                                                       │
│  }                                                                           │
│                                                                              │
│  Format B (Markdown text):                                                   │
│  Contains "video_url: https://..." or mp4 URL pattern                        │
│                                                                              │
│  Format C (Binary):                                                          │
│  Content-Type: video/* → Blob converted to base64 data URL                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UI RENDERING                                         │
│                                                                              │
│  <video src={videoResults.videoUrl} controls />                              │
│  Download button with <a href={videoUrl} download>                           │
│  Platform-specific post captions rendered below video                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Locations

| File | Purpose |
|------|---------|
| `src/pages/SocialMediaRepurpose.tsx` | Main component with all video generation logic |
| `src/lib/visuals.ts` | Firebase storage functions for visual assets (can be extended for videos) |

---

## Key Code Sections

### 1. Webhook Configuration (Lines 26-34)

```typescript
// N8N Webhook Configuration
// Note: If you get CORS errors, configure n8n Respond to Webhook node to add these headers:
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: POST, OPTIONS
// Access-Control-Allow-Headers: Content-Type
const N8N_WEBHOOK_URL = "https://m2ai.app.n8n.cloud/webhook/antigravity-webhook";
```

### 2. Type Definitions (Lines 73-90)

```typescript
interface VideoResult {
    videoUrl: string;       // The URL to the generated video (can be https:// or base64 data URL)
    videoPrompt: string;    // The prompt used for generation
    posts: Record<string, any>;  // Platform-specific post captions
}

interface GenerationHistory {
    id: string;
    timestamp: Date;
    chapterTitle: string;
    type: 'Post' | 'Image' | 'Video';
    status: 'pending' | 'complete' | 'error';
    errorMessage?: string;
    payload?: Record<string, any>;  // Saved for retry functionality
    retryCount?: number;
}
```

### 3. Video Response Parser (Lines 208-245)

```typescript
function parseVideoResponse(response: any): VideoResult {
    const outputText = response.output || response;

    let videoUrl = '';
    let videoPrompt = '';
    let posts: Record<string, any> = {};

    if (typeof outputText === 'string') {
        // Try to find video URL in text
        const urlMatch = outputText.match(/video[_\s]?url[:\s]+([^\s\n]+)/i);
        const mp4Match = outputText.match(/(https?:\/\/[^\s]+\.mp4)/i);
        if (urlMatch) videoUrl = urlMatch[1];
        else if (mp4Match) videoUrl = mp4Match[1];

        // Parse posts from markdown
        const parsedPosts = parseMarkdownToPlatforms(outputText);
        parsedPosts.forEach(p => {
            posts[p.platform.toLowerCase()] = p.caption;
        });
    } else {
        // JSON response
        videoUrl = outputText?.video_url || outputText?.Video_URL || '';
        videoPrompt = outputText?.video_prompt || outputText?.Video_Prompt || '';
        posts = {
            twitter: outputText?.twitter || outputText?.['Twitter Post'] || '',
            instagram: outputText?.instagram || outputText?.['Instagram Caption'] || '',
            linkedin: outputText?.linkedin || outputText?.['LinkedIn Post'] || '',
            facebook: outputText?.facebook || outputText?.['Facebook Post'] || '',
            threads: outputText?.threads || outputText?.['Threads Text Post'] || '',
            tiktok: outputText?.tiktok || outputText?.['TikTok Caption'] || '',
        };
    }

    return { videoUrl, videoPrompt, posts };
}
```

### 4. Video Payload Construction (Lines 620-648)

```typescript
const payload: Record<string, any> = {
    // Routing
    type: 'Video',
    
    // For videos, send the scene description as primary content
    content: generatedVideoScene,
    
    // Metadata
    chapter_title: selectedChapter?.title || 'Untitled',
    author_name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Author',
    brand: 'Chrysalis Memoir',
    tone: selectedTone,

    // Context fields for AI
    chapter_context: contextFields.chapter_context,
    butterfly_theme: contextFields.butterfly_theme,
    wisdom_lessons: contextFields.wisdom_lessons,
    author_voice: contextFields.author_voice,
    content_request: 'Create Video content for likely platforms.',
    
    // Video-specific
    video_scene: generatedVideoScene,
    source_text: selectedText.substring(0, 500)
};
```

### 5. Binary Video Response Handling (Lines 688-698)

```typescript
// Handle binary responses (images/videos)
if (contentType.includes('image/') || contentType.includes('video/') || 
    contentType.includes('application/octet-stream')) {
    
    console.log('Received binary response, converting to base64...');
    const blob = await response.blob();
    const base64Url = await blobToBase64(blob);

    if (type === 'Image' || contentType.includes('image/')) {
        data = { imageUrl: base64Url, binaryType: 'image' };
    } else {
        data = { videoUrl: base64Url, binaryType: 'video' };
    }
}
```

### 6. Video Rendering (Lines 1617-1705)

```typescript
{/* Video Results */}
{activeResultTab === 'videos' && videoResults && (
    <div>
        {videoResults.videoUrl && (
            <div style={{ marginBottom: '1rem' }}>
                <video
                    src={videoResults.videoUrl}
                    controls
                    style={{
                        width: '100%',
                        maxHeight: '300px',
                        borderRadius: '0.75rem',
                        background: '#000'
                    }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <a
                        href={videoResults.videoUrl}
                        download
                        className="btn"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                    >
                        <Download size={14} /> Download Video
                    </a>
                </div>
            </div>
        )}

        {/* Video Posts - platform-specific captions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {Object.entries(videoResults.posts).map(([platform, content]) => (
                // ... render platform cards
            ))}
        </div>
    </div>
)}
```

---

## Current State Persistence

The system uses **localStorage** to persist state across navigation:

```typescript
// Video results persistence (Lines 453-458)
const [videoResults, setVideoResults] = useState<VideoResult | null>(() => {
    try {
        const saved = localStorage.getItem('sm_videoResults');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
});

// Save to localStorage when changed (Lines 503-507)
useEffect(() => {
    try {
        localStorage.setItem('sm_videoResults', JSON.stringify(videoResults));
    } catch (e) { console.warn('Failed to save videoResults:', e); }
}, [videoResults]);
```

---

## Current Limitations

### ❌ No Firebase Storage
Currently, generated videos are:
- Stored temporarily in component state
- Persisted to localStorage (lost on clear/device change)
- NOT saved to Firebase Firestore or Storage

### ❌ No Gallery Integration
Videos generated in Social Media Hub are:
- NOT visible in Visual Studio Gallery
- NOT associated with chapters in Firebase
- NOT shareable across sessions

### ❌ CORS Issues with External URLs
When n8n returns an external video URL (not base64):
- CORS may block playback/download
- No proxy is implemented

---

## Expected n8n Webhook Response Format

For the webhook to work correctly, n8n should return a response in one of these formats:

### Option 1: JSON Response (Recommended)

```json
{
    "video_url": "https://storage.example.com/videos/generated-123.mp4",
    "video_prompt": "A serene butterfly emerging from its chrysalis...",
    "twitter": "🦋 The struggle was the path. #transformation #memoir",
    "instagram": "In the cocoon of silence, I discovered my wings...",
    "linkedin": "My chapter on transformation taught me that growth...",
    "facebook": "Sometimes we need to dissolve completely...",
    "tiktok": "POV: You're realizing the cocoon was the lesson 🦋"
}
```

### Option 2: Binary Video Response

- **Content-Type:** `video/mp4` or `application/octet-stream`
- **Body:** Raw video binary data
- The app will convert to base64 data URL automatically

---

## TODO: Firebase Storage Implementation

To properly store and persist videos, the following changes are needed:

### 1. Add Video Storage Function to `src/lib/visuals.ts`

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const saveGeneratedVideo = async (
    userId: string,
    chapterId: string | null,
    videoBlob: Blob,
    source: 'social-media' | 'visual-studio',
    metadata?: {
        prompt?: string;
        platforms?: Record<string, string>;
    }
): Promise<{ id: string; url: string }> => {
    // 1. Upload to Firebase Storage
    const fileName = `videos/${userId}/${Date.now()}.mp4`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, videoBlob);
    const downloadUrl = await getDownloadURL(storageRef);
    
    // 2. Save metadata to Firestore
    const visualsRef = collection(db, 'visualAssets');
    const docRef = await addDoc(visualsRef, {
        userId,
        chapterId: chapterId || null,
        url: downloadUrl,
        type: 'video',
        source,  // Track where it was generated
        prompt: metadata?.prompt || '',
        platformPosts: metadata?.platforms || {},
        createdAt: Timestamp.now(),
        archived: false
    });
    
    return { id: docRef.id, url: downloadUrl };
};
```

### 2. Update SocialMediaRepurpose.tsx

Add a "Save to Library" button after video generation:

```typescript
const handleSaveVideo = async () => {
    if (!videoResults?.videoUrl || !currentUser) return;
    
    try {
        // Convert URL/base64 to Blob
        let blob: Blob;
        if (videoResults.videoUrl.startsWith('data:')) {
            // Base64 data URL
            const response = await fetch(videoResults.videoUrl);
            blob = await response.blob();
        } else {
            // External URL - need to proxy or handle CORS
            const response = await fetch(videoResults.videoUrl);
            blob = await response.blob();
        }
        
        // Save to Firebase
        const { id, url } = await saveGeneratedVideo(
            currentUser.uid,
            selectedChapterId || null,
            blob,
            'social-media',
            {
                prompt: videoResults.videoPrompt,
                platforms: videoResults.posts
            }
        );
        
        // Update state with persisted URL
        setVideoResults(prev => prev ? { ...prev, videoUrl: url } : null);
        
        alert('Video saved to library!');
    } catch (error) {
        console.error('Failed to save video:', error);
        alert('Failed to save video. Check console for details.');
    }
};
```

### 3. Add Save Button to UI

```tsx
{videoResults.videoUrl && (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
        <a href={videoResults.videoUrl} download className="btn" style={{ flex: 1 }}>
            <Download size={14} /> Download
        </a>
        <button 
            onClick={handleSaveVideo} 
            className="btn btn-primary" 
            style={{ flex: 1 }}
        >
            <Save size={14} /> Save to Library
        </button>
    </div>
)}
```

---

## n8n Webhook CORS Configuration

If you experience CORS issues, configure your n8n **Respond to Webhook** node with these headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Or configure a preflight response for OPTIONS requests.

---

## Timeout Configuration

Video generation can take significantly longer than posts/images:

```typescript
// Videos use 5-minute timeout (Lines 651-654)
const timeoutMs = type === 'Video' ? 300000 : 120000;
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
```

If generation exceeds 5 minutes, the request is marked as 'pending' (not error) so users can retry/check status.

---

## History & Retry System

The app maintains a history of all generation attempts:

```typescript
// Add to history on completion/error (Lines 759-767)
setHistory(prev => [{
    id: Date.now().toString(),
    timestamp: new Date(),
    chapterTitle: selectedChapter?.title || 'Unknown',
    type: type,
    status: 'complete',  // or 'error' or 'pending'
    payload: payload     // Saved for retry
}, ...prev.slice(0, 9)]);  // Keep last 10
```

Users can retry failed requests using the saved payload (Lines 818-946).

---

## Summary

| Feature | Current Status | Needed |
|---------|---------------|--------|
| n8n Webhook Integration | ✅ Working | - |
| Video URL Parsing (JSON) | ✅ Working | - |
| Video URL Parsing (Markdown) | ✅ Working | - |
| Binary Video Handling | ✅ Working | - |
| Video Rendering (HTML5) | ✅ Working | - |
| Download Button | ✅ Working | - |
| Platform Posts Display | ✅ Working | - |
| LocalStorage Persistence | ✅ Working | - |
| History & Retry | ✅ Working | - |
| **Firebase Storage** | ❌ Not Implemented | Add `saveGeneratedVideo()` |
| **Save to Library Button** | ❌ Not Implemented | Add UI button + handler |
| **Gallery Integration** | ❌ Not Implemented | Videos appear in Visual Gallery |
| **CORS Proxy for External URLs** | ❌ Not Implemented | Firebase Functions proxy |

---

## Related Files

- `src/pages/SocialMediaRepurpose.tsx` - Main component
- `src/lib/visuals.ts` - Firebase visual asset operations
- `src/lib/firebase.ts` - Firebase configuration
- `src/lib/types.ts` - Type definitions
