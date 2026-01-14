
import { collection, doc, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const scripts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as TikTokScript[];
        callback(scripts);
    });
};
