
import type { Chapter } from '../../lib/types';

interface ButterflyDashboardWidgetProps {
    chapters: Chapter[];
}

const ButterflyDashboardWidget = ({ chapters }: ButterflyDashboardWidgetProps) => {
    const stats = {
        cocoon: chapters.filter(c => !c.butterflyStage || c.butterflyStage === 'cocoon').length,
        chrysalis: chapters.filter(c => c.butterflyStage === 'chrysalis').length,
        butterfly: chapters.filter(c => c.butterflyStage === 'butterfly').length,
    };

    return (
        <div className="card animate-fade-in" style={{ padding: '2rem', marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 className="text-serif" style={{ margin: 0, fontSize: '1.5rem' }}>The Butterfly Lifecycle</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>Tracking the transformation of your memoir.</p>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#999' }}>{stats.cocoon}</div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bbb' }}>Cocoons</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{stats.chrysalis}</div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bbb' }}>Chrysalis</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{stats.butterfly}</div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#bbb' }}>Butterflies</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                {chapters.map(chapter => (
                    <div
                        key={chapter.id}
                        style={{
                            minWidth: '140px',
                            padding: '1.25rem',
                            background: 'white',
                            border: '1px solid #eee',
                            borderRadius: '1rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.75rem',
                            boxShadow: 'var(--shadow-soft)',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            fontSize: '2rem',
                            filter: (!chapter.butterflyStage || chapter.butterflyStage === 'cocoon') ? 'grayscale(1)' : 'none',
                            opacity: (!chapter.butterflyStage || chapter.butterflyStage === 'cocoon') ? 0.5 : 1
                        }}>
                            {chapter.butterflyStage === 'butterfly' ? '🦋' : chapter.butterflyStage === 'chrysalis' ? '蛹' : '🐛'}
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>CH {chapter.chapterNumber}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{chapter.title}</div>

                        <div style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: chapter.butterflyStage === 'butterfly' ? 'var(--color-primary)' : '#eee',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.7rem'
                        }}>
                            {chapter.butterflyStage === 'butterfly' ? '✓' : ''}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', background: 'var(--color-hover)', padding: '1.5rem', borderRadius: '1rem', border: '1px dashed var(--color-primary-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>💡</div>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: '#555' }}>
                        <strong>The Golden Rule:</strong> Every chapter of your memoir should contain at least one butterfly or transformation metaphor to maintain thematic resonance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ButterflyDashboardWidget;
