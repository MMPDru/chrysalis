import {
    doc,
    updateDoc,
    arrayUnion,
    collection,
    addDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface VisualAsset {
    id: string;
    chapterId: string;
    url: string;
    type: 'image' | 'video';
    imageType?: 'thumbnail' | 'header' | 'cover' | 'generated';
    title?: string;
    prompt?: string;
    createdAt: Timestamp;
    archived: boolean;
    userId: string;
}

// Update chapter images (legacy support)
export const updateChapterImages = async (chapterId: string, thumbnail: string, fullImage: string) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        thumbnailUrl: thumbnail,
        fullImageUrl: fullImage,
        thumbnail: thumbnail
    });
};

// Add concept video to chapter
export const addConceptVideo = async (chapterId: string, video: { url: string; title: string; type: string }) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        conceptVideos: arrayUnion(video)
    });
};

// Save image to visual assets collection
export const saveImageToLibrary = async (
    userId: string,
    chapterId: string,
    url: string,
    imageType: 'thumbnail' | 'header' | 'cover' | 'generated',
    prompt?: string
): Promise<string> => {
    const visualsRef = collection(db, 'visualAssets');
    const docRef = await addDoc(visualsRef, {
        userId,
        chapterId,
        url,
        type: 'image',
        imageType,
        prompt: prompt || '',
        createdAt: Timestamp.now(),
        archived: false
    });
    return docRef.id;
};

// Save video to visual assets collection
export const saveVideoToLibrary = async (
    userId: string,
    chapterId: string,
    url: string,
    title: string,
    prompt?: string
): Promise<string> => {
    const visualsRef = collection(db, 'visualAssets');
    const docRef = await addDoc(visualsRef, {
        userId,
        chapterId,
        url,
        type: 'video',
        title,
        prompt: prompt || '',
        createdAt: Timestamp.now(),
        archived: false
    });
    return docRef.id;
};

// Subscribe to visual assets for a user
export const subscribeToVisualAssets = (
    userId: string,
    callback: (assets: VisualAsset[]) => void
) => {
    const visualsRef = collection(db, 'visualAssets');
    const q = query(
        visualsRef,
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const assets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as VisualAsset));
        // Sort client-side to avoid requiring Firestore index
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

// Get visual assets for a specific chapter
export const getChapterVisuals = async (chapterId: string): Promise<VisualAsset[]> => {
    const visualsRef = collection(db, 'visualAssets');
    const q = query(visualsRef, where('chapterId', '==', chapterId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as VisualAsset));
};

// Delete image from library
export const deleteImage = async (imageId: string) => {
    const imageRef = doc(db, 'visualAssets', imageId);
    await deleteDoc(imageRef);
};

// Delete video from library
export const deleteVideo = async (videoId: string) => {
    const videoRef = doc(db, 'visualAssets', videoId);
    await deleteDoc(videoRef);
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

// Set image as chapter thumbnail
export const setAsChapterThumbnail = async (chapterId: string, imageUrl: string) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        thumbnail: imageUrl,
        thumbnailUrl: imageUrl
    });
};

// Set image as chapter header
export const setAsChapterHeader = async (chapterId: string, imageUrl: string) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        fullImageUrl: imageUrl,
        headerUrl: imageUrl
    });
};
