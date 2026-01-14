import { useEffect, useState } from 'react';
import { X, ExternalLink, History, Wand2 } from 'lucide-react';
import type { Chapter, Version } from '../../lib/types';
import { fetchLatestVersion } from '../../lib/chapters';

interface ChapterQuickViewProps {
    chapter: Chapter | null;
    onClose: () => void;
    onOpenEditor: (id: string) => void;
    onViewVersions: (id: string) => void;
    onEnhance: (id: string) => void;
}

const ChapterQuickView = ({ chapter, onClose, onOpenEditor, onViewVersions, onEnhance }: ChapterQuickViewProps) => {
    const [version, setVersion] = useState<Version | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (chapter) {
            setTimeout(() => setLoading(true), 0);
            fetchLatestVersion(chapter.id).then(v => {
                setVersion(v);
                setLoading(false);
            });
        }
    }, [chapter]);

    if (!chapter) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <span className={`status-badge status-${chapter.status}`} style={{ marginBottom: '0.5rem' }}>
                            {chapter.status}
                        </span>
                        <h2 style={{ margin: 0 }}>Chapter {chapter.chapterNumber}: {chapter.title}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', color: '#666' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{
                    background: '#f9f9f9',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    minHeight: '200px',
                    marginBottom: '2rem',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.8,
                    color: '#444'
                }}>
                    {loading ? (
                        <p>Loading preview...</p>
                    ) : version?.content ? (
                        <p>{version.content.substring(0, 500)}{version.content.length > 500 ? '...' : ''}</p>
                    ) : (
                        <p style={{ fontStyle: 'italic', color: '#999' }}>No content yet. Start writing to see a preview.</p>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-hover)', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-primary)' }}>{chapter.wordCount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Words</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-hover)', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-primary)' }}>{chapter.versionCount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Versions</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-hover)', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                            {chapter.status === 'complete' ? '🦋' : chapter.status === 'review' ? '蛹' : '🐛'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Stage</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => onOpenEditor(chapter.id)}
                    >
                        <ExternalLink size={18} />
                        Open Full Editor
                    </button>
                    <button
                        className="btn"
                        style={{ flex: 1, background: 'var(--color-secondary)', color: 'white' }}
                        onClick={() => onViewVersions(chapter.id)}
                    >
                        <History size={18} />
                        View All Versions
                    </button>
                    <button
                        className="btn"
                        style={{ flex: 1, background: 'rgba(107, 73, 132, 0.1)', color: 'var(--color-primary)', border: '1px solid var(--color-primary-light)' }}
                        onClick={() => onEnhance(chapter.id)}
                    >
                        <Wand2 size={18} />
                        Chrysalis Enhancement
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChapterQuickView;
