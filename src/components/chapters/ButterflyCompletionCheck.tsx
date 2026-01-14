
import { Sparkles } from 'lucide-react';

interface ButterflyCompletionCheckProps {
    isOpen: boolean;
    onClose: () => void;
    onRunSuggestions: () => void;
    onOverride: () => void;
}

const ButterflyCompletionCheck = ({ isOpen, onClose, onRunSuggestions, onOverride }: ButterflyCompletionCheckProps) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
            <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🐛</div>
                <h2 className="text-serif" style={{ marginBottom: '1rem' }}>Your butterfly hasn't emerged yet!</h2>
                <p style={{ color: '#666', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Our scanners show this chapter is missing a strong metamorphosis analogy. Deepen your story's resonance by adding one.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '1rem', gap: '0.5rem' }}
                        onClick={() => {
                            onRunSuggestions();
                            onClose();
                        }}
                    >
                        <Sparkles size={18} /> Run Butterfly Suggestion Engine
                    </button>
                    <button
                        className="btn"
                        style={{ padding: '1rem', background: 'transparent', color: '#999', fontSize: '0.85rem' }}
                        onClick={onOverride}
                    >
                        Complete without butterfly (override)
                    </button>
                    <button
                        className="btn"
                        style={{ padding: '1rem', background: 'white' }}
                        onClick={onClose}
                    >
                        Keep Writing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ButterflyCompletionCheck;
