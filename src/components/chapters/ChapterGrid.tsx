import type { Chapter } from '../../lib/types';
import ChapterCard from './ChapterCard';

interface ChapterGridProps {
    chapters: Chapter[];
    onChapterClick: (chapter: Chapter) => void;
}

const ChapterGrid = ({ chapters, onChapterClick }: ChapterGridProps) => {
    return (
        <div className="chapter-grid">
            {chapters.map(chapter => (
                <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    onClick={() => onChapterClick(chapter)}
                />
            ))}
        </div>
    );
};

export default ChapterGrid;
