
import { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, Check, AlertCircle } from 'lucide-react';
import { scanForButterflies } from '../../lib/gemini';
import type { ScannerResult } from '../../lib/types';

interface ButterflyScannerProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    onSuggestAnalogy: () => void;
}

const ButterflyScanner = ({ isOpen, onClose, content, onSuggestAnalogy }: ButterflyScannerProps) => {
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<ScannerResult | null>(null);

    useEffect(() => {
        if (isOpen && content) {
            handleScan();
        }
    }, [isOpen]);

    const handleScan = async () => {
        setIsScanning(true);
        try {
            const data = await scanForButterflies(content);
            setResult(data);
        } catch (error) {
            console.error('Scan error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--color-secondary)', color: 'white', padding: '0.4rem', borderRadius: '0.5rem' }}>
                            <Wand2 size={20} />
                        </div>
                        <h3 className="text-serif" style={{ margin: 0 }}>Butterfly Scanner</h3>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={24} /></button>
                </div>

                {isScanning ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div className="metamorphosis-spinner" style={{ margin: '0 auto 1.5rem auto' }} />
                        <p style={{ fontStyle: 'italic', color: '#999' }}>Scanning for signs of transformation...</p>
                    </div>
                ) : result ? (
                    <div className="animate-fade-in">
                        {result.found ? (
                            <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid #c6f6d5', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#2f855a', fontWeight: 700, marginBottom: '1rem' }}>
                                    <Check size={20} /> Butterfly Found!
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#444' }}>
                                    Metaphor Strength: <span style={{ textTransform: 'uppercase', fontWeight: 800, fontSize: '0.8rem', color: 'var(--color-primary)' }}>{result.strength}</span>
                                </div>
                                <div style={{ marginTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#999', margin: '1rem 0 0.5rem 0' }}>Existing References:</h4>
                                    {result.references.map((ref, idx) => (
                                        <p key={idx} style={{ fontStyle: 'italic', color: '#666', fontSize: '0.9rem', borderLeft: '3px solid var(--color-secondary)', paddingLeft: '1rem' }}>
                                            "{ref}"
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid #fed7d7', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#c53030', fontWeight: 700, marginBottom: '1rem' }}>
                                    <AlertCircle size={20} /> No Butterfly Yet
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#777', margin: 0 }}>
                                    Your transformation hasn't been metaphorically captured yet. Let's find a place for it.
                                </p>
                            </div>
                        )}

                        <h4 className="text-serif" style={{ marginBottom: '1rem' }}>Suggested Insertion Points</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {result.suggestions?.map((s, idx) => (
                                <div key={idx} style={{ padding: '1.25rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '1rem' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>{s.point}</div>
                                    <p style={{ fontSize: '0.9rem', color: '#555', fontStyle: 'italic', margin: 0 }}>"{s.preview}"</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, gap: '0.5rem' }}
                                onClick={onSuggestAnalogy}
                            >
                                <Sparkles size={18} /> Run Suggestion Engine
                            </button>
                            <button className="btn" style={{ flex: 0.5 }} onClick={onClose}>Close</button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ButterflyScanner;
