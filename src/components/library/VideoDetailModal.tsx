
import { X, Youtube, BookOpen, Quote, Sparkles, Clock, Trash2, Send } from 'lucide-react';
import type { WisdomVideo } from '../../lib/types';

interface VideoDetailModalProps {
    video: WisdomVideo | null;
    onClose: () => void;
    onRemove: (id: string) => void;
    onEnhance: () => void;
}

const VideoDetailModal = ({ video, onClose, onRemove, onEnhance }: VideoDetailModalProps) => {
    if (!video) return null;

    const handleUseInChapter = () => {
        onEnhance();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                maxWidth: '1200px',
                width: '95%',
                height: '92vh',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.4rem', borderRadius: '0.5rem' }}>
                            <Youtube size={20} />
                        </div>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 700, textTransform: 'uppercase' }}>{video.author}</span>
                            <h3 className="text-serif" style={{ margin: 0, fontSize: '1.1rem' }}>{video.title}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={24} /></button>
                </div>

                {/* Main content area */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left side - Player and Summary */}
                    <div style={{ flex: 1.2, overflowY: 'auto', padding: '2rem', borderRight: '1px solid #eee' }}>
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '1rem', overflow: 'hidden', boxShadow: 'var(--shadow-card)', marginBottom: '2rem' }}>
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>

                        <div className="summary-section" style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                                <Sparkles size={18} /> AI Summary
                            </h4>
                            <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#444' }}>{video.summary}</p>
                        </div>

                        <div className="lessons-section" style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                                <BookOpen size={18} /> Key Lessons
                            </h4>
                            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {video.lessons?.map((lesson, idx) => (
                                    <li key={idx} style={{ color: '#444', lineHeight: 1.5 }}>{lesson}</li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} onClick={handleUseInChapter}>
                                <Send size={18} /> Use in Chapter Enhancement
                            </button>
                            <button className="btn" style={{ padding: '1rem', background: '#fff5f5', color: '#d9534f', border: '1px solid #ffebeb' }} onClick={() => { onRemove(video.id); onClose(); }}>
                                <Trash2 size={18} /> Remove from Library
                            </button>
                        </div>
                    </div>

                    {/* Right side - Transcript and Butterfly Refs */}
                    <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', background: '#fcfcfc' }}>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>
                                <Sparkles size={18} /> Butterfly References
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {video.butterflyReferences?.length > 0 ? (
                                    video.butterflyReferences.map((ref, idx) => (
                                        <div key={idx} style={{ padding: '1.25rem', background: 'white', borderRadius: '1rem', boxShadow: 'var(--shadow-soft)', borderLeft: '4px solid var(--color-secondary)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 700 }}>
                                                <Clock size={14} /> {ref.timestamp}
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic', marginBottom: 0 }}>
                                                <Quote size={12} style={{ opacity: 0.3, marginRight: '0.25rem' }} />
                                                {ref.quote}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#999', fontSize: '0.85rem' }}>
                                        No specific butterfly mentions found, but the wisdom remains.
                                    </div>
                                )}
                            </div>

                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '3rem 0 1.5rem 0', color: '#666' }}>
                                Full Transcript
                            </h4>
                            <div style={{
                                fontSize: '0.9rem',
                                color: '#777',
                                lineHeight: 1.6,
                                background: 'white',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                border: '1px solid #eee',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {video.transcript}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoDetailModal;
