import { Reorder } from 'framer-motion';
import type { Chapter } from '../../lib/types';
import { GripVertical } from 'lucide-react';

interface DraggableChapterListProps {
    chapters: Chapter[];
    onReorder: (newOrder: Chapter[]) => void;
}

const DraggableChapterList = ({ chapters, onReorder }: DraggableChapterListProps) => {
    return (
        <Reorder.Group axis="y" values={chapters} onReorder={onReorder} className="chapter-list">
            {chapters.map((chapter) => (
                <Reorder.Item
                    key={chapter.id}
                    value={chapter}
                    className="card"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '1rem 1.5rem',
                        cursor: 'grab'
                    }}
                >
                    <div style={{ color: '#ccc' }}>
                        <GripVertical size={20} />
                    </div>

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
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{chapter.status}</span>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: 'var(--color-secondary)', fontWeight: '500' }}>
                        Drag to reorder
                    </div>
                </Reorder.Item>
            ))}
        </Reorder.Group>
    );
};

export default DraggableChapterList;
