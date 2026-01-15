import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const processBrainDump = async (content: string) => {
    if (!genAI) {
        console.warn("Gemini API key not found. Mocking processing.");
        return content; // Mock: return original content if no API key
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    The following is a raw "brain dump" for a memoir. 
    Please reorganize it into coherent, well-structured paragraphs while maintaining the author's original voice and emotional depth. 
    Identify key themes, events, and emotions.
    
    RAW CONTENT:
    ${content}
    
    Return only the processed text.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

export const generateWritingPrompts = async (chapterContext: string) => {
    if (!genAI) {
        return [
            "What lesson did this teach you?",
            "How did this experience change you?",
            "What would you tell your past self?"
        ];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Based on the following memoir chapter context, generate 3 deep, reflective writing prompts to help the author expand their story.
    
    CONTEXT:
    ${chapterContext}
    
    Return only the 3 prompts as a JSON array of strings.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        // Basic cleanup in case it returns markdown
        const jsonString = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Error generating writing prompts:', e);
        return [
            "What lesson did this teach you?",
            "How did this experience change you?",
            "What would you tell your past self?"
        ];
    }
};

export const analyzeWisdomVideo = async (transcript: string) => {
    if (!genAI) {
        return {
            summary: "A profound discussion on the nature of transformation, ego dissolution, and the symbolic journey of the butterfly as a map for human enlightenment.",
            lessons: [
                "The caterpillar must dissolve its current form to become the butterfly.",
                "Ego death is not the end, but the beginning of true flight.",
                "The chrysalis is a space of sacred solitude and restructuring."
            ],
            butterflyReferences: [
                { timestamp: "02:15", seconds: 135, quote: "The butterfly represents the soul escaping the prison of the ego." },
                { timestamp: "05:40", seconds: 340, quote: "Within the chrysalis, everything we thought we were is liquidated." }
            ]
        };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Analyze the following video transcript. Extract a 2-sentence summary, 3 key lessons, and any references to butterflies, caterpillars, or transformation.
    
    TRANSCRIPT:
    ${transcript}
    
    Return as a JSON object with this shape:
    {
      "summary": "string",
      "lessons": ["string"],
      "butterflyReferences": [{"timestamp": "mm:ss", "seconds": number, "quote": "string"}]
    }
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Error analyzing YouTube video:', e);
        return { summary: "", lessons: [], butterflyReferences: [] };
    }
};

export const generateSearchSuggestions = async (chapterContent: string) => {
    if (!genAI) {
        return ["Jungian archetypes in memoirs", "Transformational growth stories", "Overcoming ego in writing"];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Based on the following memoir chapter, suggest 3 highly specific search queries to find wisdom videos on YouTube (Jung, Alan Watts, etc.) that would help the author deepen this chapter's themes.
    
    CHAPTER:
    ${chapterContent}
    
    Return only the 3 queries as a JSON array of strings.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Error generating search suggestions:', e);
        return ["Jung symbols", "Transformation wisdom", "Personal growth"];
    }
};

export const analyzeChapterForEnhancement = async (content: string) => {
    if (!genAI) {
        return {
            themes: ["Resilience", "Identity", "Sudden Change"],
            currentLesson: "The author is struggling to find meaning in their recent loss but shows a spark of hope.",
            opportunities: [
                "Incorporate Jung's concept of the 'Shadow' during the hospital scene.",
                "Use Michael Singer's 'untethered' concept to explain the feeling of detachment.",
                "Integrate Alan Watts' perspective on the flow of time to soften the narrative rhythm."
            ]
        };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Analyze the following memoir chapter. Identify 3 core themes/emotions, summarize the current life lesson, and suggest 3 specific opportunities for integrating philosophical wisdom (Jung, Singer, Watts, etc.).
    
    CHAPTER:
    ${content}
    
    Return as a JSON:
    {
      "themes": ["string"],
      "currentLesson": "string",
      "opportunities": ["string"]
    }
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Error in chapter analysis:', e);
        return { themes: [], currentLesson: "", opportunities: [] };
    }
};

export const generateIntegrationPreviews = async (chapterContent: string, wisdomSource: any) => {
    if (!genAI) {
        return [
            {
                author: wisdomSource.author,
                concept: `The perspective on ${wisdomSource.title}`,
                snippet: `As the chrysalis forms, there is a moment of absolute stillness. ${wisdomSource.author} suggests that this isn't a death, but a reorganization of the soul's very purpose...`
            }
        ];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Create 3 brief preview snippets (50 words each) showing how wisdom from "${wisdomSource.author}" (specifically his teachings in "${wisdomSource.title}") could be woven into this chapter. 
    Focus on reflection, not lecture. 
    
    CHAPTER: ${chapterContent.substring(0, 1000)}
    WISDOM SUMMARY: ${wisdomSource.summary}
    
    Return as a JSON array: [{"author": "string", "concept": "string", "snippet": "string"}]
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Error in integration previews:', e);
        return [];
    }
};

export const enhanceChapterFull = async (chapterContent: string, wisdomSource: any) => {
    if (!genAI) {
        return chapterContent + "\n\n[MOCK ENHANCEMENT]: This version includes integrated wisdom from " + wisdomSource.author + " regarding " + wisdomSource.title + ".";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    REWRITE the following memoir chapter by weaving in philosophical wisdom from ${wisdomSource.author} based on their teachings in "${wisdomSource.title}".
    
    GUIDELINES:
    1. Keep the author's original voice and personal story intact.
    2. Introduce the philosophical concept as personal reflection, not a lecture.
    3. Connect the concept to the specific experiences in the chapter.
    4. If the source material mentions butterflies or transformation, use it as a metaphor.
    5. Maintain emotional authenticity.
    
    CHAPTER:
    ${chapterContent}
    
    WISDOM SOURCE SUMMARY:
    ${wisdomSource.summary}
    
    WISDOM LESSONS:
    ${wisdomSource.lessons?.join(", ")}
    
    BUTTERFLY REFERENCES:
    ${wisdomSource.butterflyReferences?.map((r: any) => r.quote).join(" ")}
    
    Return only the full rewritten chapter.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};
export const scanForButterflies = async (content: string) => {
    if (!genAI) {
        return {
            found: content.toLowerCase().includes('butterfly') || content.toLowerCase().includes('chrysalis') || content.toLowerCase().includes('cocoon'),
            references: content.toLowerCase().includes('butterfly') ? ["Sample butterfly reference from text"] : [],
            strength: 'subtle',
            suggestions: [
                { point: "At the end of the second paragraph", preview: "...as if I were a caterpillar oblivious to the coming flight." },
                { point: "When discussing the hospital stay", preview: "The hospital room felt like a stifling cocoon, yet it was where my transformation was secretly occurring." },
                { point: "In the final reflection", preview: "Looking back, that moment of absolute stillness was the chrysalis phase I never knew I needed." }
            ]
        };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Scan the following memoir chapter for butterfly, caterpillar, chrysalis, or transformation metaphors.
    Identify any existing references, determine the metaphor strength (subtle, moderate, prominent), and suggest 3 natural insertion points with previews if the metaphor can be deepened.
    
    CHAPTER:
    ${content}
    
    Return as a JSON:
    {
      "found": boolean,
      "references": ["string"],
      "strength": "subtle" | "moderate" | "prominent",
      "suggestions": [{"point": "string", "preview": "string"}]
    }
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Error scanning for butterflies:', e);
        return { found: false, references: [], strength: 'subtle', suggestions: [] };
    }
};

export const generateButterflySuggestions = async (chapterContent: string, butterflyLibraryItems: any[]) => {
    if (!genAI) {
        return [
            {
                id: '1',
                sourceId: butterflyLibraryItems[0]?.id || 'mock',
                author: butterflyLibraryItems[0]?.author || 'Alan Watts',
                videoTitle: butterflyLibraryItems[0]?.title || 'The Nature of Change',
                concept: 'The Liquid State',
                application: 'Use this to describe the feeling of uncertainty during your transition.',
                preview: 'In the chrysalis, the caterpillar becomes a liquid soup before it becomes a butterfly. I realized I was in that soup—messy, formless, but mid-miracle.'
            }
        ];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Based on the memoir chapter below and the set of butterfly/transformation quotes from a wisdom library, suggest 3 specific butterfly analogies that could be integrated.
    Match the best quote to the chapter's themes.
    
    CHAPTER:
    ${chapterContent.substring(0, 2000)}
    
    LIBRARY REFERENCES:
    ${JSON.stringify(butterflyLibraryItems.map(item => ({
        id: item.id,
        author: item.author,
        title: item.title,
        quotes: item.butterflyReferences.map((r: any) => r.quote)
    })))}
    
    Return as a JSON array (3 items max):
    [
      {
        "id": "item-id",
        "sourceId": "original-video-id",
        "author": "string",
        "videoTitle": "string",
        "concept": "string",
        "application": "how it applies here",
        "preview": "the paragraph with the analogy inserted"
      }
    ]
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error('Error generating butterfly suggestions:', e);
        return [];
    }
};
export const generateChapterTitles = async (content: string) => {
    if (!genAI) {
        return ["The First Flutter", "Liquid Identity", "Into the Chrysalis", "Weight of Wings", "Unfolding Fate"];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Analyze this memoir chapter and suggest 5 evocative, poetic, and meaningful titles.
    CHAPTER: ${content.substring(0, 3000)}
    Return as a JSON array of strings.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('['), text.lastIndexOf(']') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        return ["My Transformation", "The Journey", "Breaking Free", "New Beginnings", "The Shift"];
    }
};

export const generateVisualPrompts = async (chapterTitle: string, chapterContent: string, _type: 'image' | 'video') => {
    if (!genAI) {
        return {
            thumbnailPrompt: `Ethereal purple butterfly emerging from a golden cocoon, macro photography, soft focus, dreamlike lighting, chrysalis aesthetic.`,
            fullImagePrompt: `Wide landscape of a misty morning in a lavender field, one giant glowing butterfly hovering in the distance, transformation theme, high contrast, cinematic colors.`,
            videoPrompt: `Slow cinematic zoom into a pulsating golden chrysalis hanging from a crystalline branch, subtle particles of light, transforming into 1000 tiny butterflies.`
        };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Based on the chapter titled "${chapterTitle}" and the content below, create highly detailed, artistic prompts for an AI image/video generator.
    The aesthetic should be "Ethereal, Dreamy, Transformative" with butterfly motifs.
    
    CHAPTER CONTENT:
    ${chapterContent.substring(0, 2000)}
    
    Return as a JSON object:
    {
      "thumbnailPrompt": "A square composition prompt focused on a singular symbolic element",
      "fullImagePrompt": "A panoramic/landscape prompt showing a wide scene of transformation",
      "videoPrompt": "A dynamic prompt describing motion, lighting shifts, and metamorphosis"
    }
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        return {
            thumbnailPrompt: "Beautiful butterfly on a flower, dreamlike.",
            fullImagePrompt: "A landscape of growth and change.",
            videoPrompt: "A video of a butterfly flying away."
        };
    }
};

export const generateTikTokScript = async (chapterTitle: string, content: string, duration: string, style: string) => {
    if (!genAI) {
        return {
            content: `[HOOK]: I didn't know that my life was about to change... \n\n[STORY]: In the ${chapterTitle} chapter of my life, I was like a caterpillar in a dark cocoon. (PAUSE) I thought it was the end, but it was just a new beginning. \n\n[LESSON]: Transformation requires us to dissolve before we can fly. \n\n[TRANSFORM]: Don't fear the dark. It's where the wings grow.`,
            hashtags: ["#memoir", "#transformation", "#butterflyeffect", "#growth"],
            hooks: ["I didn't know my life was about to change.", "The truth about transformation.", "Why the cocoon is the hardest part."]
        };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
    Create a TikTok script based on this memoir chapter: "${chapterTitle}".
    Duration: ${duration}
    Style: ${style} (choices: snippet, lesson, butterfly, wisdom)
    
    CHAPTER CONTENT:
    ${content.substring(0, 3000)}
    
    The script should include:
    1. A strong hook in the first 2 seconds.
    2. Emotional storytelling.
    3. Visual/Audio cues like [PAUSE], [TRANSITION], [EMPHASIS].
    4. Appropriate length for ${duration}.
    
    Return as a JSON object:
    {
      "content": "The full script with markers",
      "hooks": ["3 potential alternative hooks"],
      "hashtags": ["5 relevant hashtags"]
    }
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    try {
        const text = response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        return {
            content: "Error generating script. Please try again.",
            hooks: [],
            hashtags: []
        };
    }
};
