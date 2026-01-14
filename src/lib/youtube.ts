
export interface YouTubeVideoResult {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
}

// In a real app, you'd use VITE_YOUTUBE_API_KEY
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export const searchYouTube = async (query: string, author: string = ''): Promise<YouTubeVideoResult[]> => {
    const fullQuery = `${author} ${query}`.trim();

    // Fallback Mock Data if no API key
    if (!YOUTUBE_API_KEY) {
        console.warn('YouTube API key not found. Using mock data.');
        await new Promise(r => setTimeout(r, 1000));

        return [
            {
                id: '8v4qX1_fQ1A',
                title: `${author || 'Wisdom'}: The Chrysalis Principle`,
                description: 'A deep dive into the nature of personal transformation.',
                thumbnail: 'https://img.youtube.com/vi/8v4qX1_fQ1A/mqdefault.jpg',
                channelTitle: 'Wisdom Channel'
            },
            {
                id: 'dQw4w9WgXcQ',
                title: 'Alan Watts on the Illusion of the Self',
                description: 'Alan Watts discusses how we perceive our identities.',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                channelTitle: 'Watts Lectures'
            },
            {
                id: 'LpG8R9_H_mY',
                title: 'Carl Jung: The Psychology of the Butterfly',
                description: 'Jungian analysis of rebirth symbols.',
                thumbnail: 'https://img.youtube.com/vi/LpG8R9_H_mY/mqdefault.jpg',
                channelTitle: 'Psychological Insight'
            }
        ].filter(v => v.title.toLowerCase().includes(author.toLowerCase()));
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(fullQuery)}&type=video&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle
        }));
    } catch (error) {
        console.error('YouTube Search Error:', error);
        return [];
    }
};

export const getVideoTranscript = async (videoId: string): Promise<string> => {
    // In a production app, fetching transcripts usually requires a backend 
    // or a non-official API as the official v3 API doesn't provide easy transcript fetching for all videos.
    // For this prototype, we'll return a mock transcript.
    await new Promise(r => setTimeout(r, 1500));
    return `This is a mock transcript for video ${videoId}. In a real application, this would contain the actual text spoken in the video. The butterfly begins its life as a caterpillar, undergoing a complete transformation within the chrysalis. This process is symbolic of the human journey toward self-realization. Carl Jung often spoke about the soul's emergence from the dark night of the ego. When we surrender to the process, just as the caterpillar dissolves, we allow the butterfly to take wing.`;
};
