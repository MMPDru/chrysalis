import { useEffect, useState } from 'react';
import { X, ExternalLink, History, Wand2, Trash2 } from 'lucide-react';
import type { Chapter, Version } from '../../lib/types';
import { fetchLatestVersion, softDeleteChapter } from '../../lib/chapters';

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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (chapter) {
            setTimeout(() => setLoading(true), 0);
            fetchLatestVersion(chapter.id).then(v => {
                setVersion(v);
                setLoading(false);
            });
        }
    }, [chapter]);

    const handleDelete = async () => {
        if (!chapter) return;
        setIsDeleting(true);
        try {
            await softDeleteChapter(chapter.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete chapter:', error);
            alert('Failed to delete chapter. Please try again.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

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

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
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

                {/* Delete Section */}
                {!showDeleteConfirm ? (
                    <button
                        className="btn"
                        style={{
                            width: '100%',
                            background: 'transparent',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            marginTop: '0.5rem'
                        }}
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 size={18} />
                        Move to Trash
                    </button>
                ) : (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginTop: '0.5rem'
                    }}>
                        <p style={{ margin: '0 0 1rem 0', color: '#dc2626', fontWeight: 500 }}>
                            Are you sure you want to move this chapter to trash?
                        </p>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#666' }}>
                            The chapter can be restored from the Dashboard later. Images and videos will remain in your library.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn"
                                style={{ flex: 1, background: '#dc2626', color: 'white' }}
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Yes, Move to Trash'}
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 1 }}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChapterQuickView;
