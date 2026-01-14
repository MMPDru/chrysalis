import { Edit2, Eye, Sparkles, MoreVertical } from 'lucide-react';
import type { Chapter } from '../../lib/types';

interface ChapterCardProps {
    chapter: Chapter;
    onClick: () => void;
}

const ChapterCard = ({ chapter, onClick }: ChapterCardProps) => {
    const lastEditedStr = chapter.lastEdited
        ? new Date(chapter.lastEdited.seconds * 1000).toLocaleDateString()
        : 'Never';

    return (
        <div className="card chapter-card" onClick={onClick}>
            <div className="chapter-number-badge">{chapter.chapterNumber}</div>

            <div style={{ position: 'relative', height: '140px', background: '#f0f0f0', borderRadius: '0.5rem', marginBottom: '1rem', overflow: 'hidden' }}>
                {chapter.thumbnail ? (
                    <img src={chapter.thumbnail} alt={chapter.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ccc' }}>
                        <Sparkles size={48} />
                    </div>
                )}
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                    <span className={`status-badge status-${chapter.status}`}>
                        {chapter.status.replace('-', ' ')}
                    </span>
                </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{chapter.title}</h3>

            <div style={{ fontSize: '0.875rem', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{chapter.wordCount} words</span>
                <span>Edited {lastEditedStr}</span>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <button className="btn" style={{ padding: '0.5rem', background: 'var(--color-hover)' }} title="Edit">
                    <Edit2 size={16} />
                </button>
                <button className="btn" style={{ padding: '0.5rem', background: 'var(--color-hover)' }} title="Versions">
                    <Eye size={16} />
                </button>
                <button className="btn" style={{ padding: '0.5rem', background: 'var(--color-hover)' }} title="Visuals">
                    <Sparkles size={16} />
                </button>
                <button className="btn" style={{ padding: '0.5rem', background: 'transparent', marginLeft: 'auto' }}>
                    <MoreVertical size={16} />
                </button>
            </div>
        </div>
    );
};

export default ChapterCard;
