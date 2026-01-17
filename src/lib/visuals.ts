import {
    doc,
    updateDoc,
    collection,
    addDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// Types
export interface VisualAsset {
    id: string;
    chapterId: string | null;
    url: string;
    type: 'image' | 'video';
    imageType?: 'thumbnail' | 'header' | 'cover' | 'generated';
    title?: string;
    prompt?: string;
    source?: 'social-media' | 'visual-studio' | 'upload';
    platformPosts?: Record<string, string>;
    createdAt: Timestamp;
    archived: boolean;
    deleted?: boolean;     // New field for soft delete
    deletedAt?: Timestamp; // New field for soft delete
    userId: string;
}

/**
 * Force download a file from a URL by fetching it as a blob.
 * This works around CORS restrictions that prevent the 'download' attribute from working on cross-origin <a> tags.
 */
export const downloadFile = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed, falling back to direct link:', error);
        // Fallback: open in new tab
        window.open(url, '_blank');
    }
};

// Save generated video (uploads blob to storage then saves metadata)
export const saveGeneratedVideo = async (userId: string, chapterId: string | null, videoUrl: string, prompt: string, title?: string, source: 'visual-studio' | 'social-media' | 'upload' = 'visual-studio') => {
    try {
        // 1. Fetch the video blob from the temporary URL
        const response = await fetch(videoUrl);
        const blob = await response.blob();

        // 2. Upload to Firebase Storage
        const filename = `videos/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);

        // 3. Save metadata to Firestore
        const docRef = await addDoc(collection(db, 'visualAssets'), {
            userId,
            chapterId,
            url: downloadUrl,
            type: 'video',
            title: title || 'Generated Concept Video',
            prompt,
            createdAt: Timestamp.now(),
            archived: false,
            source
        });

        return { id: docRef.id, url: downloadUrl };
    } catch (error) {
        console.error('Error saving generated video:', error);
        throw error;
    }
};

// Upload a file to Firebase Storage
export const uploadVisualAsset = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'file';
    const filename = `uploads/${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

// Update chapter with new images
export const updateChapterImages = async (chapterId: string, thumbnail: string, fullImage: string) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        thumbnail: thumbnail,
        thumbnailUrl: thumbnail,
        fullImageUrl: fullImage,
        headerUrl: fullImage
    });
};

// Save image to library
export const saveImageToLibrary = async (userId: string, chapterId: string | null, url: string, title: string, prompt?: string, imageType: string = 'generated', source: 'visual-studio' | 'social-media' | 'upload' = 'visual-studio') => {
    await addDoc(collection(db, 'visualAssets'), {
        userId,
        chapterId,
        url,
        type: 'image',
        imageType,
        title,
        prompt: prompt || '',
        createdAt: Timestamp.now(),
        archived: false,
        source
    });
};

// Save video to library (if just saving link/simple save)
export const saveVideoToLibrary = async (userId: string, chapterId: string | null, url: string, title: string, source: 'visual-studio' | 'social-media' | 'upload' = 'visual-studio') => {
    await addDoc(collection(db, 'visualAssets'), {
        userId,
        chapterId,
        url,
        type: 'video',
        title,
        createdAt: Timestamp.now(),
        archived: false,
        source
    });
};

// Subscribe to visual assets for a user (filters out soft-deleted items)
export const subscribeToVisualAssets = (
    userId: string,
    callback: (assets: VisualAsset[]) => void
) => {
    const visualsRef = collection(db, 'visualAssets');
    const q = query(
        visualsRef,
        where('userId', '==', userId),
    );

    return onSnapshot(q, (snapshot) => {
        const assets = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as VisualAsset))
            // Client-side filter for now to avoid composite index requirement
            .filter(asset => !asset.deleted);

        // Sort client-side
        assets.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
        callback(assets);
    }, (error) => {
        console.error('Error subscribing to visual assets:', error);
        callback([]);
    });
};

// Subscribe to TRASH assets (only deleted items)
export const subscribeToTrashAssets = (
    userId: string,
    callback: (assets: VisualAsset[]) => void
) => {
    const visualsRef = collection(db, 'visualAssets');
    const q = query(
        visualsRef,
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const assets = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as VisualAsset))
            // Filter strictly for deleted items
            .filter(asset => !!asset.deleted);

        // Sort by deletion time or creation time
        assets.sort((a, b) => {
            const aTime = a.deletedAt?.seconds || a.createdAt?.seconds || 0;
            const bTime = b.deletedAt?.seconds || b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
        callback(assets);
    }, (error) => {
        console.error('Error subscribing to trash assets:', error);
        callback([]);
    });
};

// Get visual assets for a specific chapter
export const getChapterVisuals = async (chapterId: string): Promise<VisualAsset[]> => {
    const visualsRef = collection(db, 'visualAssets');
    const q = query(visualsRef, where('chapterId', '==', chapterId));
    const snapshot = await getDocs(q);
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as VisualAsset))
        .filter(asset => !asset.deleted);
};

// SOFT Delete (Move to Trash)
export const softDeleteVisualAsset = async (assetId: string) => {
    const assetRef = doc(db, 'visualAssets', assetId);
    await updateDoc(assetRef, {
        deleted: true,
        deletedAt: Timestamp.now()
    });
};

// Restore from Trash
export const restoreVisualAsset = async (assetId: string) => {
    const assetRef = doc(db, 'visualAssets', assetId);
    await updateDoc(assetRef, {
        deleted: false,
        deletedAt: null
    });
};

// Permanently Delete
export const permanentlyDeleteVisualAsset = async (assetId: string) => {
    const assetRef = doc(db, 'visualAssets', assetId);
    await deleteDoc(assetRef);
};

// Legacy Wrappers to maintain compatibility but force safe behavior
export const deleteImage = async (imageId: string) => {
    return softDeleteVisualAsset(imageId);
};

export const deleteVideo = async (videoId: string) => {
    return softDeleteVisualAsset(videoId);
};

// Archive image
export const archiveImage = async (imageId: string) => {
    const imageRef = doc(db, 'visualAssets', imageId);
    await updateDoc(imageRef, { archived: true });
};

// Unarchive image
export const unarchiveImage = async (imageId: string) => {
    const imageRef = doc(db, 'visualAssets', imageId);
    await updateDoc(imageRef, { archived: false });
};

// Archive video
export const archiveVideo = async (videoId: string) => {
    const videoRef = doc(db, 'visualAssets', videoId);
    await updateDoc(videoRef, { archived: true });
};

// Unarchive video
export const unarchiveVideo = async (videoId: string) => {
    const videoRef = doc(db, 'visualAssets', videoId);
    await updateDoc(videoRef, { archived: false });
};

// Move image to different chapter
export const moveImageToChapter = async (imageId: string, newChapterId: string) => {
    const imageRef = doc(db, 'visualAssets', imageId);
    await updateDoc(imageRef, { chapterId: newChapterId });
};

// Set image type (thumbnail, header, cover)
export const setImageType = async (imageId: string, imageType: 'thumbnail' | 'header' | 'cover') => {
    const imageRef = doc(db, 'visualAssets', imageId);
    await updateDoc(imageRef, { imageType });
};

// Set image as chapter thumbnail (and unset previous)
export const setAsChapterThumbnail = async (chapterId: string, assetId: string, imageUrl: string) => {
    // 1. Find existing thumbnail for this chapter
    const visualsRef = collection(db, 'visualAssets');
    const q = query(visualsRef, where('chapterId', '==', chapterId), where('imageType', '==', 'thumbnail'));
    const snapshot = await getDocs(q);

    // 2. Unset previous thumbnail(s)
    // We'll just do sequential awaits for simplicity, or use batch if needed
    for (const docSnap of snapshot.docs) {
        if (docSnap.id !== assetId) {
            await updateDoc(docSnap.ref, { imageType: 'generated' });
        }
    }

    // 3. Set new thumbnail type
    const newAssetRef = doc(db, 'visualAssets', assetId);
    await updateDoc(newAssetRef, { imageType: 'thumbnail' });

    // 4. Update chapter document
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        thumbnail: imageUrl,
        thumbnailUrl: imageUrl
    });
};

// Set image as chapter header (and unset previous)
export const setAsChapterHeader = async (chapterId: string, assetId: string, imageUrl: string) => {
    // 1. Find existing header for this chapter
    const visualsRef = collection(db, 'visualAssets');
    const q = query(visualsRef, where('chapterId', '==', chapterId), where('imageType', '==', 'header'));
    const snapshot = await getDocs(q);

    // 2. Unset previous header(s)
    for (const docSnap of snapshot.docs) {
        if (docSnap.id !== assetId) {
            await updateDoc(docSnap.ref, { imageType: 'generated' });
        }
    }

    // 3. Set new header type
    const newAssetRef = doc(db, 'visualAssets', assetId);
    await updateDoc(newAssetRef, { imageType: 'header' });

    // 4. Update chapter document
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        fullImageUrl: imageUrl,
        headerUrl: imageUrl
    });
};
