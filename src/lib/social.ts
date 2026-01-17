import {
    collection,
    addDoc,
    Timestamp,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// SAVED POST
// ============================================
export interface SavedPost {
    id: string;
    userId: string;
    chapterId: string | null;
    chapterTitle: string;
    platform: string;
    content: string; // The caption/text
    title?: string;
    topic?: string; // The topic/theme used for generation
    summary?: string; // Brief summary of what this post is about
    sourceText?: string; // Original memoir text used as source
    createdAt: Timestamp;
    archived: boolean;
    source: 'social-media' | 'manual';
}

// Save post to library
export const savePostToLibrary = async (
    userId: string,
    chapterId: string | null,
    chapterTitle: string,
    platform: string,
    content: string,
    title?: string,
    source: 'social-media' | 'manual' = 'social-media',
    topic?: string,
    summary?: string,
    sourceText?: string
) => {
    return await addDoc(collection(db, 'savedPosts'), {
        userId,
        chapterId,
        chapterTitle,
        platform,
        content,
        title: title || '',
        topic: topic || '',
        summary: summary || '',
        sourceText: sourceText || '',
        createdAt: Timestamp.now(),
        archived: false,
        source
    });
};

// Subscribe to saved posts
export const subscribeToSavedPosts = (
    userId: string,
    callback: (posts: SavedPost[]) => void
) => {
    const q = query(
        collection(db, 'savedPosts'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SavedPost[];

        // Sort by newest first
        posts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

        callback(posts);
    }, (error) => {
        console.error('Error subscribing to saved posts:', error);
        callback([]);
    });
};

// Archive post
export const archivePost = async (postId: string) => {
    await updateDoc(doc(db, 'savedPosts', postId), { archived: true });
};

// Unarchive post
export const unarchivePost = async (postId: string) => {
    await updateDoc(doc(db, 'savedPosts', postId), { archived: false });
};

// Delete post
export const deletePost = async (postId: string) => {
    await deleteDoc(doc(db, 'savedPosts', postId));
};

// ============================================
// SAVED IMAGE
// ============================================
export interface SavedImage {
    id: string;
    userId: string;
    chapterId: string | null;
    chapterTitle: string;
    imageUrl: string;
    prompt: string; // The prompt used to generate the image
    summary?: string; // Brief description of the image
    style?: string; // Style used (e.g., photorealistic, artistic)
    aspectRatio?: string; // e.g., "16:9", "1:1", "9:16"
    platforms?: string[]; // Target platforms
    sourceText?: string; // Original memoir text used as source
    createdAt: Timestamp;
    archived: boolean;
    source: 'social-media' | 'visual-studio' | 'manual';
}

// Save image to social media library
export const saveImageToSocialLibrary = async (
    userId: string,
    chapterId: string | null,
    chapterTitle: string,
    imageUrl: string,
    prompt: string,
    options?: {
        summary?: string;
        style?: string;
        aspectRatio?: string;
        platforms?: string[];
        sourceText?: string;
        source?: 'social-media' | 'visual-studio' | 'manual';
    }
) => {
    return await addDoc(collection(db, 'savedImages'), {
        userId,
        chapterId,
        chapterTitle,
        imageUrl,
        prompt,
        summary: options?.summary || '',
        style: options?.style || '',
        aspectRatio: options?.aspectRatio || '16:9',
        platforms: options?.platforms || [],
        sourceText: options?.sourceText || '',
        createdAt: Timestamp.now(),
        archived: false,
        source: options?.source || 'social-media'
    });
};

// Subscribe to saved images
export const subscribeToSavedImages = (
    userId: string,
    callback: (images: SavedImage[]) => void
) => {
    const q = query(
        collection(db, 'savedImages'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const images = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SavedImage[];

        images.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        callback(images);
    }, (error) => {
        console.error('Error subscribing to saved images:', error);
        callback([]);
    });
};

// Archive image
export const archiveImage = async (imageId: string) => {
    await updateDoc(doc(db, 'savedImages', imageId), { archived: true });
};

// Delete image
export const deleteImage = async (imageId: string) => {
    await deleteDoc(doc(db, 'savedImages', imageId));
};

// ============================================
// SAVED VIDEO
// ============================================
export interface SavedVideo {
    id: string;
    userId: string;
    chapterId: string | null;
    chapterTitle: string;
    videoUrl: string;
    thumbnailUrl?: string;
    prompt: string; // The prompt used to generate the video
    summary?: string; // Brief description of the video
    duration?: number; // Duration in seconds
    aspectRatio?: string; // e.g., "16:9", "9:16"
    platforms?: string[]; // Target platforms (TikTok, Reels, Shorts, etc.)
    sourceText?: string; // Original memoir text used as source
    generationModel?: string; // e.g., "veo3-fast", "kling"
    createdAt: Timestamp;
    archived: boolean;
    source: 'social-media' | 'visual-studio' | 'manual';
}

// Save video to social media library
export const saveVideoToSocialLibrary = async (
    userId: string,
    chapterId: string | null,
    chapterTitle: string,
    videoUrl: string,
    prompt: string,
    options?: {
        thumbnailUrl?: string;
        summary?: string;
        duration?: number;
        aspectRatio?: string;
        platforms?: string[];
        sourceText?: string;
        generationModel?: string;
        source?: 'social-media' | 'visual-studio' | 'manual';
    }
) => {
    return await addDoc(collection(db, 'savedVideos'), {
        userId,
        chapterId,
        chapterTitle,
        videoUrl,
        prompt,
        thumbnailUrl: options?.thumbnailUrl || '',
        summary: options?.summary || '',
        duration: options?.duration || 8,
        aspectRatio: options?.aspectRatio || '9:16',
        platforms: options?.platforms || ['tiktok', 'instagram', 'youtube'],
        sourceText: options?.sourceText || '',
        generationModel: options?.generationModel || 'veo3-fast',
        createdAt: Timestamp.now(),
        archived: false,
        source: options?.source || 'social-media'
    });
};

// Subscribe to saved videos
export const subscribeToSavedVideos = (
    userId: string,
    callback: (videos: SavedVideo[]) => void
) => {
    const q = query(
        collection(db, 'savedVideos'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const videos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as SavedVideo[];

        videos.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        callback(videos);
    }, (error) => {
        console.error('Error subscribing to saved videos:', error);
        callback([]);
    });
};

// Archive video
export const archiveVideo = async (videoId: string) => {
    await updateDoc(doc(db, 'savedVideos', videoId), { archived: true });
};

// Delete video
export const deleteVideo = async (videoId: string) => {
    await deleteDoc(doc(db, 'savedVideos', videoId));
};

// ============================================
// UNIFIED SOCIAL MEDIA LIBRARY
// ============================================
export type SocialMediaItem =
    | (SavedPost & { type: 'post' })
    | (SavedImage & { type: 'image' })
    | (SavedVideo & { type: 'video' });

// Get all social media items for a user
export const getAllSocialMediaItems = async (userId: string): Promise<SocialMediaItem[]> => {
    const items: SocialMediaItem[] = [];

    // Fetch posts
    const postsQuery = query(collection(db, 'savedPosts'), where('userId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    postsSnapshot.docs.forEach(doc => {
        items.push({ id: doc.id, ...doc.data(), type: 'post' } as SocialMediaItem);
    });

    // Fetch images
    const imagesQuery = query(collection(db, 'savedImages'), where('userId', '==', userId));
    const imagesSnapshot = await getDocs(imagesQuery);
    imagesSnapshot.docs.forEach(doc => {
        items.push({ id: doc.id, ...doc.data(), type: 'image' } as SocialMediaItem);
    });

    // Fetch videos
    const videosQuery = query(collection(db, 'savedVideos'), where('userId', '==', userId));
    const videosSnapshot = await getDocs(videosQuery);
    videosSnapshot.docs.forEach(doc => {
        items.push({ id: doc.id, ...doc.data(), type: 'video' } as SocialMediaItem);
    });

    // Sort by newest first
    items.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

    return items;
};

// Subscribe to all social media items
export const subscribeToAllSocialMedia = (
    userId: string,
    callback: (items: SocialMediaItem[]) => void
) => {
    const items: Map<string, SocialMediaItem> = new Map();

    const updateCallback = () => {
        const allItems = Array.from(items.values());
        allItems.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        callback(allItems);
    };

    // Subscribe to posts
    const unsubPosts = subscribeToSavedPosts(userId, (posts) => {
        posts.forEach(p => items.set(`post-${p.id}`, { ...p, type: 'post' }));
        updateCallback();
    });

    // Subscribe to images
    const unsubImages = subscribeToSavedImages(userId, (images) => {
        images.forEach(i => items.set(`image-${i.id}`, { ...i, type: 'image' }));
        updateCallback();
    });

    // Subscribe to videos
    const unsubVideos = subscribeToSavedVideos(userId, (videos) => {
        videos.forEach(v => items.set(`video-${v.id}`, { ...v, type: 'video' }));
        updateCallback();
    });

    // Return unsubscribe function
    return () => {
        unsubPosts();
        unsubImages();
        unsubVideos();
    };
};
