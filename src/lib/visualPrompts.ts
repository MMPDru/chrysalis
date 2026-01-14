/**
 * CHRYSALIS VISUAL ORCHESTRATION ENGINE
 * Master prompts for Nanobanana (images) and Veo 3 (video) generation
 * Based on user's comprehensive specification
 * 
 * Color palette used throughout:
 * - Purple: #6B4984
 * - Gold: #D4AF37
 * - Teal: #2A9D8F
 * - Cream: #FDF8F4
 */


// Emotion to visual atmosphere mapping
const EMOTION_ATMOSPHERES: Record<string, string> = {
    'grief': 'twilight, muted blues, soft rain, gentle melancholy',
    'loss': 'twilight, muted blues, soft rain, gentle melancholy',
    'sadness': 'twilight, muted blues, soft rain, gentle melancholy',
    'fear': 'dramatic shadows, fog, stark contrasts, uncertain light',
    'anxiety': 'dramatic shadows, fog, tension, uncertain light',
    'anger': 'deep reds and blacks, storm imagery, sharp edges',
    'betrayal': 'deep reds and blacks, storm energy, sharp contrasts',
    'hope': 'golden hour light, dawn breaking, warm gradients',
    'renewal': 'golden hour light, dawn breaking, warm light emerging',
    'peace': 'soft pastels, calm water, open skies, serenity',
    'acceptance': 'soft pastels, calm water, open sky, serenity',
    'strength': 'bold colors, mountains, roots, strong verticals',
    'resilience': 'bold composition, mountains, deep roots, standing firm',
    'freedom': 'vast space, flight, breaking barriers, open horizons',
    'liberation': 'vast space, flight, breaking barriers, open horizons',
    'love': 'warm colors, intimate atmosphere, soft light',
    'transformation': 'chrysalis imagery, emerging butterfly, light breaking through'
};

// Wisdom author visual language
const WISDOM_VISUALS: Record<string, string> = {
    'jung': 'mirrors, reflections, dual imagery, light/dark contrast, shadow work, spiral paths, integration of opposites, depth, caves, ancient symbols',
    'singer': 'floating elements, open hands, release imagery, vast sky, freedom, unbound movement, still center, flowing water, soft edges, ascending energy',
    'watts': 'present moment focus, flowing water, nature patterns, fractals, organic flow, dance-like movement, lightness, cycles, seasons'
};

// Butterfly stage visual elements
const BUTTERFLY_STAGES: Record<string, string> = {
    'caterpillar': 'show potential, grounded, looking upward, before transformation',
    'cocoon': 'central mystery, transformation in progress, darkness before dawn, anticipation',
    'chrysalis': 'central mystery, transformation in progress, cracking open, light seeping through',
    'emergence': 'breaking free moment, vulnerability and strength, wings unfolding',
    'flight': 'freedom, soaring, achieved transformation, ascending',
    'fragility': 'delicate beauty, strength in vulnerability, detailed wing patterns',
    'metamorphosis': 'the process itself, complete transformation in progress'
};

export interface ChapterAnalysis {
    chapterNumber: number;
    chapterTitle: string;
    chapterSummary: string;
    coreEmotion: string;
    emotionalArc: string;
    lifeLessonTheme: string;
    wisdomAuthor: string;
    wisdomConcept: string;
    butterflyAnalogy: string;
    butterflyStage: string;
    keyImagery: string[];
    narrativeArc: string;
}

export interface GeneratedPrompts {
    coverPrompt: string;
    thumbnailPrompt: string;
    headerPrompt: string;
    videoPrompt: string;
    tikTokClipPrompt: string;
    analysis: ChapterAnalysis;
}

/**
 * Analyze chapter content to extract visual variables
 */
export function analyzeChapterContent(
    chapterNumber: number,
    chapterTitle: string,
    chapterContent: string,
    linkedWisdom?: { author?: string; concept?: string }
): ChapterAnalysis {
    const contentLower = chapterContent.toLowerCase();

    // Detect core emotion
    let coreEmotion = 'transformation';
    const emotionKeywords: Record<string, string[]> = {
        'grief': ['grief', 'mourning', 'death', 'died', 'funeral', 'loss of'],
        'loss': ['lost', 'losing', 'missing', 'gone forever'],
        'fear': ['afraid', 'scared', 'terrified', 'fear', 'nightmare'],
        'anxiety': ['anxious', 'worry', 'stressed', 'panic'],
        'anger': ['angry', 'furious', 'rage', 'hatred'],
        'betrayal': ['betrayed', 'betrayal', 'lied', 'cheated'],
        'hope': ['hope', 'hopeful', 'optimistic', 'bright future'],
        'renewal': ['new beginning', 'fresh start', 'rebirth', 'renewed'],
        'peace': ['peace', 'peaceful', 'calm', 'serene', 'tranquil'],
        'acceptance': ['accept', 'accepting', 'let go', 'surrender'],
        'strength': ['strong', 'strength', 'powerful', 'overcome'],
        'resilience': ['resilient', 'endure', 'persist', 'survive'],
        'freedom': ['free', 'freedom', 'liberated', 'escape'],
        'love': ['love', 'loved', 'loving', 'beloved'],
        'transformation': ['transform', 'change', 'different', 'became']
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        if (keywords.some(k => contentLower.includes(k))) {
            coreEmotion = emotion;
            break;
        }
    }

    // Detect emotional arc
    let emotionalArc = 'breakthrough';
    if (contentLower.includes('finally') || contentLower.includes('at last') || contentLower.includes('realized')) {
        emotionalArc = 'dark-to-light';
    } else if (contentLower.includes('descended') || contentLower.includes('fell into') || contentLower.includes('spiraled')) {
        emotionalArc = 'light-to-dark';
    } else if (contentLower.includes('journey') || contentLower.includes('path') || contentLower.includes('traveled')) {
        emotionalArc = 'cyclical';
    }

    // Detect butterfly stage
    let butterflyStage = 'metamorphosis';
    if (contentLower.includes('cocoon') || contentLower.includes('chrysalis')) {
        butterflyStage = 'chrysalis';
    } else if (contentLower.includes('emerging') || contentLower.includes('breaking free') || contentLower.includes('breaking out')) {
        butterflyStage = 'emergence';
    } else if (contentLower.includes('flying') || contentLower.includes('soaring') || contentLower.includes('wings spread')) {
        butterflyStage = 'flight';
    } else if (contentLower.includes('caterpillar') || contentLower.includes('crawling')) {
        butterflyStage = 'caterpillar';
    } else if (contentLower.includes('fragile') || contentLower.includes('delicate')) {
        butterflyStage = 'fragility';
    }

    // Extract key imagery
    const imageryKeywords = ['storm', 'rain', 'sun', 'moon', 'forest', 'ocean', 'mountain', 'river', 'garden', 'mirror', 'door', 'path', 'light', 'darkness', 'fire', 'water', 'sky', 'earth', 'tree', 'flower', 'star'];
    const keyImagery = imageryKeywords.filter(k => contentLower.includes(k));
    if (keyImagery.length === 0) keyImagery.push('nature', 'light');

    // Detect narrative arc
    let narrativeArc = 'journey';
    if (contentLower.includes('faced') || contentLower.includes('confronted') || contentLower.includes('standing before')) {
        narrativeArc = 'confrontation';
    } else if (contentLower.includes('descended') || contentLower.includes('sinking') || contentLower.includes('falling')) {
        narrativeArc = 'descent';
    } else if (contentLower.includes('emerged') || contentLower.includes('rising') || contentLower.includes('breaking through')) {
        narrativeArc = 'emergence';
    } else if (contentLower.includes('accepted') || contentLower.includes('peace') || contentLower.includes('finally understood')) {
        narrativeArc = 'acceptance';
    }

    // Generate summary (first 150 chars cleaned up)
    const sentences = chapterContent.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const chapterSummary = sentences.slice(0, 2).join('. ').substring(0, 200).trim() + '...';

    // Extract life lesson theme
    let lifeLessonTheme = 'personal transformation';
    const lessonKeywords: Record<string, string> = {
        'letting go': 'letting go',
        'self-acceptance': 'accepting myself',
        'forgiveness': 'forgiving',
        'strength': 'finding strength',
        'vulnerability': 'being vulnerable',
        'authenticity': 'being authentic',
        'boundaries': 'setting boundaries',
        'healing': 'healing'
    };
    for (const [theme, keyword] of Object.entries(lessonKeywords)) {
        if (contentLower.includes(keyword)) {
            lifeLessonTheme = theme;
            break;
        }
    }

    // Butterfly analogy
    let butterflyAnalogy = `The butterfly represents my ${butterflyStage} in this chapter of life`;
    if (contentLower.includes('butterfly')) {
        const butterflyIndex = contentLower.indexOf('butterfly');
        const context = chapterContent.substring(Math.max(0, butterflyIndex - 50), Math.min(chapterContent.length, butterflyIndex + 100));
        butterflyAnalogy = context.trim();
    }

    return {
        chapterNumber,
        chapterTitle,
        chapterSummary,
        coreEmotion,
        emotionalArc,
        lifeLessonTheme,
        wisdomAuthor: linkedWisdom?.author || 'none',
        wisdomConcept: linkedWisdom?.concept || '',
        butterflyAnalogy,
        butterflyStage,
        keyImagery,
        narrativeArc
    };
}

/**
 * Generate Chapter Cover Image Prompt (Portrait 2:3 for book interior)
 */
export function generateCoverPrompt(analysis: ChapterAnalysis): string {
    const atmosphere = EMOTION_ATMOSPHERES[analysis.coreEmotion] || EMOTION_ATMOSPHERES['transformation'];
    const butterflyElement = BUTTERFLY_STAGES[analysis.butterflyStage] || BUTTERFLY_STAGES['metamorphosis'];
    const wisdomSymbols = analysis.wisdomAuthor !== 'none' ? WISDOM_VISUALS[analysis.wisdomAuthor.toLowerCase()] || '' : '';
    const imagery = analysis.keyImagery.slice(0, 3).join(', ');

    return `Chapter cover for memoir, portrait orientation 2:3 ratio for book interior.

SCENE: ${imagery} environment, atmospheric ${analysis.narrativeArc} composition.
EMOTION: ${atmosphere}, emotional weight of ${analysis.coreEmotion}.
${wisdomSymbols ? `WISDOM SYMBOLISM: Subtle ${analysis.wisdomAuthor} elements - ${wisdomSymbols}.` : ''}
BUTTERFLY ELEMENT: ${butterflyElement}, butterfly as central or prominent element.
COLOR PALETTE: Deep purples, soft golds, teals, cream whites.
STYLE: Ethereal dreamlike painterly aesthetic, cinematic composition, 8K highly detailed.
TITLE SPACE: Clear area at top third for text overlay: "Chapter ${analysis.chapterNumber}: ${analysis.chapterTitle}".
No human faces visible. Print-ready quality.`;
}

/**
 * Generate Chapter Thumbnail Prompt (Square 1:1)
 */
export function generateThumbnailPrompt(analysis: ChapterAnalysis): string {
    const butterflyElement = BUTTERFLY_STAGES[analysis.butterflyStage] || BUTTERFLY_STAGES['metamorphosis'];

    const emotionColors: Record<string, string> = {
        'grief': 'cool blues and muted purples on dark background',
        'loss': 'cool blues and muted purples on dark background',
        'fear': 'deep shadows with hints of uncertain light',
        'hope': 'warm gold breakthrough on purple background',
        'renewal': 'warm gold and emerging light on purple',
        'peace': 'soft lavender and cream, gentle glow',
        'acceptance': 'soft lavender and cream, gentle glow',
        'strength': 'bold purple and gold, strong contrast',
        'resilience': 'bold purple and gold, strong contrast',
        'freedom': 'bright gold and teal, expansive feel',
        'transformation': 'purple transitioning to gold, metamorphosis colors'
    };

    const colorScheme = emotionColors[analysis.coreEmotion] || emotionColors['transformation'];

    return `Square thumbnail for app chapter card, bold and iconic.
FOCAL ELEMENT: Single monarch butterfly in ${analysis.butterflyStage} stage, ${butterflyElement}.
COLORS: ${colorScheme}.
COMPOSITION: Centered butterfly as clear focal point, simple gradient background.
STYLE: Bold silhouette, high contrast for small-size readability, ethereal but with clarity.
NO TEXT in image. Square 1:1 aspect ratio, 1024x1024. Painterly style.`;
}

/**
 * Generate Chapter Header Image Prompt (Wide 16:9)
 */
export function generateHeaderPrompt(analysis: ChapterAnalysis): string {
    const atmosphere = EMOTION_ATMOSPHERES[analysis.coreEmotion] || EMOTION_ATMOSPHERES['transformation'];
    const butterflyElement = BUTTERFLY_STAGES[analysis.butterflyStage] || BUTTERFLY_STAGES['metamorphosis'];
    const wisdomSymbols = analysis.wisdomAuthor !== 'none' ? WISDOM_VISUALS[analysis.wisdomAuthor.toLowerCase()] || '' : '';
    const imagery = analysis.keyImagery.slice(0, 3).join(', ');

    const arcComposition: Record<string, string> = {
        'descent': 'path moving into darkness and depth, downward visual elements',
        'emergence': 'light breaking through, upward movement, hope appearing',
        'journey': 'winding path visible, distance to travel, progression from left to right',
        'confrontation': 'meeting point imagery, face-to-face elements, mirror or duality',
        'acceptance': 'settling peace, integration, wholeness achieved'
    };

    const composition = arcComposition[analysis.narrativeArc] || arcComposition['journey'];

    return `Wide cinematic header banner for chapter page, landscape 16:9 orientation.
PANORAMIC SCENE: ${imagery} environment creating expansive world for "${analysis.chapterTitle}".
NARRATIVE COMPOSITION: ${composition}.
ATMOSPHERE: ${atmosphere}, emotional arc from ${analysis.emotionalArc}.
${wisdomSymbols ? `WISDOM INTEGRATION: ${analysis.wisdomConcept} represented through ${wisdomSymbols}.` : ''}
BUTTERFLY: ${butterflyElement} positioned at rule-of-thirds point, guiding the eye.
COLOR PALETTE: Deep purples, golds, teals with emotional variations.
STYLE: Cinematic widescreen, atmospheric depth with layered planes, dreamlike painterly quality.
8K resolution, space for potential text overlay on left or right third. No human faces.`;
}

/**
 * Generate Concept Video Prompt (Veo 3)
 */
export function generateVideoPrompt(analysis: ChapterAnalysis, duration: number = 20, orientation: 'landscape' | 'portrait' = 'landscape'): string {
    const butterflyElement = BUTTERFLY_STAGES[analysis.butterflyStage] || BUTTERFLY_STAGES['metamorphosis'];
    const wisdomVisuals = analysis.wisdomAuthor !== 'none' ? WISDOM_VISUALS[analysis.wisdomAuthor.toLowerCase()] || '' : '';

    const arcDescription: Record<string, { opening: string; middle: string; closing: string }> = {
        'emergence': {
            opening: 'stillness, cocoon, constraint, darkness, anticipation',
            middle: 'movement begins, cracking, light appears, transformation accelerates',
            closing: 'butterfly fully emerges, wings unfold, takes flight toward light'
        },
        'descent': {
            opening: 'light, normalcy, peaceful starting point',
            middle: 'shadows grow, descent into darkness, going deeper',
            closing: 'reaching the depths, pause before transformation begins'
        },
        'journey': {
            opening: 'beginning of path, starting point visible',
            middle: 'traveling through challenges, persistence, forward motion',
            closing: 'arriving at destination, butterfly accompanies or leads to resolution'
        },
        'confrontation': {
            opening: 'two sides visible, tension, approaching the difficult',
            middle: 'meeting moment, facing fear or truth directly',
            closing: 'integration, butterfly bridges the divide, wholeness'
        },
        'acceptance': {
            opening: 'chaos, movement, many conflicting elements',
            middle: 'gradual settling, release, tension dissolving',
            closing: 'calm center achieved, butterfly rests peacefully, serenity'
        }
    };

    const arc = arcDescription[analysis.narrativeArc] || arcDescription['emergence'];
    const aspectRatio = orientation === 'portrait' ? '9:16' : '16:9';

    return `Faceless concept video, ${duration} seconds, ${aspectRatio} ${orientation} orientation.

VIDEO ARC for "${analysis.chapterTitle}":

OPENING (0-${Math.floor(duration * 0.2)}s): ${arc.opening}
Establish ${analysis.coreEmotion} atmosphere. Camera: Static or slow establishing movement.

MIDDLE (${Math.floor(duration * 0.2)}-${Math.floor(duration * 0.8)}s): ${arc.middle}
Butterfly enters as guide or companion. ${butterflyElement}.
Camera: Movement supporting the arc (push in for intimacy, pull back for revelation).

CLOSING (${Math.floor(duration * 0.8)}-${duration}s): ${arc.closing}
Resolution with butterfly in ${analysis.butterflyStage} stage.
Camera: Resolving movement, often upward or expansive.

${wisdomVisuals ? `WISDOM LANGUAGE: Integrate ${analysis.wisdomAuthor} visual elements - ${wisdomVisuals}.` : ''}

REQUIREMENTS:
- NO human faces toward camera (silhouettes, backs, hands, nature only)
- Butterfly MUST appear and have meaningful role
- Cinematic, ethereal, dreamlike style
- Color palette: purples, golds, teals
- Slow motion preferred for emotional weight
- Smooth transitions, atmospheric`;
}

/**
 * Generate TikTok Clip Prompt (Veo 3, vertical)
 */
export function generateTikTokPrompt(analysis: ChapterAnalysis): string {
    const butterflyElement = BUTTERFLY_STAGES[analysis.butterflyStage] || BUTTERFLY_STAGES['metamorphosis'];

    const hookVisuals: Record<string, string> = {
        'chrysalis': 'chrysalis cracking open, light spilling through cracks',
        'cocoon': 'cocoon trembling, anticipation of emergence',
        'emergence': 'butterfly wing macro revealing, pull-back to full butterfly',
        'flight': 'butterfly bursting into frame, dynamic motion',
        'caterpillar': 'caterpillar reaching toward light, transformation beginning',
        'fragility': 'delicate wing detail, iridescent scales catching light',
        'metamorphosis': 'particles forming into butterfly shape, magical transformation'
    };

    const motionStyles: Record<string, string> = {
        'grief': 'slow floating descent, gentle rain drops, drifting particles',
        'hope': 'rising particles, ascending movement, light increasing',
        'strength': 'steady forward movement, persistent motion, grounded energy',
        'freedom': 'expansive flight, soaring movement, open space',
        'peace': 'gentle settling, calming ripples, soft drift downward',
        'transformation': 'swirling metamorphosis, particles reforming, constant motion'
    };

    const hook = hookVisuals[analysis.butterflyStage] || hookVisuals['metamorphosis'];
    const motion = motionStyles[analysis.coreEmotion] || motionStyles['transformation'];

    return `Short punchy TikTok background clip, 10-15 seconds, 9:16 portrait.

HOOK (First 2 seconds): ${hook} - immediate attention grab.

CONTINUOUS MOTION: ${motion}
Butterfly appears within first 3 seconds and remains visual anchor throughout.
${butterflyElement}.

COMPOSITION:
- Main visual action in upper 2/3 of frame
- Lower 1/3 clear for caption text
- Center-weighted butterfly placement
- End should visually connect to opening for seamless loop

STYLE:
- Bold colors that pop on mobile (purples, golds, teals)
- High visual engagement, no static moments
- Smooth continuous motion throughout
- Faceless content only
- Mesmerizing but not distracting from voiceover`;
}

/**
 * Master function to generate all prompts for a chapter
 */
export function generateAllVisualPrompts(
    chapterNumber: number,
    chapterTitle: string,
    chapterContent: string,
    linkedWisdom?: { author?: string; concept?: string },
    videoDuration: number = 20,
    videoOrientation: 'landscape' | 'portrait' = 'portrait'
): GeneratedPrompts {
    const analysis = analyzeChapterContent(chapterNumber, chapterTitle, chapterContent, linkedWisdom);

    return {
        coverPrompt: generateCoverPrompt(analysis),
        thumbnailPrompt: generateThumbnailPrompt(analysis),
        headerPrompt: generateHeaderPrompt(analysis),
        videoPrompt: generateVideoPrompt(analysis, videoDuration, videoOrientation),
        tikTokClipPrompt: generateTikTokPrompt(analysis),
        analysis
    };
}
