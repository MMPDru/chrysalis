import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    writeBatch,
    getDocs,
    limit,
    increment,
    deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Chapter, Version } from './types';

export const subscribeToChapters = (userId: string, callback: (chapters: Chapter[]) => void) => {
    const q = query(
        collection(db, 'chapters'),
        where('userId', '==', userId),
        orderBy('chapterNumber', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const chapters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Chapter[];
        callback(chapters);
    });
};

export const subscribeToChapter = (chapterId: string, callback: (chapter: Chapter | null) => void) => {
    const docRef = doc(db, 'chapters', chapterId);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback({ id: docSnap.id, ...docSnap.data() } as Chapter);
        } else {
            callback(null);
        }
    });
};

export const createChapter = async (userId: string, chapterNumber: number, title: string = 'Untitled Chapter') => {
    // Create the chapter document
    const chapterRef = await addDoc(collection(db, 'chapters'), {
        userId,
        chapterNumber,
        title,
        status: 'draft',
        lastEdited: serverTimestamp(),
        wordCount: 0,
        versionCount: 1
    });

    // Create the first version document
    await addDoc(collection(db, 'versions'), {
        chapterId: chapterRef.id,
        userId,
        content: '',
        createdAt: serverTimestamp(),
        isCurrent: true,
        versionNumber: 1,
        type: 'original',
        isArchived: false,
        wordCount: 0
    });

    await updateDoc(chapterRef, {
        currentVersionId: '', // Will be updated if we had the ID, but for now we'll rely on isCurrent
    });

    return chapterRef.id;
};

export const updateChapterStatus = async (chapterId: string, status: Chapter['status']) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        status,
        lastEdited: serverTimestamp()
    });
};

export const reorderChapters = async (reorderedChapters: Chapter[]) => {
    const batch = writeBatch(db);

    reorderedChapters.forEach((chapter, index) => {
        const chapterRef = doc(db, 'chapters', chapter.id);
        batch.update(chapterRef, {
            chapterNumber: index + 1,
            lastEdited: serverTimestamp()
        });
    });

    await batch.commit();
};

export const fetchLatestVersion = async (chapterId: string): Promise<Version | null> => {
    const q = query(
        collection(db, 'versions'),
        where('chapterId', '==', chapterId),
        where('isCurrent', '==', true)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Version;
};

export const saveVersion = async (chapterId: string, userId: string, content: string, wordCount: number, isNewVersion: boolean = false) => {
    const chapterRef = doc(db, 'chapters', chapterId);

    if (isNewVersion) {
        // Mark all other versions as not current
        const q = query(collection(db, 'versions'), where('chapterId', '==', chapterId), where('isCurrent', '==', true));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.update(d.ref, { isCurrent: false }));

        // Add new version
        const versionRef = collection(db, 'versions');
        await addDoc(versionRef, {
            chapterId,
            userId,
            content,
            createdAt: serverTimestamp(),
            isCurrent: true
        });

        // Update chapter version count and metadata
        await updateDoc(chapterRef, {
            versionCount: increment(1),
            wordCount,
            lastEdited: serverTimestamp()
        });

        await batch.commit();
    } else {
        // Find current version and update it
        const q = query(
            collection(db, 'versions'),
            where('chapterId', '==', chapterId),
            where('isCurrent', '==', true),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            await updateDoc(snapshot.docs[0].ref, {
                content,
                updatedAt: serverTimestamp()
            });
        }

        // Update chapter word count and metadata
        await updateDoc(chapterRef, {
            wordCount,
            lastEdited: serverTimestamp()
        });
    }
};

export const updateChapterTitle = async (chapterId: string, title: string) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        title,
        lastEdited: serverTimestamp()
    });
};

export const subscribeToVersions = (chapterId: string, callback: (versions: Version[]) => void) => {
    const q = query(
        collection(db, 'versions'),
        where('chapterId', '==', chapterId),
        orderBy('versionNumber', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const versions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Version[];
        callback(versions);
    });
};

export const setAsCurrentVersion = async (chapterId: string, versionId: string) => {
    const batch = writeBatch(db);

    // Find all versions for this chapter and set isCurrent to false
    const q = query(collection(db, 'versions'), where('chapterId', '==', chapterId), where('isCurrent', '==', true));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => batch.update(d.ref, { isCurrent: false }));

    // Set target version as current
    const versionRef = doc(db, 'versions', versionId);
    batch.update(versionRef, { isCurrent: true });

    // Update chapter metadata
    const chapterRef = doc(db, 'chapters', chapterId);
    batch.update(chapterRef, {
        currentVersionId: versionId,
        lastEdited: serverTimestamp()
    });

    await batch.commit();
};

export const archiveVersion = async (versionId: string, isArchived: boolean) => {
    const versionRef = doc(db, 'versions', versionId);
    await updateDoc(versionRef, { isArchived });
};

export const deleteVersion = async (versionId: string) => {
    const versionRef = doc(db, 'versions', versionId);
    await deleteDoc(versionRef);
};

export const createNewVersion = async (chapterId: string, userId: string, content: string, wordCount: number, type: Version['type'] = 'edited') => {
    const chapterRef = doc(db, 'chapters', chapterId);

    // Get latest version number
    const q = query(collection(db, 'versions'), where('chapterId', '==', chapterId), orderBy('versionNumber', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    const lastVersionNumber = snapshot.empty ? 0 : (snapshot.docs[0].data() as Version).versionNumber;

    const batch = writeBatch(db);

    // Mark previous current as not current
    const qCurrent = query(collection(db, 'versions'), where('chapterId', '==', chapterId), where('isCurrent', '==', true));
    const currentSnapshot = await getDocs(qCurrent);
    currentSnapshot.docs.forEach(d => batch.update(d.ref, { isCurrent: false }));

    // Add new version
    const newVersionRef = doc(collection(db, 'versions'));
    batch.set(newVersionRef, {
        chapterId,
        userId,
        content,
        createdAt: serverTimestamp(),
        isCurrent: true,
        versionNumber: lastVersionNumber + 1,
        type,
        isArchived: false,
        wordCount
    });

    // Update chapter
    batch.update(chapterRef, {
        versionCount: increment(1),
        currentVersionId: newVersionRef.id,
        wordCount,
        lastEdited: serverTimestamp()
    });

    await batch.commit();
    return newVersionRef.id;
};
export const updateButterflyAnalogy = async (chapterId: string, analogy: string, stage: Chapter['butterflyStage']) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        butterflyAnalogy: analogy,
        butterflyStage: stage,
        lastEdited: serverTimestamp()
    });
};
