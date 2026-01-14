
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export const updateChapterImages = async (chapterId: string, thumbnail: string, fullImage: string) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        thumbnailUrl: thumbnail,
        fullImageUrl: fullImage
    });
};

export const addConceptVideo = async (chapterId: string, video: { url: string; title: string; type: string }) => {
    const chapterRef = doc(db, 'chapters', chapterId);
    await updateDoc(chapterRef, {
        conceptVideos: arrayUnion(video)
    });
};
