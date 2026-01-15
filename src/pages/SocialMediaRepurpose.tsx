import { useState, useEffect } from 'react';
import {
    Share2,
    FileText,
    ImageIcon,
    Video,
    Copy,
    Download,
    Loader2,
    Check,
    AlertCircle,
    Clock,
    ChevronUp,
    Sparkles,
    RefreshCw,
    Twitter,
    Linkedin,
    Facebook,
    Instagram,
    Youtube,
    Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChapters, fetchLatestVersion } from '../lib/chapters';
import { saveGeneratedVideo } from '../lib/visuals';
import type { Chapter } from '../lib/types';

// N8N Webhook Configuration
// Note: If you get CORS errors, configure n8n Respond to Webhook node to add these headers:
// Access-Control-Allow-Origin: *
// Access-Control-Allow-Methods: POST, OPTIONS
// Access-Control-Allow-Headers: Content-Type
const N8N_WEBHOOK_URL = "https://m2ai.app.n8n.cloud/webhook/antigravity-webhook";

// Firebase proxy (requires Blaze plan to deploy)
// const FIREBASE_PROXY_URL = "https://us-central1-chrysalis-app-10581.cloudfunctions.net/n8nProxy";

// Platform configurations
const PLATFORMS = [
    { id: 'twitter', label: 'Twitter/X', icon: Twitter, color: '#1DA1F2', maxLength: 280 },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F', maxLength: 2200 },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2', maxLength: 3000 },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2', maxLength: 4000 },
    { id: 'threads', label: 'Threads', icon: FileText, color: '#000000', maxLength: 500 },
    { id: 'pinterest', label: 'Pinterest', icon: ImageIcon, color: '#BD081C', maxLength: 250 },
    { id: 'tiktok', label: 'TikTok', icon: Video, color: '#000000', maxLength: 2200 },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000', maxLength: 5000 },
];

// Tone options
const TONES = [
    { id: 'inspirational', label: 'Inspirational', emoji: '✨' },
    { id: 'reflective', label: 'Reflective', emoji: '🦋' },
    { id: 'vulnerable', label: 'Vulnerable', emoji: '💜' },
    { id: 'educational', label: 'Educational', emoji: '📚' },
    { id: 'celebratory', label: 'Celebratory', emoji: '🎉' },
    { id: 'raw', label: 'Raw/Authentic', emoji: '🔥' },
];

// Types for responses
interface PostResult {
    platform: string;
    caption: string;
    title?: string;
    link?: string;
    altText?: string;
}

interface ImageResult {
    imageUrl: string;
    imagePrompt: string;
    posts: PostResult[];
}

interface VideoResult {
    videoUrl: string;
    videoPrompt: string;
    posts: Record<string, any>;
}

interface GenerationHistory {
    id: string;
    timestamp: Date;
    chapterTitle: string;
    type: 'Post' | 'Image' | 'Video';
    status: 'pending' | 'complete' | 'error';
    errorMessage?: string;
    // For retry/polling functionality
    payload?: Record<string, any>;
    retryCount?: number;
    lastPollTime?: Date;
}

// Response parsers - Handle n8n markdown-formatted output

/**
 * Parse markdown output from n8n into structured platform posts
 * Format: ### **Platform: Instagram** followed by content sections
 */
function parseMarkdownToPlatforms(markdownText: string): PostResult[] {
    const posts: PostResult[] = [];

    // Split by platform headers like "### **Platform: Instagram**"
    const platformRegex = /###\s*\*?\*?Platform:\s*(\w+)\*?\*?/gi;
    const sections = markdownText.split(platformRegex);

    // sections: [preamble, "Instagram", content, "Facebook", content, ...]
    for (let i = 1; i < sections.length; i += 2) {
        const platformName = sections[i]?.trim();
        const content = sections[i + 1]?.trim() || '';

        if (platformName && content) {
            // Extract the main content - look for Caption, Post, or just take the content
            let caption = content;

            // Try to extract specific sections
            const captionMatch = content.match(/\*?\*?Caption:\*?\*?\s*\n([\s\S]*?)(?=\n---|\n###|$)/i);
            const postMatch = content.match(/\*?\*?Post:\*?\*?\s*\n([\s\S]*?)(?=\n---|\n###|$)/i);
            const textMatch = content.match(/\*?\*?Text:\*?\*?\s*\n([\s\S]*?)(?=\n---|\n###|$)/i);

            if (captionMatch) caption = captionMatch[1].trim();
            else if (postMatch) caption = postMatch[1].trim();
            else if (textMatch) caption = textMatch[1].trim();
            else {
                // Just clean up the content - remove visual suggestions and keep the text
                caption = content
                    .replace(/\*?\*?Visual Suggestion:\*?\*?[\s\S]*?(?=\n\n|$)/gi, '')
                    .replace(/\*?\*?Title:[\s\S]*?\n/gi, '')
                    .replace(/---/g, '')
                    .trim();
            }

            // Clean up markdown formatting for display
            caption = caption
                .replace(/\*\*/g, '') // Remove bold markers
                .replace(/\*/g, '')   // Remove italic markers
                .trim();

            posts.push({
                platform: platformName,
                caption: caption
            });
        }
    }

    return posts;
}

function parsePostResponse(response: any): PostResult[] {
    // First check if it's markdown format (string in output field)
    const outputText = response.output || response;

    if (typeof outputText === 'string' && outputText.includes('Platform:')) {
        return parseMarkdownToPlatforms(outputText);
    }

    // Fallback to structured JSON format
    const posts: PostResult[] = [];
    const platformPosts = response.output?.platform_posts || response.platform_posts || response;

    if (platformPosts && typeof platformPosts === 'object') {
        if (platformPosts.X) posts.push({ platform: 'Twitter', caption: platformPosts.X.text || platformPosts.X });
        if (platformPosts.Instagram) posts.push({ platform: 'Instagram', caption: platformPosts.Instagram.text || platformPosts.Instagram });
        if (platformPosts.LinkedIn) posts.push({ platform: 'LinkedIn', caption: platformPosts.LinkedIn.text || platformPosts.LinkedIn });
        if (platformPosts.Facebook) posts.push({ platform: 'Facebook', caption: platformPosts.Facebook.text || platformPosts.Facebook });
        if (platformPosts.Threads) posts.push({ platform: 'Threads', caption: platformPosts.Threads.text || platformPosts.Threads });
        if (platformPosts.Pinterest) {
            posts.push({
                platform: 'Pinterest',
                title: platformPosts.Pinterest.title,
                caption: platformPosts.Pinterest.description,
                link: platformPosts.Pinterest.link,
                altText: platformPosts.Pinterest.alt_text
            });
        }
    }

    return posts;
}

function parseImageResponse(response: any): ImageResult {
    const outputText = response.output || response;

    // Check if it's markdown with an image URL
    let imageUrl = '';
    let imagePrompt = '';

    if (typeof outputText === 'string') {
        // Try to find image URL in markdown
        const urlMatch = outputText.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
        const imgMatch = outputText.match(/image[_\s]?url[:\s]+([^\s\n]+)/i);
        if (urlMatch) imageUrl = urlMatch[1];
        else if (imgMatch) imageUrl = imgMatch[1];

        // Extract prompt if present
        const promptMatch = outputText.match(/prompt[:\s]+(.+?)(?:\n|$)/i);
        if (promptMatch) imagePrompt = promptMatch[1].trim();
    } else {
        imageUrl = outputText?.image_url || outputText?.url || '';
        imagePrompt = outputText?.unified_image_prompt || outputText?.prompt || '';
    }

    return {
        imageUrl,
        imagePrompt,
        posts: parsePostResponse(response)
    };
}

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

    return {
        videoUrl,
        videoPrompt,
        posts
    };
}

// Helper to strip HTML and preserve line breaks
function stripHtml(html: string): string {
    if (!html) return '';
    // Create a temporary element
    const tmp = document.createElement("DIV");
    // Replace block tags with newlines first so we don't lose formatting
    const formattedHtml = html
        .replace(/<\/p>/g, '\n\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<\/div>/g, '\n');
    tmp.innerHTML = formattedHtml;
    // Get text content and trim extra whitespace
    const text = (tmp.textContent || tmp.innerText || "").replace(/\n\s*\n/g, '\n\n').trim();
    return text;
}

// Extract topic from memoir content
function extractTopic(memoirPassage: string, chapterTitle: string): string {
    const cleanPassage = stripHtml(memoirPassage);
    // Extract first meaningful sentence as topic hook
    const sentences = cleanPassage.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const hookSentence = sentences[0]?.trim() || '';

    // Identify themes
    const themes: string[] = [];
    const themeKeywords: Record<string, string[]> = {
        'transformation': ['change', 'transform', 'become', 'evolve', 'grow', 'shift'],
        'love': ['love', 'heart', 'care', 'cherish', 'beloved'],
        'loss': ['lost', 'grief', 'miss', 'gone', 'death', 'passed'],
        'resilience': ['overcome', 'strength', 'survive', 'persist', 'endure'],
        'family': ['mother', 'father', 'sister', 'brother', 'family', 'child'],
        'identity': ['who I am', 'myself', 'identity', 'discover', 'realize'],
        'growth': ['learn', 'lesson', 'wisdom', 'understand', 'realize']
    };

    const lowerContent = cleanPassage.toLowerCase();
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
        if (keywords.some(kw => lowerContent.includes(kw))) {
            themes.push(theme);
        }
    }

    const primaryTheme = themes[0] || 'personal journey';
    return `${primaryTheme} story from "${chapterTitle}": ${hookSentence.substring(0, 100)}...`;
}

// Generate video scene description from memoir content
function generateVideoScene(memoirPassage: string, chapterTitle: string): string {
    const cleanPassage = stripHtml(memoirPassage);
    // Find the most emotionally charged sentence
    const sentences = cleanPassage.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Look for action words or visual moments
    const visualSentences = sentences.filter(s => {
        const lower = s.toLowerCase();
        return lower.includes('i saw') || lower.includes('i felt') ||
            lower.includes('looking') || lower.includes('walking') ||
            lower.includes('sitting') || lower.includes('standing') ||
            lower.includes('remember') || lower.includes('moment');
    });

    const bestVisualMoment = visualSentences[0] || sentences[0] || '';
    const voiceover = sentences.slice(0, 2).join(' ').substring(0, 80);

    return `Scene: ${bestVisualMoment.trim() || 'A person in a moment of quiet reflection'}, inspired by "${chapterTitle}"
Setting: Natural lighting, intimate space that feels like a memory
Action: The subject pauses, a look of realization crossing their face
Emotion: Authentic vulnerability transitioning to quiet strength
Voiceover: "${voiceover}..."`;
}

// --- Context Generation Helpers (from Antigravity Guide) ---

function formatChapterContext(chapter: Chapter, text: string): string {
    const summary = text.slice(0, 300).replace(/\n/g, ' ') + '...';
    return `CURRENT CHAPTER: Chapter ${chapter.chapterNumber} - "${chapter.title}"

CHAPTER SUMMARY: ${summary}

KEY SCENES:
- [Auto-detected] ${text.split('.')[0] || 'Key moment from this chapter'}
- [Auto-detected] ${text.split('.')[1] || 'Another significant moment'}

EMOTIONAL ARC: From vulnerability → realization → strength`;
}

function formatButterflyTheme(chapter: Chapter, _text: string): string {
    const stage = chapter.butterflyStage || 'chrysalis';

    // Map App types to Guide descriptions
    let description = 'Transformation stage.';
    if (stage === 'cocoon') description = 'Heavy, grounded, inner preparation.';
    else if (stage === 'chrysalis') description = 'Enclosed, dissolving, quiet, internal work.';
    else if (stage === 'butterfly') description = 'Breaking free, flight, perspective, freedom.';

    return `BUTTERFLY CONNECTION: This content reflects the ${stage} stage.
    
VISUAL METAPHOR: ${description}`;
}

function formatWisdomLessons(_text: string): string {
    return `CORE LESSON: [Extract the main lesson here]

SUPPORTING INSIGHTS:
- Insight 1
- Insight 2

APPLICABLE TO: Anyone going through a major life transition.

WISDOM HOOK: "The Struggle / Was The Path"`;
}

function formatAuthorVoice(user: any): string {
    return `AUTHOR NAME: ${user?.displayName || 'The Author'}

VOICE CHARACTERISTICS:
- Honest and vulnerable
- Uses sensory details
- Finds hope in the struggle
- Speaks as a fellow traveler

SIGNATURE PHRASES:
- "Here is what I learned..."
- "I didn't expect this..."`;
}

const SocialMediaRepurpose = () => {
    const { currentUser } = useAuth();
    const [chapters, setChapters] = useState<Chapter[]>([]);

    // Chapter selection - persist to localStorage
    const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
        try {
            return localStorage.getItem('sm_selectedChapterId') || '';
        } catch { return ''; }
    });
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [chapterContent, setChapterContent] = useState<string>('');
    const [selectedText, setSelectedText] = useState<string>(() => {
        try {
            return localStorage.getItem('sm_selectedText') || '';
        } catch { return ''; }
    });
    const [isSelectAll, setIsSelectAll] = useState(true);

    // Context generation (New System) - persist to localStorage
    const [contextTab, setContextTab] = useState<'chapter' | 'theme' | 'wisdom' | 'voice'>('chapter');
    const [contextFields, setContextFields] = useState(() => {
        try {
            const saved = localStorage.getItem('sm_contextFields');
            return saved ? JSON.parse(saved) : {
                chapter_context: '',
                butterfly_theme: '',
                wisdom_lessons: '',
                author_voice: ''
            };
        } catch {
            return {
                chapter_context: '',
                butterfly_theme: '',
                wisdom_lessons: '',
                author_voice: ''
            };
        }
    });
    const [isEditingContext, setIsEditingContext] = useState(false);

    // Legacy prompt generation (kept for fallback) - persist to localStorage
    const [generatedTopic, setGeneratedTopic] = useState<string>(() => {
        try {
            return localStorage.getItem('sm_generatedTopic') || '';
        } catch { return ''; }
    });
    const [generatedVideoScene, setGeneratedVideoScene] = useState<string>(() => {
        try {
            return localStorage.getItem('sm_generatedVideoScene') || '';
        } catch { return ''; }
    });
    const [isEditingPrompt, setIsEditingPrompt] = useState(false);

    // Tone selection - persist to localStorage
    const [selectedTone, setSelectedTone] = useState<string>(() => {
        try {
            return localStorage.getItem('sm_selectedTone') || 'inspirational';
        } catch { return 'inspirational'; }
    });

    // Loading states (not persisted - reset on navigation)
    const [isLoading, setIsLoading] = useState({ posts: false, images: false, videos: false });
    const [errors, setErrors] = useState<{ posts: string | null; images: string | null; videos: string | null }>({
        posts: null, images: null, videos: null
    });

    // Results - Initialize from localStorage if available
    const [postResults, setPostResults] = useState<PostResult[]>(() => {
        try {
            const saved = localStorage.getItem('sm_postResults');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [imageResults, setImageResults] = useState<ImageResult | null>(() => {
        try {
            const saved = localStorage.getItem('sm_imageResults');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [videoResults, setVideoResults] = useState<VideoResult | null>(() => {
        try {
            const saved = localStorage.getItem('sm_videoResults');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [activeResultTab, setActiveResultTab] = useState<'posts' | 'images' | 'videos'>(() => {
        try {
            const saved = localStorage.getItem('sm_activeTab');
            return (saved as 'posts' | 'images' | 'videos') || 'posts';
        } catch { return 'posts'; }
    });
    const [showResults, setShowResults] = useState(() => {
        try {
            return localStorage.getItem('sm_showResults') === 'true';
        } catch { return false; }
    });

    // History - Initialize from localStorage
    const [history, setHistory] = useState<GenerationHistory[]>(() => {
        try {
            const saved = localStorage.getItem('sm_history');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Restore Date objects from ISO strings
                return parsed.map((h: any) => ({
                    ...h,
                    timestamp: new Date(h.timestamp)
                }));
            }
            return [];
        } catch { return []; }
    });

    // Copy state
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Video save state
    const [isSavingVideo, setIsSavingVideo] = useState(false);
    const [videoSavedId, setVideoSavedId] = useState<string | null>(null);

    // Persist results to localStorage when they change
    useEffect(() => {
        try {
            localStorage.setItem('sm_postResults', JSON.stringify(postResults));
        } catch (e) { console.warn('Failed to save postResults:', e); }
    }, [postResults]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_imageResults', JSON.stringify(imageResults));
        } catch (e) { console.warn('Failed to save imageResults:', e); }
    }, [imageResults]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_videoResults', JSON.stringify(videoResults));
        } catch (e) { console.warn('Failed to save videoResults:', e); }
    }, [videoResults]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_activeTab', activeResultTab);
            localStorage.setItem('sm_showResults', String(showResults));
        } catch (e) { console.warn('Failed to save tab state:', e); }
    }, [activeResultTab, showResults]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_history', JSON.stringify(history));
        } catch (e) { console.warn('Failed to save history:', e); }
    }, [history]);

    // Persist chapter selection and related state
    useEffect(() => {
        try {
            localStorage.setItem('sm_selectedChapterId', selectedChapterId);
        } catch (e) { console.warn('Failed to save selectedChapterId:', e); }
    }, [selectedChapterId]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_selectedText', selectedText);
        } catch (e) { console.warn('Failed to save selectedText:', e); }
    }, [selectedText]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_selectedTone', selectedTone);
        } catch (e) { console.warn('Failed to save selectedTone:', e); }
    }, [selectedTone]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_contextFields', JSON.stringify(contextFields));
        } catch (e) { console.warn('Failed to save contextFields:', e); }
    }, [contextFields]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_generatedTopic', generatedTopic);
        } catch (e) { console.warn('Failed to save generatedTopic:', e); }
    }, [generatedTopic]);

    useEffect(() => {
        try {
            localStorage.setItem('sm_generatedVideoScene', generatedVideoScene);
        } catch (e) { console.warn('Failed to save generatedVideoScene:', e); }
    }, [generatedVideoScene]);

    // Load chapters
    useEffect(() => {
        if (!currentUser) return;
        return subscribeToChapters(currentUser.uid, setChapters);
    }, [currentUser]);

    // Load chapter content when selected
    useEffect(() => {
        if (selectedChapterId) {
            const chapter = chapters.find(c => c.id === selectedChapterId);
            setSelectedChapter(chapter || null);

            fetchLatestVersion(selectedChapterId).then(version => {
                if (version?.content) {
                    // Store raw content for future reference if needed, but primarily work with text
                    setChapterContent(version.content);

                    if (isSelectAll) {
                        const plainText = stripHtml(version.content);
                        setSelectedText(plainText);
                    }
                }
            });
        }
    }, [selectedChapterId, chapters, isSelectAll]);

    // Auto-generate prompts and context when content changes
    useEffect(() => {
        if (selectedText && selectedChapter) {
            // Legacy
            setGeneratedTopic(extractTopic(selectedText, selectedChapter.title));
            setGeneratedVideoScene(generateVideoScene(selectedText, selectedChapter.title));

            // New Context System
            setContextFields({
                chapter_context: formatChapterContext(selectedChapter, selectedText),
                butterfly_theme: formatButterflyTheme(selectedChapter, selectedText),
                wisdom_lessons: formatWisdomLessons(selectedText),
                author_voice: formatAuthorVoice(currentUser)
            });
        }
    }, [selectedText, selectedChapter, currentUser]);

    // Send to n8n webhook
    const sendToN8N = async (type: 'Post' | 'Image' | 'Video') => {
        if (!selectedText || selectedText.length < 20) {
            alert('Please select more content (at least 20 characters).');
            return;
        }

        // Set loading state
        setIsLoading(prev => ({
            ...prev,
            [type.toLowerCase() + 's']: true
        }));
        setErrors(prev => ({
            ...prev,
            [type.toLowerCase() + 's']: null
        }));

        // Build payload with BOTH legacy and new context
        const payload: Record<string, any> = {
            // Legacy Routing
            type: type,
            // For videos, send the scene description as primary content; for others, send the selected text
            content: type === 'Video'
                ? generatedVideoScene
                : selectedText.substring(0, 2000),
            chapter_title: selectedChapter?.title || 'Untitled',
            author_name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Author',
            brand: 'Chrysalis Memoir',
            tone: selectedTone, // Global tone

            // New Antigravity Prompt Context
            chapter_context: contextFields.chapter_context,
            butterfly_theme: contextFields.butterfly_theme,
            wisdom_lessons: contextFields.wisdom_lessons,
            author_voice: contextFields.author_voice,
            content_request: `Create ${type} content for likely platforms.`
        };

        // Legacy Type-specific fields (for backward compatibility)
        if (type === 'Post' || type === 'Image') {
            payload.topic = generatedTopic;
        }

        if (type === 'Video') {
            payload.video_scene = generatedVideoScene;
            payload.source_text = selectedText.substring(0, 500); // Include some source text for context
        }

        try {
            const controller = new AbortController();
            // Videos take MUCH longer to generate - use 10 MINUTE timeout
            // n8n video generation can take 3-8 minutes depending on the AI model
            const timeoutMs = type === 'Video' ? 600000 : 120000; // 10 mins for video, 2 mins for others
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            console.log(`Sending ${type} request to n8n:`, payload);
            console.log(`Timeout set to ${timeoutMs / 1000} seconds`);

            // Call n8n directly - make sure n8n Respond to Webhook has CORS headers configured
            // For long-running video requests, n8n must keep the connection open
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Some browsers may need these for long requests
                    'Accept': '*/*'
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
                // Ensure the request is not cached
                cache: 'no-store'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
            }

            // Check content type to determine how to parse
            const contentType = response.headers.get('content-type') || '';
            console.log(`Response content-type: ${contentType}`);

            let data: any;

            // Helper function to convert blob to base64 data URL (persists across navigation)
            const blobToBase64 = (blob: Blob): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            // Handle binary responses (images/videos)
            if (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('application/octet-stream')) {
                console.log('Received binary response, converting to base64...');
                const blob = await response.blob();
                const base64Url = await blobToBase64(blob);

                if (type === 'Image' || contentType.includes('image/')) {
                    data = { imageUrl: base64Url, binaryType: 'image' };
                } else {
                    data = { videoUrl: base64Url, binaryType: 'video' };
                }
            } else {
                // Try to parse as JSON first
                const text = await response.text();
                console.log('Response text (first 500 chars):', text.substring(0, 500));

                // Check if it looks like binary data that wasn't properly content-typed
                if (text.startsWith('\x89PNG') || text.startsWith('GIF') || text.startsWith('\xFF\xD8')) {
                    console.log('Detected binary image in text response, converting to base64...');
                    const blob = new Blob([text], { type: 'image/png' });
                    const base64Url = await blobToBase64(blob);
                    data = { imageUrl: base64Url, binaryType: 'image' };
                } else {
                    try {
                        data = JSON.parse(text);
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError);
                        // If JSON parsing fails, treat the text as raw content
                        data = { output: text };
                    }
                }
            }

            console.log(`${type} response data:`, data);

            // Parse response based on type
            if (type === 'Post') {
                const parsed = parsePostResponse(data);
                setPostResults(parsed);
                setActiveResultTab('posts');
            } else if (type === 'Image') {
                // Handle binary image response
                if (data.binaryType === 'image' || data.imageUrl) {
                    setImageResults({
                        imageUrl: data.imageUrl || '',
                        imagePrompt: data.prompt || '',
                        posts: []
                    });
                } else {
                    const parsed = parseImageResponse(data);
                    setImageResults(parsed);
                    setPostResults(parsed.posts);
                }
                setActiveResultTab('images');
            } else if (type === 'Video') {
                // Handle binary video response
                if (data.binaryType === 'video' || data.videoUrl) {
                    setVideoResults({
                        videoUrl: data.videoUrl || '',
                        videoPrompt: data.prompt || '',
                        posts: {}
                    });
                } else {
                    const parsed = parseVideoResponse(data);
                    setVideoResults(parsed);
                }
                setActiveResultTab('videos');
            }

            setShowResults(true);

            // Add to history (with payload for potential re-use)
            setHistory(prev => [{
                id: Date.now().toString(),
                timestamp: new Date(),
                chapterTitle: selectedChapter?.title || 'Unknown',
                type: type,
                status: 'complete',
                payload: payload
            }, ...prev.slice(0, 9)]); // Keep last 10

        } catch (error: any) {
            console.error(`${type} generation error:`, error);

            let errorMessage: string;
            let historyStatus: 'error' | 'pending' = 'error';

            if (error.name === 'AbortError') {
                if (type === 'Video') {
                    errorMessage = 'Video generation timed out after 10 minutes. Your video may still be processing in n8n. Use the Retry button to check.';
                    historyStatus = 'pending'; // Mark as pending, not error
                } else {
                    errorMessage = 'Request timed out. The generation may still be processing.';
                }
            } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                // Connection was dropped during long request
                if (type === 'Video') {
                    errorMessage = 'Connection dropped during video generation. Your video may still be processing. Try the Retry button in a few minutes.';
                    historyStatus = 'pending';
                } else {
                    errorMessage = 'Network error. Please try again.';
                }
            } else {
                errorMessage = error.message || 'Unknown error occurred';
            }

            setErrors(prev => ({
                ...prev,
                [type.toLowerCase() + 's']: errorMessage
            }));

            // Add to history with payload for retry
            setHistory(prev => [{
                id: Date.now().toString(),
                timestamp: new Date(),
                chapterTitle: selectedChapter?.title || 'Unknown',
                type: type,
                status: historyStatus,
                errorMessage: historyStatus === 'error' ? errorMessage : undefined,
                payload: payload, // Save for retry
                retryCount: 0
            }, ...prev.slice(0, 9)]);

        } finally {
            setIsLoading(prev => ({
                ...prev,
                [type.toLowerCase() + 's']: false
            }));
        }
    };

    // Copy to clipboard
    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Save video to Firebase library
    const handleSaveVideoToLibrary = async () => {
        if (!videoResults?.videoUrl || !currentUser) {
            console.error('No video URL or user to save');
            return;
        }

        setIsSavingVideo(true);

        try {
            const { id, url } = await saveGeneratedVideo(
                currentUser.uid,
                selectedChapterId || null,
                videoResults.videoUrl,
                'social-media',
                {
                    title: selectedChapter?.title
                        ? `${selectedChapter.title} - Social Media Video`
                        : 'Generated Video',
                    prompt: videoResults.videoPrompt,
                    platforms: videoResults.posts as Record<string, string>
                }
            );

            console.log('Video saved to library:', id, url);

            // Update the video URL to the permanent Firebase URL if it changed
            if (url !== videoResults.videoUrl) {
                setVideoResults(prev => prev ? { ...prev, videoUrl: url } : null);
            }

            // Show success state
            setVideoSavedId(id);
            setTimeout(() => setVideoSavedId(null), 3000);

        } catch (error) {
            console.error('Failed to save video:', error);
            alert('Failed to save video to library. Check console for details.');
        } finally {
            setIsSavingVideo(false);
        }
    };

    // Retry a failed/pending request from history
    const retryFromHistory = async (historyItem: GenerationHistory) => {
        if (!historyItem.payload) {
            console.error('No payload saved for retry');
            return;
        }

        const type = historyItem.type;

        // Update history item status to show retrying
        setHistory(prev => prev.map(h =>
            h.id === historyItem.id
                ? { ...h, status: 'pending' as const, errorMessage: undefined, retryCount: (h.retryCount || 0) + 1 }
                : h
        ));

        // Set loading state
        setIsLoading(prev => ({
            ...prev,
            [type.toLowerCase() + 's']: true
        }));
        setErrors(prev => ({
            ...prev,
            [type.toLowerCase() + 's']: null
        }));

        try {
            const controller = new AbortController();
            const timeoutMs = type === 'Video' ? 300000 : 120000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            console.log(`Retrying ${type} request:`, historyItem.payload);

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(historyItem.payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Webhook error: ${response.status}`);
            }

            // Handle response (same logic as sendToN8N)
            const contentType = response.headers.get('content-type') || '';
            let data: any;

            const blobToBase64 = (blob: Blob): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            if (contentType.includes('image/') || contentType.includes('video/') || contentType.includes('application/octet-stream')) {
                const blob = await response.blob();
                const base64Url = await blobToBase64(blob);
                if (type === 'Image' || contentType.includes('image/')) {
                    data = { imageUrl: base64Url, binaryType: 'image' };
                } else {
                    data = { videoUrl: base64Url, binaryType: 'video' };
                }
            } else {
                const text = await response.text();
                try {
                    data = JSON.parse(text);
                } catch {
                    data = { output: text };
                }
            }

            // Update results based on type
            if (type === 'Post') {
                setPostResults(parsePostResponse(data));
                setActiveResultTab('posts');
            } else if (type === 'Image') {
                if (data.binaryType === 'image' || data.imageUrl) {
                    setImageResults({ imageUrl: data.imageUrl || '', imagePrompt: '', posts: [] });
                } else {
                    const parsed = parseImageResponse(data);
                    setImageResults(parsed);
                }
                setActiveResultTab('images');
            } else if (type === 'Video') {
                if (data.binaryType === 'video' || data.videoUrl) {
                    setVideoResults({ videoUrl: data.videoUrl || '', videoPrompt: '', posts: {} });
                } else {
                    setVideoResults(parseVideoResponse(data));
                }
                setActiveResultTab('videos');
            }

            setShowResults(true);

            // Update history item to complete
            setHistory(prev => prev.map(h =>
                h.id === historyItem.id
                    ? { ...h, status: 'complete' as const, errorMessage: undefined }
                    : h
            ));

        } catch (error: any) {
            const errorMessage = error.name === 'AbortError'
                ? `Still processing... (attempt ${(historyItem.retryCount || 0) + 1})`
                : error.message;

            // Update history item with error
            setHistory(prev => prev.map(h =>
                h.id === historyItem.id
                    ? { ...h, status: 'error' as const, errorMessage }
                    : h
            ));

            setErrors(prev => ({
                ...prev,
                [type.toLowerCase() + 's']: errorMessage
            }));
        } finally {
            setIsLoading(prev => ({
                ...prev,
                [type.toLowerCase() + 's']: false
            }));
        }
    };

    // Word count
    const wordCount = selectedText.split(/\s+/).filter(w => w.length > 0).length;

    // Get platform icon
    const getPlatformIcon = (platformName: string) => {
        const platform = PLATFORMS.find(p =>
            p.label.toLowerCase().includes(platformName.toLowerCase()) ||
            platformName.toLowerCase().includes(p.id)
        );
        return platform?.icon || FileText;
    };

    const getPlatformColor = (platformName: string) => {
        const platform = PLATFORMS.find(p =>
            p.label.toLowerCase().includes(platformName.toLowerCase()) ||
            platformName.toLowerCase().includes(p.id)
        );
        return platform?.color || '#666';
    };

    return (
        <div className="page-container" style={{ paddingBottom: '5rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    padding: '0.5rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(107, 73, 132, 0.1), rgba(212, 175, 55, 0.1))',
                    borderRadius: '999px',
                    border: '1px solid var(--color-primary-light)'
                }}>
                    <Share2 size={18} color="var(--color-primary)" />
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        Social Media Repurpose
                    </span>
                </div>
                <h1 className="text-serif" style={{ fontSize: '2.5rem', margin: '0 0 0.75rem 0' }}>
                    Transform Your Story
                </h1>
                <p style={{ color: '#666', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Turn your memoir passages into scroll-stopping social content
                </p>
            </header>

            {/* Main 3-Panel Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '300px 1fr 320px',
                gap: '1.5rem',
                alignItems: 'start'
            }}>
                {/* LEFT PANEL - Content Source */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '1rem'
                    }}>
                        Content Source
                    </h3>

                    {/* Chapter Selector */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                            Select Chapter
                        </label>
                        <select
                            value={selectedChapterId}
                            onChange={(e) => setSelectedChapterId(e.target.value)}
                            className="status-select"
                            style={{ width: '100%' }}
                        >
                            <option value="">Choose a chapter...</option>
                            {chapters.map(c => (
                                <option key={c.id} value={c.id}>
                                    Ch. {c.chapterNumber}: {c.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Content Preview */}
                    {selectedChapterId ? (
                        <div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.75rem'
                            }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    Content
                                </label>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem',
                                    color: '#666',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={isSelectAll}
                                        onChange={(e) => {
                                            setIsSelectAll(e.target.checked);
                                            if (e.target.checked) {
                                                setSelectedText(stripHtml(chapterContent));
                                            }
                                        }}
                                    />
                                    All
                                </label>
                            </div>

                            <div style={{
                                height: '220px',
                                overflowY: 'auto',
                                padding: '1rem',
                                background: '#f9f9f9',
                                borderRadius: '0.5rem',
                                border: '1px solid #e5e7eb',
                                fontSize: '0.85rem',
                                lineHeight: 1.6,
                                color: '#444'
                            }}>
                                {isSelectAll ? (
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {selectedText || 'No content in this chapter yet.'}
                                    </div>
                                ) : (
                                    <textarea
                                        value={selectedText}
                                        onChange={(e) => setSelectedText(e.target.value)}
                                        placeholder="Paste or type the specific passage..."
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                            background: 'transparent',
                                            resize: 'none',
                                            outline: 'none',
                                            fontFamily: 'inherit',
                                            fontSize: 'inherit',
                                            lineHeight: 'inherit'
                                        }}
                                    />
                                )}
                            </div>

                            {/* Word count & tags */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '0.75rem',
                                fontSize: '0.75rem',
                                color: '#999'
                            }}>
                                <span>{wordCount} words</span>
                                {selectedChapter?.butterflyStage && (
                                    <span style={{
                                        background: 'var(--color-hover)',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '999px',
                                        color: 'var(--color-primary)'
                                    }}>
                                        🦋 {selectedChapter.butterflyStage}
                                    </span>
                                )}
                            </div>

                            {/* Tone Selection */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
                                    Tone
                                </label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '0.4rem'
                                }}>
                                    {TONES.map(tone => (
                                        <button
                                            key={tone.id}
                                            onClick={() => setSelectedTone(tone.id)}
                                            className="btn"
                                            style={{
                                                padding: '0.4rem 0.5rem',
                                                fontSize: '0.7rem',
                                                gap: '0.3rem',
                                                background: selectedTone === tone.id
                                                    ? 'var(--color-primary)'
                                                    : '#f3f4f6',
                                                color: selectedTone === tone.id
                                                    ? 'white'
                                                    : '#666',
                                                border: 'none',
                                                justifyContent: 'flex-start'
                                            }}
                                        >
                                            {tone.emoji} {tone.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            height: '300px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(107, 73, 132, 0.05), rgba(212, 175, 55, 0.05))',
                            borderRadius: '1rem',
                            textAlign: 'center',
                            padding: '2rem'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🦋</div>
                            <p style={{ color: '#999', fontSize: '0.9rem' }}>
                                Select a chapter to begin
                            </p>
                        </div>
                    )}
                </div>

                {/* CENTER PANEL - Generation Hub */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '1rem'
                    }}>
                        Generation Hub
                    </h3>

                    {/* Prompt Preview */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        {/* Prompt Context Manager */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem'
                            }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                    Context & Strategy
                                </label>
                                <button
                                    onClick={() => setIsEditingContext(!isEditingContext)}
                                    className="btn"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                >
                                    {isEditingContext ? 'Done' : 'Edit'}
                                </button>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                                {[
                                    { id: 'chapter', label: 'Chapter' },
                                    { id: 'theme', label: 'Theme' },
                                    { id: 'wisdom', label: 'Wisdom' },
                                    { id: 'voice', label: 'Voice' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setContextTab(tab.id as any)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: contextTab === tab.id ? 'white' : '#f3f4f6',
                                            color: contextTab === tab.id ? 'var(--color-primary)' : '#666',
                                            border: '1px solid #e5e7eb',
                                            borderBottom: contextTab === tab.id ? 'none' : '1px solid #e5e7eb',
                                            borderRadius: '0.5rem 0.5rem 0 0',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Active Tab Content */}
                            <textarea
                                value={
                                    contextTab === 'chapter' ? contextFields.chapter_context :
                                        contextTab === 'theme' ? contextFields.butterfly_theme :
                                            contextTab === 'wisdom' ? contextFields.wisdom_lessons :
                                                contextFields.author_voice
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setContextFields((prev: typeof contextFields) => ({
                                        ...prev,
                                        [contextTab === 'chapter' ? 'chapter_context' :
                                            contextTab === 'theme' ? 'butterfly_theme' :
                                                contextTab === 'wisdom' ? 'wisdom_lessons' :
                                                    'author_voice']: val
                                    }));
                                }}
                                readOnly={!isEditingContext}
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    padding: '0.75rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0 0 0.5rem 0.5rem',
                                    fontSize: '0.8rem',
                                    resize: 'none',
                                    fontFamily: 'inherit',
                                    lineHeight: 1.5,
                                    background: isEditingContext ? 'white' : '#f9f9f9',
                                    color: '#444'
                                }}
                            />
                        </div>
                    </div>

                    {/* Generated Topic/Scene Preview */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                Generated Topic/Scene
                            </label>
                            <button
                                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                                className="btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            >
                                {isEditingPrompt ? 'Done' : 'Edit'}
                            </button>
                        </div>
                        <textarea
                            value={activeResultTab === 'videos' ? generatedVideoScene : generatedTopic}
                            onChange={(e) => {
                                if (activeResultTab === 'videos') {
                                    setGeneratedVideoScene(e.target.value);
                                } else {
                                    setGeneratedTopic(e.target.value);
                                }
                            }}
                            readOnly={!isEditingPrompt}
                            placeholder="Select content to auto-generate a topic..."
                            style={{
                                width: '100%',
                                height: '100px',
                                padding: '0.75rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                fontSize: '0.8rem',
                                resize: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.5,
                                background: isEditingPrompt ? 'white' : '#f9f9f9',
                                color: '#444'
                            }}
                        />
                    </div>


                    {/* Three Main Generation Buttons */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        {/* Posts Button */}
                        <button
                            onClick={() => sendToN8N('Post')}
                            disabled={isLoading.posts || !selectedText}
                            className="btn"
                            style={{
                                flexDirection: 'column',
                                padding: '1.5rem 1rem',
                                gap: '0.75rem',
                                background: isLoading.posts
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #6B4984, #8B5CA0)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '1rem',
                                opacity: !selectedText ? 0.5 : 1
                            }}
                        >
                            {isLoading.posts ? (
                                <Loader2 size={28} className="animate-spin" />
                            ) : (
                                <FileText size={28} />
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>POSTS</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Text content</span>
                        </button>

                        {/* Images Button */}
                        <button
                            onClick={() => sendToN8N('Image')}
                            disabled={isLoading.images || !selectedText}
                            className="btn"
                            style={{
                                flexDirection: 'column',
                                padding: '1.5rem 1rem',
                                gap: '0.75rem',
                                background: isLoading.images
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #D4AF37, #C5A028)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '1rem',
                                opacity: !selectedText ? 0.5 : 1
                            }}
                        >
                            {isLoading.images ? (
                                <Loader2 size={28} className="animate-spin" />
                            ) : (
                                <ImageIcon size={28} />
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>IMAGES</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Visual content</span>
                        </button>

                        {/* Videos Button */}
                        <button
                            onClick={() => sendToN8N('Video')}
                            disabled={isLoading.videos || !selectedText}
                            className="btn"
                            style={{
                                flexDirection: 'column',
                                padding: '1.5rem 1rem',
                                gap: '0.75rem',
                                background: isLoading.videos
                                    ? '#e5e7eb'
                                    : 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '1rem',
                                opacity: !selectedText ? 0.5 : 1
                            }}
                        >
                            {isLoading.videos ? (
                                <Loader2 size={28} className="animate-spin" />
                            ) : (
                                <Video size={28} />
                            )}
                            <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>VIDEOS</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Clips & scripts</span>
                        </button>
                    </div>

                    {/* Error Display */}
                    {(errors.posts || errors.images || errors.videos) && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem'
                        }}>
                            <AlertCircle size={16} color="#dc2626" style={{ marginTop: '0.1rem' }} />
                            <div style={{ fontSize: '0.8rem', color: '#dc2626' }}>
                                {errors.posts || errors.images || errors.videos}
                            </div>
                        </div>
                    )}

                    {/* Results Tabs */}
                    {showResults && (
                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['posts', 'images', 'videos'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveResultTab(tab as any)}
                                            className="btn"
                                            style={{
                                                padding: '0.4rem 0.75rem',
                                                fontSize: '0.8rem',
                                                background: activeResultTab === tab ? 'var(--color-primary)' : '#f3f4f6',
                                                color: activeResultTab === tab ? 'white' : '#666',
                                                border: 'none',
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setShowResults(false)}
                                    className="btn"
                                    style={{ padding: '0.3rem', fontSize: '0.7rem' }}
                                >
                                    <ChevronUp size={14} />
                                </button>
                            </div>

                            {/* Posts Results */}
                            {activeResultTab === 'posts' && postResults.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: '0.75rem',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    {postResults.map((post, idx) => {
                                        const Icon = getPlatformIcon(post.platform);
                                        const color = getPlatformColor(post.platform);
                                        const postId = `post-${idx}`;

                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    background: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '0.75rem',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div style={{
                                                    background: color,
                                                    color: 'white',
                                                    padding: '0.5rem 0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600
                                                }}>
                                                    <Icon size={14} />
                                                    {post.platform}
                                                </div>
                                                <div style={{ padding: '0.75rem' }}>
                                                    {post.title && (
                                                        <div style={{
                                                            fontWeight: 600,
                                                            fontSize: '0.85rem',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            {post.title}
                                                        </div>
                                                    )}
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: '#444',
                                                        lineHeight: 1.6,
                                                        maxHeight: '200px',
                                                        overflowY: 'auto',
                                                        whiteSpace: 'pre-wrap'
                                                    }}>
                                                        {post.caption}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginTop: '0.75rem',
                                                        paddingTop: '0.5rem',
                                                        borderTop: '1px solid #f3f4f6'
                                                    }}>
                                                        <span style={{ fontSize: '0.7rem', color: '#999' }}>
                                                            {post.caption?.length || 0} chars
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(post.caption, postId)}
                                                            className="btn"
                                                            style={{
                                                                padding: '0.25rem 0.5rem',
                                                                fontSize: '0.7rem',
                                                                gap: '0.3rem',
                                                                background: copiedId === postId ? '#10b981' : undefined,
                                                                color: copiedId === postId ? 'white' : undefined
                                                            }}
                                                        >
                                                            {copiedId === postId ? <Check size={12} /> : <Copy size={12} />}
                                                            {copiedId === postId ? 'Copied!' : 'Copy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Image Results */}
                            {activeResultTab === 'images' && imageResults && (
                                <div>
                                    {imageResults.imageUrl && (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <img
                                                src={imageResults.imageUrl}
                                                alt="Generated"
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '300px',
                                                    objectFit: 'cover',
                                                    borderRadius: '0.75rem'
                                                }}
                                            />
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                marginTop: '0.75rem'
                                            }}>
                                                <a
                                                    href={imageResults.imageUrl}
                                                    download
                                                    className="btn"
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.5rem',
                                                        fontSize: '0.8rem',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    <Download size={14} /> Download Image
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {!imageResults.imageUrl && (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '2rem',
                                            color: '#999'
                                        }}>
                                            No image URL returned. Check the prompt or try again.
                                        </div>
                                    )}
                                </div>
                            )}

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
                                            <div style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                marginTop: '0.75rem'
                                            }}>
                                                <a
                                                    href={videoResults.videoUrl}
                                                    download
                                                    className="btn"
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.5rem',
                                                        fontSize: '0.8rem',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    <Download size={14} /> Download Video
                                                </a>
                                                <button
                                                    onClick={handleSaveVideoToLibrary}
                                                    disabled={isSavingVideo || !!videoSavedId}
                                                    className="btn btn-primary"
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.5rem',
                                                        fontSize: '0.8rem',
                                                        gap: '0.4rem',
                                                        background: videoSavedId
                                                            ? '#10b981'
                                                            : isSavingVideo
                                                                ? '#9ca3af'
                                                                : undefined
                                                    }}
                                                >
                                                    {isSavingVideo ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : videoSavedId ? (
                                                        <>
                                                            <Check size={14} />
                                                            Saved to Library!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save size={14} />
                                                            Save to Library
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Video Posts */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: '0.75rem',
                                        marginTop: '1rem'
                                    }}>
                                        {Object.entries(videoResults.posts).map(([platform, content]) => {
                                            if (!content || typeof content === 'object' && !content.title) return null;
                                            const Icon = getPlatformIcon(platform);
                                            const color = getPlatformColor(platform);
                                            const text = typeof content === 'string' ? content : content.description || content.title;

                                            return (
                                                <div
                                                    key={platform}
                                                    style={{
                                                        background: 'white',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '0.75rem',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <div style={{
                                                        background: color,
                                                        color: 'white',
                                                        padding: '0.4rem 0.6rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        <Icon size={12} />
                                                        {platform}
                                                    </div>
                                                    <div style={{
                                                        padding: '0.6rem',
                                                        fontSize: '0.75rem',
                                                        color: '#444',
                                                        maxHeight: '80px',
                                                        overflowY: 'auto'
                                                    }}>
                                                        {text}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* No Results */}
                            {activeResultTab === 'posts' && postResults.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                    <Sparkles size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                                    <p>Generate posts to see results here</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL - History & Status */}
                <div>
                    {/* Status Card */}
                    {(isLoading.posts || isLoading.images || isLoading.videos) && (
                        <div className="card" style={{
                            padding: '1.5rem',
                            marginBottom: '1rem',
                            background: 'linear-gradient(135deg, rgba(107, 73, 132, 0.05), rgba(212, 175, 55, 0.05))',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                margin: '0 auto 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div className="animate-pulse" style={{ fontSize: '2.5rem' }}>🦋</div>
                            </div>
                            <p style={{ fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                                Transforming...
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#999' }}>
                                {isLoading.posts && 'Creating post content...'}
                                {isLoading.images && 'Generating images with AI...'}
                                {isLoading.videos && 'Creating video (may take 60s)...'}
                            </p>
                        </div>
                    )}

                    {/* Recent Generations */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#999',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '1rem'
                        }}>
                            Generation History
                        </h4>

                        {history.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {history.map(item => (
                                    <div
                                        key={item.id}
                                        style={{
                                            padding: '0.75rem',
                                            background: '#f9f9f9',
                                            borderRadius: '0.5rem',
                                            borderLeft: `3px solid ${item.status === 'complete' ? '#10b981' :
                                                item.status === 'error' ? '#ef4444' : '#f59e0b'
                                                }`
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.25rem'
                                        }}>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem'
                                            }}>
                                                {item.type === 'Post' && <FileText size={12} />}
                                                {item.type === 'Image' && <ImageIcon size={12} />}
                                                {item.type === 'Video' && <Video size={12} />}
                                                {item.type}
                                            </span>
                                            {item.status === 'complete' && <Check size={14} color="#10b981" />}
                                            {item.status === 'error' && <AlertCircle size={14} color="#ef4444" />}
                                            {item.status === 'pending' && <Clock size={14} color="#f59e0b" />}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                                            {item.chapterTitle}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#999' }}>
                                            {item.timestamp.toLocaleTimeString()}
                                            {item.retryCount && item.retryCount > 0 && (
                                                <span style={{ marginLeft: '0.5rem', color: '#f59e0b' }}>
                                                    (retry #{item.retryCount})
                                                </span>
                                            )}
                                        </div>
                                        {item.errorMessage && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: '#ef4444',
                                                marginTop: '0.25rem'
                                            }}>
                                                {item.errorMessage.substring(0, 50)}...
                                            </div>
                                        )}
                                        {/* Retry button for failed/pending items */}
                                        {(item.status === 'error' || item.status === 'pending') && item.payload && (
                                            <button
                                                onClick={() => retryFromHistory(item)}
                                                disabled={isLoading[item.type.toLowerCase() + 's' as keyof typeof isLoading]}
                                                className="btn"
                                                style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.3rem 0.6rem',
                                                    fontSize: '0.7rem',
                                                    width: '100%',
                                                    background: isLoading[item.type.toLowerCase() + 's' as keyof typeof isLoading]
                                                        ? '#e5e7eb'
                                                        : item.status === 'pending' ? '#f59e0b' : '#ef4444',
                                                    color: 'white',
                                                    border: 'none'
                                                }}
                                            >
                                                {isLoading[item.type.toLowerCase() + 's' as keyof typeof isLoading] ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" style={{ marginRight: '0.3rem' }} />
                                                        Retrying...
                                                    </>
                                                ) : item.status === 'pending' ? (
                                                    <>
                                                        <RefreshCw size={12} style={{ marginRight: '0.3rem' }} />
                                                        Check Status
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw size={12} style={{ marginRight: '0.3rem' }} />
                                                        Retry
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '2rem 1rem',
                                color: '#ccc'
                            }}>
                                <Clock size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                <p style={{ fontSize: '0.8rem' }}>No generations yet</p>
                            </div>
                        )}
                    </div>

                    {/* Webhook Info */}
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#f9f9f9',
                        borderRadius: '0.5rem',
                        fontSize: '0.7rem',
                        color: '#999'
                    }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                            n8n Webhook
                        </div>
                        <div style={{ wordBreak: 'break-all' }}>
                            {N8N_WEBHOOK_URL.replace('https://', '').substring(0, 30)}...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialMediaRepurpose;
