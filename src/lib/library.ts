
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import type { WisdomVideo } from './types';

export const subscribeToLibrary = (userId: string, callback: (videos: WisdomVideo[]) => void) => {
    const q = query(
        collection(db, 'wisdomLibrary'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const videos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as WisdomVideo[];
        // Sort client-side to avoid requiring Firestore index
        videos.sort((a, b) => {
            const aTime = a.savedAt?.seconds || 0;
            const bTime = b.savedAt?.seconds || 0;
            return bTime - aTime;
        });
        callback(videos);
    }, (error) => {
        console.error('Error subscribing to library:', error);
        callback([]);
    });
};

export const addToLibrary = async (videoData: Partial<WisdomVideo>) => {
    return await addDoc(collection(db, 'wisdomLibrary'), {
        ...videoData,
        savedAt: serverTimestamp()
    });
};

export const removeFromLibrary = async (videoId: string) => {
    await deleteDoc(doc(db, 'wisdomLibrary', videoId));
};

export const checkVideoInLibrary = async (userId: string, youtubeId: string) => {
    const q = query(
        collection(db, 'wisdomLibrary'),
        where('userId', '==', userId),
        where('youtubeId', '==', youtubeId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};
