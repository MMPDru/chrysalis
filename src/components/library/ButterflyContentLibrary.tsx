
import type { WisdomVideo, ButterflyReference } from '../../lib/types';
import { Sparkles, Quote, Clock } from 'lucide-react';

interface ButterflyContentLibraryProps {
    videos: WisdomVideo[];
    onUseReference?: (ref: ButterflyReference, video: WisdomVideo) => void;
}

const ButterflyContentLibrary = ({ videos, onUseReference }: ButterflyContentLibraryProps) => {
    return (
        <div className="butterfly-library animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--color-secondary)', color: 'white', padding: '0.5rem', borderRadius: '0.75rem' }}>
                    <Sparkles size={20} />
                </div>
                <div>
                    <h2 className="text-serif" style={{ margin: 0 }}>Metamorphosis Archive</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>Every butterfly reference in your collection, organized by author.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {videos.map(video => (
                    <div key={video.id} className="card" style={{ padding: '0' }}>
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--color-hover)' }}>
                            <img src={video.thumbnail} style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '0.4rem' }} alt="" />
                            <div>
                                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#999', fontWeight: 800 }}>{video.author}</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>{video.title}</div>
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {video.butterflyReferences.map((ref, idx) => (
                                <div key={idx} style={{ padding: '1rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={12} /> {ref.timestamp}
                                        </div>
                                        {onUseReference && (
                                            <button
                                                className="btn"
                                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                                onClick={() => onUseReference(ref, video)}
                                            >
                                                Use This
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#555', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                                        <Quote size={10} style={{ marginRight: '0.25rem', opacity: 0.3 }} />
                                        {ref.quote}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {videos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '1rem', border: '1px dashed #eee' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🦋</div>
                    <h3 className="text-serif">No butterflies captured yet</h3>
                    <p style={{ color: '#666' }}>Search for "Alan Watts butterfly" or "caterpillar metamorphosis" to start your collection.</p>
                </div>
            )}
        </div>
    );
};

export default ButterflyContentLibrary;
