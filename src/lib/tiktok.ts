
import { collection, doc, addDoc, query, where, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { TikTokScript } from './types';

export const saveTikTokScript = async (script: Omit<TikTokScript, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'tiktokScripts'), {
        ...script,
        createdAt: serverTimestamp()
    });
};

export const deleteTikTokScript = async (id: string) => {
    return deleteDoc(doc(db, 'tiktokScripts', id));
};

export const subscribeToTikTokScripts = (userId: string, callback: (scripts: TikTokScript[]) => void) => {
    const q = query(
        collection(db, 'tiktokScripts'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const scripts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as TikTokScript[];
        // Sort client-side to avoid requiring Firestore index
        scripts.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
        callback(scripts);
    }, (error) => {
        console.error('Error subscribing to TikTok scripts:', error);
        callback([]);
    });
};
