import type { Chapter } from '../../lib/types';
import { Edit2, Eye, Sparkles } from 'lucide-react';

interface ChapterListProps {
    chapters: Chapter[];
    onChapterClick: (chapter: Chapter) => void;
}

const ChapterList = ({ chapters, onChapterClick }: ChapterListProps) => {
    return (
        <div className="chapter-list">
            {chapters.map(chapter => (
                <div
                    key={chapter.id}
                    className="card"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer'
                    }}
                    onClick={() => onChapterClick(chapter)}
                >
                    <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        flexShrink: 0
                    }}>
                        {chapter.chapterNumber}
                    </div>

                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{chapter.title}</h4>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.8rem', color: '#666' }}>
                            <span>{chapter.wordCount} words</span>
                            <span>{chapter.versionCount} versions</span>
                        </div>
                    </div>

                    <span className={`status-badge status-${chapter.status}`}>
                        {chapter.status.replace('-', ' ')}
                    </span>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ padding: '0.5rem', background: 'var(--color-hover)' }}>
                            <Edit2 size={16} />
                        </button>
                        <button className="btn" style={{ padding: '0.5rem', background: 'var(--color-hover)' }}>
                            <Eye size={16} />
                        </button>
                        <button className="btn" style={{ padding: '0.5rem', background: 'var(--color-hover)' }}>
                            <Sparkles size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChapterList;
