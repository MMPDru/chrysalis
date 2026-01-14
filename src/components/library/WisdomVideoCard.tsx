
import { Play, Clock, Trash2, Info, Sparkles } from 'lucide-react';
import type { WisdomVideo } from '../../lib/types';

interface WisdomVideoCardProps {
    video: WisdomVideo;
    onView: (video: WisdomVideo) => void;
    onRemove?: (id: string) => void;
}

const WisdomVideoCard = ({ video, onView, onRemove }: WisdomVideoCardProps) => {
    return (
        <div className="card wisdom-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                    className="thumbnail"
                />
                <div
                    onClick={() => onView(video)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        opacity: 0,
                        transition: 'opacity 0.3s'
                    }}
                    className="hover-overlay"
                >
                    <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)'
                    }}>
                        <Play fill="currentColor" size={24} />
                    </div>
                </div>
                {video.butterflyReferences?.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--color-primary)',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Sparkles size={12} /> 🦋 {video.butterflyReferences.length}
                    </div>
                )}
            </div>

            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{
                        background: 'var(--color-hover)',
                        color: 'var(--color-primary)',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                    }}>
                        {video.author}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={10} /> {video.duration || 'Video'}
                    </span>
                </div>

                <h4 style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.4,
                    margin: '0 0 1rem 0',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    height: '2.8em'
                }} className="text-serif">
                    {video.title}
                </h4>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', background: 'var(--color-primary)', color: 'white' }}
                        onClick={() => onView(video)}
                    >
                        <Info size={14} /> View Details
                    </button>
                    {onRemove && (
                        <button
                            className="btn"
                            style={{ padding: '0.5rem', background: '#f5f5f5', color: '#666' }}
                            onClick={() => onRemove(video.id)}
                            title="Remove from Library"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WisdomVideoCard;
