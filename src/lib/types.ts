import { Timestamp } from 'firebase/firestore';

export type ChapterStatus = 'draft' | 'in-progress' | 'review' | 'complete';

export type ButterflyStage = 'cocoon' | 'chrysalis' | 'butterfly';

export interface Chapter {
    id: string;
    userId: string;
    chapterNumber: number;
    title: string;
    status: ChapterStatus;
    lastEdited: Timestamp;
    thumbnail?: string;
    wordCount: number;
    versionCount: number;
    currentVersionId?: string;
    butterflyStage?: ButterflyStage;
    butterflyAnalogy?: string;
    thumbnailUrl?: string;
    fullImageUrl?: string;
    conceptVideos?: { url: string; title: string; type: string }[];
}

export interface TikTokScript {
    id: string;
    userId: string;
    chapterId: string;
    chapterTitle: string;
    content: string;
    duration: '15s' | '30s' | '60s';
    style: 'snippet' | 'lesson' | 'butterfly' | 'wisdom';
    hooks: string[];
    hashtags: string[];
    createdAt: any;
}

export interface ScannerResult {
    found: boolean;
    references: string[];
    strength: 'subtle' | 'moderate' | 'prominent';
    suggestions?: {
        point: string;
        preview: string;
    }[];
}

export interface ButterflySuggestion {
    id: string;
    sourceId: string;
    author: string;
    videoTitle: string;
    concept: string;
    application: string;
    preview: string;
}

export type VersionType = 'original' | 'braindump' | 'jung' | 'singer' | 'watts' | 'custom' | 'edited';

export interface Version {
    id: string;
    chapterId: string;
    userId: string;
    content: string;
    createdAt: Timestamp;
    isCurrent: boolean;
    versionNumber: number;
    type: VersionType;
    isArchived: boolean;
    wordCount: number;
    wisdomSourceId?: string;
}

export interface ButterflyReference {
    timestamp: string;
    seconds: number;
    quote: string;
}

export interface WisdomVideo {
    id: string;
    userId: string;
    youtubeId: string;
    title: string;
    author: string;
    thumbnail: string;
    duration: string;
    channelTitle: string;
    transcript?: string;
    summary?: string;
    lessons?: string[];
    butterflyReferences: ButterflyReference[];
    savedAt: Timestamp;
}

export interface UserPreferences {
    favoriteAuthors: string[];
    customAuthors: string[];
    defaultExportFormat: 'word' | 'pdf';
}

export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    createdAt: Timestamp;
    preferences: UserPreferences;
    hasCompletedSetup: boolean;
}
